"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

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
  return (
    <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950 rounded-xl">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        {trend && trend !== "neutral" && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trend === "up" ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--text)]">{value}</p>
      <p className="text-sm text-[var(--text-muted)] mt-1">{label}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}
