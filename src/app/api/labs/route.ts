import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const globalForLabs = globalThis as unknown as {
  labsCache: any;
  labsLastFetched: number;
};

if (!globalForLabs.labsCache) {
  globalForLabs.labsCache = null;
  globalForLabs.labsLastFetched = 0;
}

interface RawClassSchedule {
  startTime: string;
  endTime: string;
  day: string;
}

interface RawCourse {
  roomName: string | null;
  courseCode: string;
  courseName: string;
  sectionName: string;
  faculties: string | null;
  sectionSchedule?: {
    classSchedules?: RawClassSchedule[] | null;
  } | null;
  // Nested lab properties from USIS CDN JSON
  labRoomName?: string | null;
  labSchedules?: RawClassSchedule[] | null;
  labCourseCode?: string | null;
  labName?: string | null;
  labFaculties?: string | null;
}

const DAY_MAP: Record<string, string> = {
  SUNDAY: "SUN",
  MONDAY: "MON",
  TUESDAY: "TUE",
  WEDNESDAY: "WED",
  THURSDAY: "THU",
  FRIDAY: "FRI",
  SATURDAY: "SAT",
};

export async function GET() {
  try {
    const now = Date.now();
    const CACHE_TTL = 86400 * 1000; // 24 hours

    if (
      globalForLabs.labsCache &&
      now - globalForLabs.labsLastFetched < CACHE_TTL
    ) {
      return NextResponse.json(globalForLabs.labsCache, {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      });
    }

    const response = await fetch(
      "https://usis-cdn.eniamza.com/connect-migrate.json",
      {
        cache: "no-store", // Bypass Next.js' native 2MB-limited fetch cache
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch live schedule data: ${response.statusText}`,
      );
    }

    const rawData = await response.json();
    const courses: RawCourse[] = rawData.courses || [];

    let oldRooms: string[] = [];
    try {
      const oldFilePath = path.join(
        process.cwd(),
        "public",
        "CSE_Lab_Schedule.json",
      );
      if (fs.existsSync(oldFilePath)) {
        const oldData = JSON.parse(fs.readFileSync(oldFilePath, "utf8"));
        const roomsSet = new Set<string>(
          oldData.map((x: any) => String(x["Lab Room"] || x["Lab room"] || "")),
        );
        oldRooms = Array.from(roomsSet).filter(
          (r: string) => r && r.endsWith("L"),
        );
      }
    } catch (err) {
      console.error("Failed to read old lab schedule file:", err);
    }

    const labsMap: Record<
      string,
      {
        roomName: string;
        tags: string[];
        schedules: Array<{
          day: string;
          startTime: string;
          endTime: string;
          courseCode: string;
          courseName: string;
          sectionName: string;
          faculties: string;
        }>;
      }
    > = {};

    // Initialize map with known CSE labs so they appear even if they have no scheduled classes
    oldRooms.forEach((room) => {
      labsMap[room] = { roomName: room, tags: ["CSE"], schedules: [] };
    });

    // Group schedules by lab room
    courses.forEach((c) => {
      // 1. Direct Labs (roomName ends in 'L')
      const room = c.roomName;
      if (room && room.endsWith("L")) {
        if (!labsMap[room]) {
          labsMap[room] = { roomName: room, tags: [], schedules: [] };
        }

        const sched = c.sectionSchedule;
        if (sched && Array.isArray(sched.classSchedules)) {
          sched.classSchedules.forEach((slot) => {
            const day = DAY_MAP[slot.day];
            if (!day) return;

            const startTime = slot.startTime.substring(0, 5);
            const endTime = slot.endTime.substring(0, 5);

            labsMap[room].schedules.push({
              day,
              startTime,
              endTime,
              courseCode: c.courseCode,
              courseName: c.courseName,
              sectionName: c.sectionName,
              faculties: c.faculties || "",
            });
          });
        }
      }

      // 2. Nested/Theory-linked Labs (labRoomName ends in 'L')
      const labRoom = c.labRoomName;
      if (labRoom && labRoom.endsWith("L")) {
        if (!labsMap[labRoom]) {
          labsMap[labRoom] = { roomName: labRoom, tags: [], schedules: [] };
        }

        if (Array.isArray(c.labSchedules)) {
          c.labSchedules.forEach((slot) => {
            const day = DAY_MAP[slot.day];
            if (!day) return;

            const startTime = slot.startTime.substring(0, 5);
            const endTime = slot.endTime.substring(0, 5);

            labsMap[labRoom].schedules.push({
              day,
              startTime,
              endTime,
              courseCode: c.labCourseCode || c.courseCode,
              courseName: c.labName || c.courseName,
              sectionName: c.sectionName,
              faculties: c.labFaculties || c.faculties || "",
            });
          });
        }
      }
    });

    // Classify rooms and sort schedules
    const daysOrder = ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"];
    const labs = Object.values(labsMap).map((lab) => {
      // Sort schedules by day and then by start time
      lab.schedules.sort((a, b) => {
        const dayDiff = daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      });

      // Classify tags based on course prefixes
      const prefixes = new Set<string>();
      lab.schedules.forEach((s) => {
        const prefix = s.courseCode.replace(/[0-9].*$/, "");
        prefixes.add(prefix);
      });

      const tags = new Set<string>();
      prefixes.forEach((p) => {
        if (p === "CSE") {
          tags.add("CSE");
        } else if (p === "EEE" || p === "ECE") {
          tags.add("EEE/ECE");
        } else if (p === "BTE" || p === "MIC") {
          tags.add("Biotech/Micro");
        } else if (p === "ARC") {
          tags.add("Architecture");
        } else {
          tags.add("Others");
        }
      });

      // If the room is in the CSE lab schedule, always include the CSE tag
      if (oldRooms.includes(lab.roomName)) {
        tags.add("CSE");
      }

      // If a room runs no scheduled courses but is a lab, tag it
      if (tags.size === 0) {
        tags.add("Others");
      }

      lab.tags = Array.from(tags);
      return lab;
    });

    // Sort labs alphabetically by room name
    labs.sort((a, b) => a.roomName.localeCompare(b.roomName));

    const finalResponse = {
      metadata: {
        currentSemester: rawData.metadata?.currentSemester,
        lastUpdated: rawData.metadata?.lastUpdated || new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
      },
      labs,
    };

    globalForLabs.labsCache = finalResponse;
    globalForLabs.labsLastFetched = now;

    return NextResponse.json(finalResponse, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error: any) {
    console.error("Error in labs API route:", error);
    return NextResponse.json(
      {
        error:
          "Could not fetch or process lab schedules. Please try again later.",
      },
      { status: 500 },
    );
  }
}
