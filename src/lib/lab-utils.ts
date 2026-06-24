import { DAY_MAP } from "./lab-constants";
import type { LabSlot, LabRoomData } from "./lab-types";

/**
 * Converts a time string (e.g. "08:30", "08:00 AM", "14:30") to minutes since midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  // Matches "HH:MM" or "H:MM" (24-hour style, e.g. "08:30", "14:45")
  let match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }

  // Matches "HH:MM AM/PM" or "H:MM AM/PM" (12-hour style, e.g. "08:00 AM", "2:30 PM")
  match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  return 0;
}

/**
 * Formats minutes since midnight back into a 12-hour display string (e.g., 630 -> "10:30 AM")
 */
export function formatMinutesToTime(minutes: number): string {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${mins.toString().padStart(2, "0")} ${ampm}`;
}

export interface LabRoomStatus {
  isOccupied: boolean;
  currentClass?: LabSlot;
  nextClass?: LabSlot;
  freeUntil?: string; // e.g. "11:00"
  occupiedUntil?: string; // e.g. "12:20"
  nextFreeTime?: string; // e.g. "3:20 PM" when consecutive classes end
}

/**
 * Computes the real-time status of a lab room at a given day and time (in minutes).
 */
export function getLabRoomStatus(
  lab: LabRoomData,
  day: string,
  timeMinutes: number
): LabRoomStatus {
  const schedulesOnDay = lab.schedules.filter((s) => s.day === day);

  // 1. Check if currently occupied
  for (const slot of schedulesOnDay) {
    const startMins = parseTimeToMinutes(slot.startTime);
    const endMins = parseTimeToMinutes(slot.endTime);

    if (timeMinutes >= startMins && timeMinutes < endMins) {
      // Find the end time of consecutive classes back-to-back (threshold <= 20 minutes gap)
      let currentEnd = endMins;
      let foundNext = true;
      while (foundNext) {
        const nextSlot = schedulesOnDay.find((s) => {
          const sStart = parseTimeToMinutes(s.startTime);
          // Check if it starts exactly as the current one ends, or within a 20-minute transition gap
          return sStart >= currentEnd - 5 && sStart <= currentEnd + 20;
        });
        if (nextSlot) {
          currentEnd = parseTimeToMinutes(nextSlot.endTime);
        } else {
          foundNext = false;
        }
      }

      return {
        isOccupied: true,
        currentClass: slot,
        occupiedUntil: slot.endTime,
        nextFreeTime: formatMinutesToTime(currentEnd),
      };
    }
  }

  // 2. Otherwise it is free. Find the next class on the same day.
  let nextClass: LabSlot | undefined;
  let minDiff = Infinity;

  schedulesOnDay.forEach((slot) => {
    const startMins = parseTimeToMinutes(slot.startTime);
    const diff = startMins - timeMinutes;
    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      nextClass = slot;
    }
  });

  return {
    isOccupied: false,
    nextClass,
    freeUntil: nextClass ? (nextClass as LabSlot).startTime : undefined,
  };
}

/**
 * Gets current day code and time details relative to the user's system time.
 */
export function getCurrentTimeInfo(): {
  day: string;
  timeString: string;
  timeMinutes: number;
} {
  const now = new Date();
  const day = DAY_MAP[now.getDay()] || "FRI";
  const hour = now.getHours();
  const minute = now.getMinutes();

  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  const timeString = `${displayHour}:${displayMinute} ${ampm}`;
  const timeMinutes = hour * 60 + minute;

  return { day, timeString, timeMinutes };
}
