"use client";

import { ShieldCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { HealthCard } from "@/components/HealthIndicator";
import { drawdownCurve, riskMetrics, consecutiveLosses, getHealthStatus } from "@/lib/mock-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export default function RiskPage() {
  const r = riskMetrics;
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Risk" description="Drawdown analysis and risk-adjusted performance metrics" icon={ShieldCheck} />

      {/* Key Risk Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HealthCard label="Max Drawdown" value={`${r.maxDrawdown}%`} status={getHealthStatus("maxDrawdown", r.maxDrawdown)} sub={`On ${r.maxDrawdownDate}`} />
        <HealthCard label="Current DD" value={`${r.currentDrawdown}%`} status={r.currentDrawdown > -2 ? "healthy" : r.currentDrawdown > -5 ? "caution" : "critical"} sub="From equity peak" />
        <HealthCard label="Sortino Ratio" value={r.sortinoRatio.toFixed(2)} status={getHealthStatus("sortinoRatio", r.sortinoRatio)} sub="Downside risk-adjusted" />
        <HealthCard label="VaR (95%)" value={`${r.var95}%`} status={getHealthStatus("var95", r.var95)} sub="Daily loss limit" />
      </div>

      {/* Drawdown Chart */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Drawdown Over Time</h3>
        <p className="text-sm text-slate-500 mb-6">Underwater equity curve — time and depth of losses</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={drawdownCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} domain={["auto", 0]} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} formatter={(v: unknown) => [`${v}%`, "Drawdown"]} />
            <Line type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} dot={false} fill="#fecaca" fillOpacity={0.3} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk-Adjusted Metrics */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Risk-Adjusted Returns</h3>
          <div className="space-y-1">
            {[
              { label: "Sortino Ratio", value: r.sortinoRatio.toFixed(2), status: getHealthStatus("sortinoRatio", r.sortinoRatio) },
              { label: "Calmar Ratio", value: r.calmarRatio.toFixed(2), status: r.calmarRatio > 3 ? "healthy" as const : r.calmarRatio > 1.5 ? "caution" as const : "critical" as const },
              { label: "Recovery Factor", value: r.recoveryFactor.toFixed(1), status: r.recoveryFactor > 3 ? "healthy" as const : "caution" as const },
              { label: "Ulcer Index", value: r.ulcerIndex.toFixed(2), status: r.ulcerIndex < 2 ? "healthy" as const : r.ulcerIndex < 5 ? "caution" as const : "critical" as const },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  <span className={`w-2 h-2 rounded-full ${item.status === "healthy" ? "bg-emerald-500" : item.status === "caution" ? "bg-amber-500" : "bg-red-500"}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase">Exposure Time</p>
              <p className="text-xl font-bold text-slate-900">{r.exposureTime}%</p>
              <p className="text-[10px] text-slate-400">~{r.avgExposurePerTrade}min avg/trade</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase">DD Duration</p>
              <p className="text-xl font-bold text-slate-900">{r.maxDrawdownDuration}</p>
              <p className="text-[10px] text-slate-400">Longest recovery</p>
            </div>
          </div>
        </section>

        {/* Consecutive Losses */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Consecutive Loss Distribution</h3>
          <p className="text-sm text-slate-500 mb-4">How often losing streaks occur</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={consecutiveLosses.filter(c => c.frequency > 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="streak" tick={{ fontSize: 11, fill: "#94a3b8" }} label={{ value: "Streak Length", position: "bottom", fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} formatter={(v: unknown) => [`${v}`, "Occurrences"]} />
              <Bar dataKey="frequency" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {consecutiveLosses.filter(c => c.frequency > 0).map((entry, i) => (
                  <Cell key={i} fill={entry.streak <= 2 ? "#3b82f6" : entry.streak <= 3 ? "#f59e0b" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs text-amber-700">
              <span className="font-semibold">⚠️ Max consecutive losses: {r.maxConsecutiveLosses}</span> — Only {consecutiveLosses.find(c => c.streak === r.maxConsecutiveLosses)?.frequency || 0} occurrences. Average losing streak is {r.avgConsecutiveLosses} trades.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
