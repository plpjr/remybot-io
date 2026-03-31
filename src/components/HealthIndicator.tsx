"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { HealthStatus } from "@/lib/mock-data";

const config: Record<HealthStatus, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  healthy: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Healthy" },
  caution: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Caution" },
  critical: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Needs Attention" },
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
    <div className={`bg-white rounded-2xl p-5 border shadow-sm ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-500">{label}</p>
        <HealthDot status={status} />
      </div>
      <p className={`text-2xl font-bold ${status === "critical" ? "text-red-600" : status === "caution" ? "text-amber-600" : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
