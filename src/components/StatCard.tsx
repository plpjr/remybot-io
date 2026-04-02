"use client";

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  const trendConfig = {
    up: {
      icon: ArrowUpRight,
      className: "text-emerald-600 dark:text-emerald-400",
    },
    down: {
      icon: ArrowDownRight,
      className: "text-red-500 dark:text-red-400",
    },
    neutral: {
      icon: Minus,
      className: "text-[var(--text-muted)]",
    },
  };

  const TrendIcon = trend ? trendConfig[trend].icon : null;
  const trendClass = trend ? trendConfig[trend].className : "";

  return (
    <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950 rounded-xl">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        {TrendIcon && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendClass}`}>
            <TrendIcon className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
      <p className="text-sm text-[var(--text-muted)] mt-1">{label}</p>
      {sub && (
        <p className={`text-xs mt-0.5 ${trend === "up" ? "text-emerald-600 dark:text-emerald-400" : trend === "down" ? "text-red-500 dark:text-red-400" : "text-[var(--text-muted)] opacity-70"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}
