import { MongoClient } from "mongodb";
import dns from "node:dns";

/**
 * MongoDB connection for Next.js API Routes
 * Uses native MongoDB driver with connection caching.
 *
 * Atlas `mongodb+srv://` strings need an SRV/TXT DNS lookup that some networks
 * refuse (querySrv ECONNREFUSED). This module degrades gracefully:
 *   1. Try the SRV URI directly (with a public DNS resolver hint).
 *   2. If the SRV lookup is refused, resolve SRV + TXT over DNS-over-HTTPS
 *      (port 443) and connect with an equivalent standard `mongodb://` URI.
 *   3. A manual MONGODB_URI_FALLBACK, if set, always takes priority over DoH.
 */

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

const MONGODB_URI = process.env.MONGODB_URI;
const FALLBACK_URI = process.env.MONGODB_URI_FALLBACK;
const IS_SRV = MONGODB_URI.startsWith("mongodb+srv://");
const options = {};

/**
 * Hint Node's resolver at public DNS servers for the SRV lookup. Cheap and
 * fixes networks where the local resolver simply doesn't return SRV records.
 * Configurable via MONGODB_DNS_SERVERS (comma list); harmless if it fails.
 */
function configureDnsForAtlasSrv() {
  if (!IS_SRV) return;

  const servers = (process.env.MONGODB_DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (servers.length === 0) return;

  try {
    dns.setServers(servers);
  } catch (error) {
    console.warn(
      "Failed to set custom DNS servers for MongoDB SRV lookup:",
      error?.message,
    );
  }
}

/**
 * Resolve a DNS record via DNS-over-HTTPS (JSON API). Tries Google then
 * Cloudflare. Returns the array of Answer records.
 */
async function resolveViaDoH(name, type) {
  const endpoints = [
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
      name,
    )}&type=${type}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/dns-json" },
      });
      if (!res.ok) continue;
      const json = await res.json();
      if (Array.isArray(json.Answer) && json.Answer.length > 0) {
        return json.Answer;
      }
    } catch {
      // try next provider
    }
  }
  throw new Error(`DNS-over-HTTPS resolution failed for ${type} ${name}`);
}

/**
 * Convert a `mongodb+srv://` URI into a standard `mongodb://` URI by resolving
 * the SRV (hosts) and TXT (default options) records over HTTPS.
 */
async function buildStandardUriViaDoH(srvUri) {
  // Parse with https semantics so credentials/host/path/query behave correctly.
  const parsed = new URL(srvUri.replace(/^mongodb\+srv:\/\//, "https://"));
  const clusterHost = parsed.hostname;

  // SRV: "<priority> <weight> <port> <target>." per answer.
  const srvAnswers = await resolveViaDoH(`_mongodb._tcp.${clusterHost}`, "SRV");
  const hosts = srvAnswers.map((a) => {
    const [, , port, target] = a.data.trim().split(/\s+/);
    return `${target.replace(/\.$/, "")}:${port}`;
  });
  if (hosts.length === 0) {
    throw new Error(`No SRV hosts resolved for ${clusterHost}`);
  }

  // mongodb+srv implies TLS; TXT carries default options (authSource, replicaSet).
  const params = new URLSearchParams();
  params.set("ssl", "true");
  try {
    const txtAnswers = await resolveViaDoH(clusterHost, "TXT");
    const txt = txtAnswers
      .map((a) => a.data.replace(/^"|"$/g, ""))
      .join("&");
    for (const pair of txt.split("&")) {
      const [k, v] = pair.split("=");
      if (k) params.set(k, v ?? "");
    }
  } catch {
    // TXT is optional; proceed with whatever the original URI carries.
  }
  // Options on the original URI win over TXT defaults.
  for (const [k, v] of parsed.searchParams.entries()) params.set(k, v);

  const auth = parsed.username
    ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ""}@`
    : "";
  const dbPath =
    parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/";

  return `mongodb://${auth}${hosts.join(",")}${dbPath}?${params.toString()}`;
}

async function connectWithFallback() {
  configureDnsForAtlasSrv();

  try {
    return await new MongoClient(MONGODB_URI, options).connect();
  } catch (error) {
    const srvLookupFailed =
      IS_SRV &&
      (error?.syscall === "querySrv" || error?.syscall === "queryTxt");

    if (!srvLookupFailed) {
      console.error("MongoDB connection failed:", {
        name: error?.name,
        code: error?.code,
        syscall: error?.syscall,
        message: error?.message,
      });
      throw error;
    }

    // 1) Manual non-SRV fallback wins if provided.
    if (FALLBACK_URI) {
      console.warn(
        "MongoDB SRV lookup failed; connecting via MONGODB_URI_FALLBACK.",
      );
      return await new MongoClient(FALLBACK_URI, options).connect();
    }

    // 2) Resolve over DNS-over-HTTPS and connect with a standard URI.
    console.warn(
      "MongoDB SRV lookup failed; resolving records via DNS-over-HTTPS (port 443).",
    );
    const standardUri = await buildStandardUriViaDoH(MONGODB_URI);
    return await new MongoClient(standardUri, options).connect();
  }
}

let clientPromise;

if (process.env.NODE_ENV === "development") {
  // Cache on the global to survive hot reloads; clear on failure so the next
  // request can retry instead of awaiting a permanently-rejected promise.
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectWithFallback().catch((error) => {
      global._mongoClientPromise = undefined;
      throw error;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = connectWithFallback();
}

/**
 * Get database instance
 */
export async function getDb() {
  try {
    const client = await clientPromise;
    return client.db("study_sync");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export default clientPromise;
