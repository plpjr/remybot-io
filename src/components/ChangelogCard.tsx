"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ChangelogEntry } from "@/lib/data";

export default function ChangelogCard({ entry }: { entry: ChangelogEntry }) {
  const [open, setOpen] = useState(false);
  const verdictColor =
    entry.verdict === "improvement"
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400"
      : entry.verdict === "regression"
      ? "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"
      : "text-[var(--text-muted)] bg-[var(--bg)]";

  return (
    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 text-left flex items-start justify-between hover:bg-[var(--bg)] transition-colors"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 px-2 py-0.5 rounded-full">
              {entry.category}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{entry.date}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${verdictColor}`}>
              {entry.verdict}
            </span>
          </div>
          <p className="font-semibold text-[var(--text)]">{entry.title}</p>
          {entry.after_metric && (
            <div className="flex gap-4 mt-2">
              {Object.entries(entry.after_metric).map(([key, val]) => (
                <span key={key} className="text-xs text-[var(--text-muted)]">
                  <span className="font-medium text-[var(--text)]">{String(val)}</span>{" "}
                  {key.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[var(--border)]">
          <p className="mt-3 text-sm text-[var(--text-muted)]">{entry.description}</p>
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex gap-1 mt-3">
              {entry.tags.map((tag) => (
                <span key={tag} className="text-xs bg-[var(--bg)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
