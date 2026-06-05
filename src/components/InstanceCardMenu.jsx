"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Pause,
  Play,
  Archive,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";

/**
 * Kebab actions menu for an instance card.
 * status: "active" | "paused" | "dropped"
 */
export default function InstanceCardMenu({
  status = "active",
  busy = false,
  onEdit,
  onDelete,
  onSetStatus,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const item =
    "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors";
  const run = (fn) => (e) => {
    e.preventDefault();
    setOpen(false);
    fn?.();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg py-1 z-30"
        >
          {status === "active" ? (
            <button
              onClick={run(() => onSetStatus("paused"))}
              className={`${item} text-foreground hover:bg-muted`}
            >
              <Pause className="h-4 w-4 text-muted-foreground" /> Pause
            </button>
          ) : (
            <button
              onClick={run(() => onSetStatus("active"))}
              className={`${item} text-foreground hover:bg-muted`}
            >
              <Play className="h-4 w-4 text-primary" /> Resume
            </button>
          )}

          {status !== "dropped" && (
            <button
              onClick={run(() => onSetStatus("dropped"))}
              className={`${item} text-foreground hover:bg-muted`}
            >
              <Archive className="h-4 w-4 text-muted-foreground" /> Drop
            </button>
          )}

          <button
            onClick={run(onEdit)}
            className={`${item} text-foreground hover:bg-muted`}
          >
            <Edit className="h-4 w-4 text-muted-foreground" /> Edit details
          </button>

          <div className="my-1 border-t border-border" />

          <button
            onClick={run(onDelete)}
            className={`${item} text-destructive hover:bg-destructive/10`}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
