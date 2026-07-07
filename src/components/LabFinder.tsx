"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  BookOpen,
  Users,
  Info,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DAYS,
  TIMES,
  DAY_LABELS,
  LAB_TAGS,
  type Day,
  type Time,
  type LabTag,
} from "@/lib/lab-constants";
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  getLabRoomStatus,
  getCurrentTimeInfo,
} from "@/lib/lab-utils";
import type {
  LabRoomData,
  LabSlot,
  LabsAPIResponse,
  LabMetadata,
} from "@/lib/lab-types";

// Helper function to format countdown durations nicely
function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 mins";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  icon: React.ReactNode;
  placeholder: string;
  labelMap?: Record<string, string>;
  id: string;
}

function Select({
  label,
  value,
  onChange,
  options,
  icon,
  placeholder,
  labelMap,
  id,
}: SelectProps) {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 select-none">
          {label}
        </span>
      </div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-xl border border-border bg-background",
          "h-9 pl-14 sm:pl-16 pr-8 text-xs font-semibold",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20",
          "transition-colors cursor-pointer",
          !value && "text-muted-foreground",
        )}
        aria-label={label}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labelMap ? labelMap[option] || option : option}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

// Get tag styling classes helper
function getTagClass(tag: string): string {
  switch (tag) {
    case "CSE":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "EEE/ECE":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "Biotech/Micro":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "Architecture":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
}

function getRoomDisplayName(roomName: string): string {
  if (roomName === "10G-33L" || roomName === "10G-34L") {
    return `${roomName} (ST Room)`;
  }
  return roomName;
}

export function LabFinder() {
  const [labs, setLabs] = useState<LabRoomData[]>([]);
  const [metadata, setMetadata] = useState<LabMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<LabTag>("All");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Available" | "Busy"
  >("All");
  const [sortBy, setSortBy] = useState<
    "Name" | "FreeMinsDesc" | "AvailableFirst" | "BusyFirst"
  >("FreeMinsDesc");

  // Selection states
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Live time ticker state
  const [currentTimeInfo, setCurrentTimeInfo] = useState(getCurrentTimeInfo());

  // Modal state
  const [modalRoom, setModalRoom] = useState<LabRoomData | null>(null);

  // Sync ticker every 30 seconds for live mode
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeInfo(getCurrentTimeInfo());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch lab schedules
  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/labs");
      if (!response.ok) {
        throw new Error("Failed to load schedules");
      }
      const data: LabsAPIResponse = await response.json();
      const has33 = data.labs.some((lab) => lab.roomName === "10G-33L");
      const has34 = data.labs.some((lab) => lab.roomName === "10G-34L");

      let updatedLabs = data.labs.map((lab) => {
        const isStLab = lab.roomName === "10G-33L" || lab.roomName === "10G-34L";
        if (isStLab) {
          return {
            ...lab,
            tags: ["CSE"],
            schedules: [],
          };
        }
        return lab;
      });

      if (!has33) {
        updatedLabs.push({
          roomName: "10G-33L",
          tags: ["CSE"],
          schedules: [],
        });
      }

      if (!has34) {
        updatedLabs.push({
          roomName: "10G-34L",
          tags: ["CSE"],
          schedules: [],
        });
      }

      setLabs(updatedLabs);
      setMetadata(data.metadata);
    } catch {
      setError(
        "Could not load lab schedules. Please check your internet connection.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Set default day/time when live mode is disabled
  useEffect(() => {
    if (!isLiveMode && !selectedDay && !selectedTime) {
      const { day } = getCurrentTimeInfo();
      setSelectedDay(day === "FRI" ? "SAT" : day);
      setSelectedTime("11:00 AM");
    }
  }, [isLiveMode, selectedDay, selectedTime]);

  // Compute active target day and time minutes for filtering
  const targetTimeData = useMemo(() => {
    if (isLiveMode) {
      return {
        day: currentTimeInfo.day,
        timeMinutes: currentTimeInfo.timeMinutes,
        timeStr: currentTimeInfo.timeString,
        isActualToday: true,
      };
    }

    if (!selectedDay || !selectedTime) {
      return null;
    }

    return {
      day: selectedDay,
      timeMinutes: parseTimeToMinutes(selectedTime),
      timeStr: selectedTime,
      isActualToday: selectedDay === currentTimeInfo.day,
    };
  }, [isLiveMode, currentTimeInfo, selectedDay, selectedTime]);

  // Filter and compute statuses
  const processedLabs = useMemo(() => {
    if (!targetTimeData) return [];

    // 1. Filter by tag and search query first, then compute status
    const mapped = labs
      .filter((lab) => {
        // Tag filter
        if (selectedTag !== "All" && !lab.tags.includes(selectedTag)) {
          return false;
        }
        // Search query filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase().trim();
          const normalizedQuery = query.replace(/[\s-]/g, "");
          
          const matchesOriginal = lab.roomName.toLowerCase().replace(/[\s-]/g, "").includes(normalizedQuery);
          const displayName = getRoomDisplayName(lab.roomName).toLowerCase().replace(/[\s-]/g, "");
          const matchesDisplay = displayName.includes(normalizedQuery);
          
          let matchesCourses = false;
          if (lab.roomName === "10G-33L") {
            matchesCourses = "cse110,cse111,cse230,studenttutor,tutoring,stroom".includes(normalizedQuery);
          } else if (lab.roomName === "10G-34L") {
            matchesCourses = "cse220,cse221,cse250,cse251,cse260,studenttutor,tutoring,stroom".includes(normalizedQuery);
          }

          if (!matchesOriginal && !matchesDisplay && !matchesCourses) {
            return false;
          }
        }
        return true;
      })
      .map((lab) => {
        const isStLab = lab.roomName === "10G-33L" || lab.roomName === "10G-34L";
        
        const status = isStLab
          ? { isOccupied: false }
          : getLabRoomStatus(
              lab,
              targetTimeData.day,
              targetTimeData.timeMinutes,
            );

        let subtitle = "";
        let durationStr = "";
        let freeMins = 0;

        if (isStLab) {
          if (lab.roomName === "10G-33L") {
            subtitle = "CSE110, CSE111, CSE230";
          } else {
            subtitle = "CSE220, CSE221, CSE250, CSE251, CSE260";
          }
          durationStr = "Open for Tutoring";
          freeMins = 1440;
        } else if (status.isOccupied && status.currentClass) {
          subtitle = `${status.currentClass.courseCode} (Sec ${status.currentClass.sectionName})`;
          if (status.nextFreeTime) {
            if (targetTimeData.isActualToday && isLiveMode) {
              const freeMinsTarget = parseTimeToMinutes(status.nextFreeTime);
              const remaining = freeMinsTarget - targetTimeData.timeMinutes;
              durationStr =
                remaining > 0
                  ? `Free in ${formatDuration(remaining)}`
                  : "Free now";
            } else {
              durationStr = `Free starting at ${status.nextFreeTime}`;
            }
          } else {
            const classEndStr = status.currentClass.endTime;
            if (targetTimeData.isActualToday && isLiveMode) {
              const classEndMins = parseTimeToMinutes(classEndStr);
              const remaining = classEndMins - targetTimeData.timeMinutes;
              durationStr =
                remaining > 0 ? `Ends in ${formatDuration(remaining)}` : "";
            } else {
              durationStr = `Occupied until ${formatMinutesToTime(parseTimeToMinutes(classEndStr))}`;
            }
          }
          freeMins = 0;
        } else {
          const nextStartStr = status.freeUntil;
          if (nextStartStr) {
            const nextStartMins = parseTimeToMinutes(nextStartStr);
            subtitle = `Next class: ${status.nextClass?.courseCode || ""}`;
            if (targetTimeData.isActualToday && isLiveMode) {
              const remaining = nextStartMins - targetTimeData.timeMinutes;
              durationStr =
                remaining > 0 ? `Free for ${formatDuration(remaining)}` : "";
              freeMins = remaining > 0 ? remaining : 0;
            } else {
              durationStr = `Free until ${formatMinutesToTime(nextStartMins)}`;
              freeMins = nextStartMins - targetTimeData.timeMinutes;
            }
          } else {
            subtitle = "No more classes scheduled";
            durationStr = "Free all day";
            freeMins = 1440; // Max free minutes representing all day
          }
        }

        return {
          ...lab,
          schedules: isStLab ? [] : lab.schedules,
          status,
          subtitle,
          durationStr,
          freeMins,
        };
      });

    // 2. Filter by status filter (All, Available, Busy)
    const filtered = mapped.filter((lab) => {
      if (statusFilter === "Available") {
        return !lab.status.isOccupied;
      }
      if (statusFilter === "Busy") {
        return lab.status.isOccupied;
      }
      return true;
    });

    // 3. Sort according to selection
    return filtered.sort((a, b) => {
      // Pinning: If one of them is ST Room, pin it to the top!
      const isStA = a.roomName === "10G-33L" || a.roomName === "10G-34L";
      const isStB = b.roomName === "10G-33L" || b.roomName === "10G-34L";
      if (isStA && !isStB) return -1;
      if (!isStA && isStB) return 1;
      if (isStA && isStB) {
        return a.roomName.localeCompare(b.roomName);
      }

      const nameA = getRoomDisplayName(a.roomName);
      const nameB = getRoomDisplayName(b.roomName);
      if (sortBy === "FreeMinsDesc") {
        const diff = b.freeMins - a.freeMins;
        if (diff !== 0) return diff;
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "AvailableFirst") {
        if (a.status.isOccupied !== b.status.isOccupied) {
          return a.status.isOccupied ? 1 : -1;
        }
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "BusyFirst") {
        if (a.status.isOccupied !== b.status.isOccupied) {
          return a.status.isOccupied ? -1 : 1;
        }
        return nameA.localeCompare(nameB);
      }
      // Default / "Name": Alphabetical
      return nameA.localeCompare(nameB);
    });
  }, [
    labs,
    selectedTag,
    searchQuery,
    targetTimeData,
    isLiveMode,
    statusFilter,
    sortBy,
  ]);

  // Compute tag counts based on current search query & active day/time
  const tagCounts = useMemo(() => {
    const counts: Record<LabTag, number> = {
      All: 0,
      CSE: 0,
      "EEE/ECE": 0,
      "Biotech/Micro": 0,
      Architecture: 0,
      Others: 0,
    };

    labs.forEach((lab) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const normalizedQuery = query.replace(/[\s-]/g, "");
        
        const matchesOriginal = lab.roomName.toLowerCase().replace(/[\s-]/g, "").includes(normalizedQuery);
        const displayName = getRoomDisplayName(lab.roomName).toLowerCase().replace(/[\s-]/g, "");
        const matchesDisplay = displayName.includes(normalizedQuery);
        
        let matchesCourses = false;
        if (lab.roomName === "10G-33L") {
          matchesCourses = "cse110,cse111,cse230,studenttutor,tutoring,stroom".includes(normalizedQuery);
        } else if (lab.roomName === "10G-34L") {
          matchesCourses = "cse220,cse221,cse250,cse251,cse260,studenttutor,tutoring,stroom".includes(normalizedQuery);
        }

        if (!matchesOriginal && !matchesDisplay && !matchesCourses) {
          return;
        }
      }
      counts.All++;
      lab.tags.forEach((tag) => {
        if (tag in counts) {
          counts[tag as LabTag]++;
        }
      });
    });

    return counts;
  }, [labs, searchQuery]);

  const GRID_SLOTS = useMemo(
    () => [
      { label: "08:00 AM", start: 480, end: 560, display: "8:00 - 9:20" },
      { label: "09:30 AM", start: 570, end: 650, display: "9:30 - 10:50" },
      { label: "11:00 AM", start: 660, end: 740, display: "11:00 - 12:20" },
      { label: "12:30 PM", start: 750, end: 830, display: "12:30 - 1:50" },
      { label: "02:00 PM", start: 840, end: 920, display: "2:00 - 3:20" },
      { label: "03:30 PM", start: 930, end: 1010, display: "3:30 - 4:50" },
      { label: "05:00 PM", start: 1020, end: 1100, display: "5:00 - 6:20" },
    ],
    [],
  );

  const ALL_WEEKDAYS = useMemo(
    () => ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"] as const,
    [],
  );

  const WEEKDAY_LABELS = useMemo(
    () =>
      ({
        SAT: "Saturday",
        SUN: "Sunday",
        MON: "Monday",
        TUE: "Tuesday",
        WED: "Wednesday",
        THU: "Thursday",
        FRI: "Friday",
      }) as Record<string, string>,
    [],
  );

  const getRowCells = useCallback(
    (daySlots: LabSlot[]) => {
      const cells: Array<{ slots: LabSlot[]; colSpan: number } | null> =
        Array(7).fill(null);
      const skipped = Array(7).fill(false);

      for (let i = 0; i < 7; i++) {
        if (skipped[i]) continue;

        const slotInfo = GRID_SLOTS[i];
        // Find all slots that overlap with this grid hour by at least 30 minutes
        const matchingSlots = daySlots.filter((s) => {
          const start = parseTimeToMinutes(s.startTime);
          const end = parseTimeToMinutes(s.endTime);
          const overlap =
            Math.min(end, slotInfo.end) - Math.max(start, slotInfo.start);
          return overlap >= 30;
        });

        if (matchingSlots.length > 0) {
          let colSpan = 1;
          // Use first matching slot to compute span
          const start = parseTimeToMinutes(matchingSlots[0].startTime);
          const end = parseTimeToMinutes(matchingSlots[0].endTime);

          // Check consecutive slots
          for (let j = i + 1; j < 7; j++) {
            const nextSlotInfo = GRID_SLOTS[j];
            const overlap =
              Math.min(end, nextSlotInfo.end) -
              Math.max(start, nextSlotInfo.start);
            if (overlap >= 30) {
              colSpan++;
              skipped[j] = true;
            } else {
              break;
            }
          }
          cells[i] = { slots: matchingSlots, colSpan };
        } else {
          cells[i] = { slots: [], colSpan: 1 };
        }
      }

      return cells;
    },
    [GRID_SLOTS],
  );

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20"
        role="status"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">
          Syncing live USIS schedules...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-xl">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-bold text-foreground">Sync Error</h3>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={loadSchedules}
          className="mt-6 rounded-xl bg-destructive px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-destructive/20 hover:bg-destructive/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isFriday = targetTimeData?.day === "FRI";

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* Main Glassmorphic Control Panel */}
      <section
        className="mx-auto w-full max-w-4xl"
        aria-labelledby="controls-heading"
      >
        <h2 id="controls-heading" className="sr-only">
          Search and filter controls
        </h2>
        <div className="rounded-2xl border border-border bg-card/65 p-2.5 sm:p-3.5 shadow-md sm:shadow-lg backdrop-blur-md space-y-2">
          {/* Row 1: Search & Live Mode Button */}
          <div className="flex gap-2">
            {/* Search Room */}
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 left-3 my-auto h-3.5 w-3.5 text-muted-foreground" />
              <input
                id="room-search"
                type="text"
                placeholder="Search room (e.g. 11H, FT11, 20L)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-8 text-xs placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-2.5 my-auto text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Live Mode Toggle Button */}
            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all shrink-0 select-none",
                isLiveMode
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                  : "bg-background text-muted-foreground border-border hover:bg-muted/10",
              )}
              role="switch"
              aria-checked={isLiveMode}
            >
              <Clock
                className={cn("h-3.5 w-3.5", isLiveMode && "animate-pulse")}
              />
              <span className="hidden sm:inline">Live Mode</span>
              <span className="inline sm:hidden">Live</span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  isLiveMode ? "bg-emerald-500" : "bg-muted-foreground/45",
                )}
              />
            </button>
          </div>

          {/* Row 2: Sort & Filter Dropdowns */}
          <div className="grid grid-cols-2 gap-2">
            {/* Status Filter */}
            <div className="relative">
              <label htmlFor="status-filter" className="sr-only">
                Filter by Status
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
              </div>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full appearance-none rounded-xl border border-border bg-background py-1.5 pl-9 pr-7 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all cursor-pointer h-9"
              >
                <option value="All">Status: All</option>
                <option value="Available">Status: Available</option>
                <option value="Busy">Status: Busy</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Sort by Option */}
            <div className="relative">
              <label htmlFor="sort-by" className="sr-only">
                Sort Labs
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full appearance-none rounded-xl border border-border bg-background py-1.5 pl-9 pr-7 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all cursor-pointer h-9"
              >
                <option value="FreeMinsDesc">Sort: Most Free</option>
                <option value="Name">Sort: Room Name</option>
                <option value="AvailableFirst">Sort: Available First</option>
                <option value="BusyFirst">Sort: Busy First</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Conditional Dropdowns for Custom Slots */}
          <AnimatePresence>
            {!isLiveMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid gap-2 grid-cols-2 pt-1 border-t border-border/20">
                  <Select
                    id="custom-day-select"
                    label="Day"
                    value={selectedDay}
                    onChange={setSelectedDay}
                    options={DAYS}
                    labelMap={DAY_LABELS}
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    placeholder="Select Weekday"
                  />
                  <Select
                    id="custom-time-select"
                    label="Time"
                    value={selectedTime}
                    onChange={setSelectedTime}
                    options={TIMES}
                    icon={<Clock className="h-3.5 w-3.5" />}
                    placeholder="Select Time Slot"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Target Banner & Metadata Info */}
          {targetTimeData && (
            <div className="pt-2 border-t border-border/10 text-center text-[10px] text-muted-foreground/75 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-0.5 select-none">
              <div className="flex items-center gap-1">
                {isLiveMode && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span>
                  Checking schedules for:{" "}
                  <span className="font-semibold text-foreground">
                    {DAY_LABELS[targetTimeData.day as Day] ||
                      targetTimeData.day}
                  </span>{" "}
                  at{" "}
                  <span className="font-semibold text-foreground">
                    {targetTimeData.timeStr}
                  </span>
                </span>
              </div>
              {metadata && (
                <div className="hidden sm:inline text-muted-foreground/30">
                  •
                </div>
              )}
              {metadata && (
                <div>
                  Last Updated:{" "}
                  {new Date(metadata.lastUpdated).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Filter Tabs by Department */}
      <section
        className="mx-auto w-full max-w-4xl"
        aria-label="Department filters"
      >
        <div
          className="flex gap-2 overflow-x-auto pb-3 px-4 -mx-4 md:px-0 md:mx-0 justify-start md:justify-center snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {LAB_TAGS.map((tag) => {
            const isActive = selectedTag === tag;
            const count = tagCounts[tag];
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer snap-center shrink-0",
                  isActive
                    ? "bg-foreground text-background border-foreground shadow-md shadow-foreground/5 scale-105"
                    : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30 hover:text-foreground",
                )}
              >
                {tag}
                <span
                  className={cn(
                    "text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                    isActive
                      ? "bg-background/25 text-foreground"
                      : "bg-muted/50 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Results List */}
      <section
        className="mx-auto w-full max-w-5xl"
        aria-labelledby="labs-list-heading"
      >
        <h3 id="labs-list-heading" className="sr-only">
          Available Labs Result
        </h3>

        {isFriday ? (
          <div className="mx-auto max-w-md rounded-2xl bg-warning/5 border border-warning/20 p-8 text-center shadow-lg">
            <Calendar className="mx-auto h-12 w-12 text-warning animate-bounce" />
            <h4 className="mt-4 text-lg font-bold text-warning-foreground">
              Friday Holiday
            </h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Labs are officially closed on Friday. No classes are scheduled.
            </p>
          </div>
        ) : processedLabs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {processedLabs.map((lab, index) => {
              const isOccupied = lab.status.isOccupied;
              return (
                <motion.article
                  key={lab.roomName}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(index * 0.03, 0.4),
                    duration: 0.3,
                  }}
                  onClick={() => setModalRoom(lab)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border-2 p-4 sm:p-5 bg-card/40 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300",
                    isOccupied
                      ? "border-destructive/15 hover:border-destructive/40 hover:bg-destructive/[0.02]"
                      : "border-emerald-500/15 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02]",
                  )}
                >
                  {/* Decorative background glow */}
                  <div
                    className={cn(
                      "absolute -right-16 -top-16 h-32 w-32 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-500",
                      isOccupied ? "bg-destructive" : "bg-emerald-500",
                    )}
                  />

                  <div className="relative flex flex-col h-full justify-between gap-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <h4 className="text-lg sm:text-xl font-bold text-foreground truncate">
                            {getRoomDisplayName(lab.roomName)}
                          </h4>
                        </div>
                        {/* Display list of tags */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {lab.tags.map((t) => (
                            <span
                              key={t}
                              className={cn(
                                "text-[8px] font-bold px-1 py-0.5 rounded border uppercase",
                                getTagClass(t),
                              )}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Status Chip */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] sm:text-xs font-semibold border shadow-sm shrink-0",
                          isOccupied
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isOccupied
                              ? "bg-destructive animate-pulse"
                              : "bg-emerald-500",
                          )}
                        />
                        {isOccupied ? "Busy" : "Available"}
                      </span>
                    </div>

                    {/* Subtitle & Timer details */}
                    <div className="space-y-0.5 rounded-xl bg-background/30 border border-border/40 p-2.5 sm:p-3">
                      <p
                        className="text-xs text-muted-foreground truncate line-clamp-1"
                        title={lab.subtitle}
                      >
                        {lab.subtitle}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-bold",
                          isOccupied
                            ? "text-destructive/95"
                            : "text-emerald-500/95",
                        )}
                      >
                        {lab.durationStr}
                      </p>
                    </div>

                    {/* Footer Trigger */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-2.5 sm:pt-3 group-hover:text-primary transition-colors">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Weekly Schedule
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0 transform duration-300">
                        &rarr;
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl bg-card border border-border p-8 text-center shadow-lg">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/60" />
            <h4 className="mt-4 text-lg font-bold text-foreground">
              No Labs Found
            </h4>
            <p className="mt-2 text-sm text-muted-foreground">
              We could not find any lab rooms matching &quot;{searchQuery}&quot;
              under the category &quot;{selectedTag}&quot;.
            </p>
            {(searchQuery || selectedTag !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag("All");
                }}
                className="mt-6 rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* Weekly Schedule Modal Overlay */}
      <AnimatePresence>
        {modalRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Click-away backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setModalRoom(null)}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.93, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-5xl max-h-[90vh] sm:max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <header className="flex items-center justify-between border-b border-border p-4 sm:p-5 bg-background/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                      {modalRoom.roomName === "10G-33L" || modalRoom.roomName === "10G-34L"
                        ? getRoomDisplayName(modalRoom.roomName)
                        : `Lab ${modalRoom.roomName}`}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    {modalRoom.tags.map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase",
                          getTagClass(t),
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setModalRoom(null)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex items-start gap-2 text-xs text-muted-foreground/80 bg-muted/30 border border-border/40 rounded-xl p-3">
                  <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    Schedules represent class occupancy. Outside these times,
                    rooms are available for self-study. Swipe horizontally to
                    view full hours on mobile.
                  </span>
                </div>

                {/* Tabular Grid Schedule */}
                <div className="overflow-x-auto rounded-xl border border-border bg-background/20 shadow-inner max-w-full">
                  <table className="w-full border-collapse text-left min-w-[800px] text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 divide-x divide-border/30">
                        <th className="p-2.5 text-xs font-bold text-muted-foreground text-center w-24 bg-muted/20">
                          Day
                        </th>
                        {GRID_SLOTS.map((slot) => (
                          <th
                            key={slot.label}
                            className="p-2 text-center select-none font-semibold text-foreground"
                          >
                            <div className="text-[11px] font-bold text-foreground">
                              {slot.label}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-normal mt-0.5">
                              {slot.display}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {ALL_WEEKDAYS.map((day) => {
                        const daySlots = modalRoom.schedules.filter(
                          (s) => s.day === day,
                        );
                        const rowCells = getRowCells(daySlots);

                        return (
                          <tr
                            key={day}
                            className="hover:bg-muted/5 transition-colors divide-x divide-border/30"
                          >
                            <td className="p-2 text-xs font-bold text-foreground bg-muted/10 text-center w-24 align-middle">
                              {WEEKDAY_LABELS[day]}
                            </td>
                            {rowCells.map((cell, idx) => {
                              if (cell === null) return null; // skipped by colSpan

                              if (cell.slots.length > 0) {
                                return (
                                  <td
                                    key={idx}
                                    colSpan={cell.colSpan}
                                    className="p-1 align-middle min-w-[105px]"
                                  >
                                    <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 shadow-sm select-none hover:bg-primary/15 transition-all">
                                      {cell.slots.length === 1 ? (
                                        <div className="text-center">
                                          <div
                                            className="font-bold text-[10px] sm:text-[11px] text-primary truncate"
                                            title={cell.slots[0].courseCode}
                                          >
                                            {cell.slots[0].courseCode}
                                          </div>
                                          <div className="text-[9px] text-foreground/80 mt-0.5 truncate">
                                            Sec: {cell.slots[0].sectionName}
                                          </div>
                                          <div
                                            className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5 truncate"
                                            title={cell.slots[0].faculties}
                                          >
                                            {cell.slots[0].faculties || "TBA"}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="space-y-1.5 divide-y divide-primary/20">
                                          {cell.slots.map((slot, sIdx) => (
                                            <div
                                              key={sIdx}
                                              className={cn(
                                                "text-center",
                                                sIdx > 0 && "pt-1.5",
                                              )}
                                            >
                                              <div
                                                className="font-bold text-[9px] sm:text-[10px] text-primary truncate"
                                                title={slot.courseCode}
                                              >
                                                {slot.courseCode}
                                              </div>
                                              <div className="text-[8px] text-foreground/80 mt-0.5 truncate">
                                                Sec: {slot.sectionName} •{" "}
                                                {slot.faculties || "TBA"}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={idx}
                                  className="p-1 align-middle text-center"
                                >
                                  <div className="h-10 flex items-center justify-center text-[10px] text-muted-foreground/20 font-medium select-none">
                                    —
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <footer className="border-t border-border p-3 sm:p-4 bg-background/50 flex justify-end">
                <button
                  onClick={() => setModalRoom(null)}
                  className="rounded-xl bg-secondary px-5 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Close
                </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
