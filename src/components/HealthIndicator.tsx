"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { HealthStatus } from "@/lib/mock-data";

const config: Record<HealthStatus, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  healthy: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950", border: "border-emerald-200 dark:border-emerald-800", label: "Healthy" },
  caution: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950", border: "border-amber-200 dark:border-amber-800", label: "Caution" },
  critical: { icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950", border: "border-red-200 dark:border-red-800", label: "Needs Attention" },
};

export function HealthDot({ status }: { status: HealthStatus }) {
  const colors: Record<HealthStatus, string> = {
    healthy: "bg-emerald-500",
    caution: "bg-amber-500",
    critical: "bg-red-500",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
}

export function HealthBadge({ status }: { status: HealthStatus }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg} ${c.color} border ${c.border}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

export function HealthCard({
  label,
  value,
  status,
  sub,
}: {
  label: string;
  value: string;
  status: HealthStatus;
  sub?: string;
}) {
  const c = config[status];
  return (
    <div className={`bg-[var(--card)] rounded-2xl p-5 border shadow-sm ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
        <HealthDot status={status} />
      </div>
      <p className={`text-2xl font-bold ${status === "critical" ? "text-red-600 dark:text-red-400" : status === "caution" ? "text-amber-600 dark:text-amber-400" : "text-[var(--text)]"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  );
}
