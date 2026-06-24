export const DAYS = ["SAT", "SUN", "MON", "TUE", "WED", "THU"] as const;
export const TIMES = [
  "08:00 AM",
  "09:30 AM",
  "11:00 AM",
  "12:30 PM",
  "02:00 PM",
  "03:30 PM",
  "05:00 PM",
] as const;

export type Day = (typeof DAYS)[number];
export type Time = (typeof TIMES)[number];

export const DAY_LABELS: Record<Day, string> = {
  SAT: "Saturday",
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
};

export const DAY_MAP: Record<number, Day | "FRI"> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

export const LAB_TAGS = ["All", "CSE", "EEE/ECE", "Biotech/Micro", "Architecture", "Others"] as const;
export type LabTag = (typeof LAB_TAGS)[number];

