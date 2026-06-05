"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, MapPin, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DAYS, TIMES, DAY_LABELS, type Day, type Time } from "@/lib/lab-constants";
import {
  parseLabSchedule,
  findFreeLabs,
  getCurrentTimeSlot,
} from "@/lib/lab-utils";
import type { LabScheduleEntry } from "@/lib/lab-types";

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
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
          {icon}
        </div>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-xl border border-border bg-background",
            "py-3 pl-10 pr-10 text-sm",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20",
            "transition-colors cursor-pointer",
            !value && "text-muted-foreground"
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
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
          <svg
            className="h-4 w-4"
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
    </div>
  );
}

interface LabCardProps {
  lab: string;
  index: number;
}

function LabCard({ lab, index }: LabCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 border-transparent w-36 sm:w-40",
        "bg-card shadow-sm",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-300 cursor-pointer"
      )}
    >
      <div className="flex flex-col items-center justify-center gap-2 p-4">
        <MapPin
          className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"
          aria-hidden="true"
        />
        <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {lab}
        </p>
      </div>
    </motion.article>
  );
}

export function LabFinder() {
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [freeLabs, setFreeLabs] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const [uniqueLabs, setUniqueLabs] = useState<Set<string>>(new Set());
  const [busyLabsMap, setBusyLabsMap] = useState<Map<string, Set<string>>>(
    new Map()
  );

  useEffect(() => {
    async function loadSchedule() {
      try {
        const response = await fetch("/CSE_Lab_Schedule.json");
        if (!response.ok) {
          throw new Error("Failed to load schedule");
        }
        const data: LabScheduleEntry[] = await response.json();
        const { uniqueLabs: labs, busyLabsMap: busy } = parseLabSchedule(data);
        setUniqueLabs(labs);
        setBusyLabsMap(busy);
        setIsLoading(false);
      } catch {
        setError("Could not load lab schedule. Please try again later.");
        setIsLoading(false);
      }
    }
    loadSchedule();
  }, []);

  const handleSearch = useCallback(() => {
    if (!selectedDay || !selectedTime) return;

    const available = findFreeLabs(
      selectedDay as Day,
      selectedTime as Time,
      uniqueLabs,
      busyLabsMap
    );

    setFreeLabs(available);
    setResultMessage(null);
    setShowResults(true);
  }, [selectedDay, selectedTime, uniqueLabs, busyLabsMap]);

  const handleCheckNow = useCallback(() => {
    const { day, time } = getCurrentTimeSlot();

    if (day === "FRI") {
      setFreeLabs([]);
      setResultMessage("Labs are closed on Friday");
      setShowResults(true);
      return;
    }

    if (!time) {
      setFreeLabs([]);
      setResultMessage("Labs are currently closed");
      setShowResults(true);
      return;
    }

    setSelectedDay(day);
    setSelectedTime(time);

    const available = findFreeLabs(day, time, uniqueLabs, busyLabsMap);
    setFreeLabs(available);
    setResultMessage(null);
    setShowResults(true);
  }, [uniqueLabs, busyLabsMap]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        role="status"
        aria-label="Loading lab schedule"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center"
        role="alert"
      >
        <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
        <p className="mt-2 font-medium text-destructive">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Card */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="mx-auto w-full max-w-md"
        aria-labelledby="search-heading"
      >
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-lg">
          <header className="mb-6 flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Search className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="search-heading"
                className="text-lg font-bold text-foreground"
              >
                Find a Room
              </h2>
              <p className="text-sm text-muted-foreground">
                Select day and time to check availability
              </p>
            </div>
          </header>

          <div className="space-y-4">
            <Select
              id="day-select"
              label="Select Day"
              value={selectedDay}
              onChange={setSelectedDay}
              options={DAYS}
              labelMap={DAY_LABELS}
              icon={<Calendar className="h-4 w-4" />}
              placeholder="Choose a day"
            />

            <Select
              id="time-select"
              label="Select Time"
              value={selectedTime}
              onChange={setSelectedTime}
              options={TIMES}
              icon={<Clock className="h-4 w-4" />}
              placeholder="Choose a time slot"
            />

            <div className="space-y-3 pt-2">
              <button
                onClick={handleSearch}
                disabled={!selectedDay || !selectedTime}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold",
                  "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                  "hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                  "transition-all duration-200"
                )}
                aria-label="Find free labs for selected day and time"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Find Free Labs
              </button>

              <div className="relative flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  Or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button
                onClick={handleCheckNow}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold",
                  "bg-secondary text-secondary-foreground",
                  "hover:bg-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "transition-all duration-200"
                )}
                aria-label="Check lab availability for current time"
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                Check Current Time
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {showResults && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-auto w-full max-w-3xl"
            aria-labelledby="results-heading"
            aria-live="polite"
          >
            <header className="mb-6 flex items-center justify-center gap-2">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-transparent" />
              <h3
                id="results-heading"
                className="text-xl font-bold text-center"
              >
                Available Labs
              </h3>
              <div className="h-1 w-12 rounded-full bg-gradient-to-l from-primary to-transparent" />
            </header>

            {resultMessage ? (
              <div className="mx-auto max-w-md">
                <div className="rounded-xl bg-warning/10 border border-warning/30 p-6 text-center">
                  <Clock
                    className="mx-auto h-8 w-8 text-warning"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-lg font-semibold text-warning-foreground">
                    {resultMessage}
                  </p>
                </div>
              </div>
            ) : freeLabs.length > 0 ? (
              <div
                className="flex flex-wrap justify-center gap-3"
                role="list"
                aria-label="List of available lab rooms"
              >
                {freeLabs.map((lab, index) => (
                  <LabCard key={lab} lab={lab} index={index} />
                ))}
              </div>
            ) : (
              <div className="mx-auto max-w-md">
                <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
                  <MapPin
                    className="mx-auto h-8 w-8 text-destructive"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-lg font-semibold text-destructive">
                    No free labs at this time
                  </p>
                </div>
              </div>
            )}

            {freeLabs.length > 0 && !resultMessage && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Found{" "}
                <span className="font-semibold text-primary">
                  {freeLabs.length}
                </span>{" "}
                available lab{freeLabs.length !== 1 ? "s" : ""}
              </p>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
