"use client";

import CountUp from "react-countup";

const ACCENTS = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning-foreground",
};

/**
 * KPI stat card with an animated counter.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  accent = "primary",
  hint,
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div
        className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
          ACCENTS[accent] || ACCENTS.primary
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-foreground tabular-nums">
          <CountUp end={value || 0} duration={1.1} />
          {suffix}
        </div>
        <div className="text-sm text-muted-foreground truncate">{label}</div>
        {hint && (
          <div className="text-xs text-muted-foreground/80 mt-0.5 truncate">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
