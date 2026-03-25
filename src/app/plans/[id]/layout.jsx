import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getPlanPreviewData(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const db = await getDb();
  const plan = await db.collection("studyplans").findOne(
    { _id: new ObjectId(id), isPublic: true },
    {
      projection: {
        title: 1,
        shortDescription: 1,
        courseCode: 1,
      },
    },
  );

  return plan;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const canonicalPath = id ? `/plans/${id}` : "/plans";

  if (!id) {
    return {
      alternates: { canonical: canonicalPath },
    };
  }

  try {
    const plan = await getPlanPreviewData(id);

    if (!plan) {
      return {
        title: "Study Plan",
        description: "Browse public study plans on The Study Sync.",
        alternates: { canonical: canonicalPath },
      };
    }

    const planTitle = plan.courseCode
      ? `${plan.courseCode} - ${plan.title}`
      : plan.title;
    const description =
      plan.shortDescription ||
      "Explore this public study plan on The Study Sync.";

    return {
      title: planTitle,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: planTitle,
        description,
        url: `${SITE_URL}${canonicalPath}`,
        type: "article",
        images: [
          {
            url: "/screenshot-1.png",
            width: 1200,
            height: 630,
            alt: "The Study Sync - Collaborative Study Plan Manager",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: planTitle,
        description,
        images: ["/screenshot-1.png"],
      },
    };
  } catch (error) {
    console.error("Failed to generate plan metadata:", error);

    return {
      title: "Study Plan",
      description: "Browse public study plans on The Study Sync.",
      alternates: { canonical: canonicalPath },
    };
  }
}

export default function PlanDetailsLayout({ children }) {
  return children;
}
