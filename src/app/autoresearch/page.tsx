"use client";

import { FlaskConical, Trophy, TrendingUp, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { HealthDot } from "@/components/HealthIndicator";
import { experimentLeaderboard, sweepProgress } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter } from "recharts";

export default function AutoresearchPage() {
  const progress = sweepProgress;
  const sorted = [...experimentLeaderboard].sort((a, b) => b.meanBps - a.meanBps);

  // Prepare seed variance data
  const seedData = experimentLeaderboard.map((exp) => ({
    name: exp.name.replace("entry_cost_", "ec_").replace("neutral_pen_", "np_").replace("_win_bonus", "_wb"),
    min: Math.min(...exp.seeds),
    max: Math.max(...exp.seeds),
    mean: exp.meanBps,
    std: exp.std,
  }));

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Autoresearch" description="Automated experiment results and hyperparameter exploration" icon={FlaskConical} />

      {/* Sweep Status */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FlaskConical className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">V2 Reward Shaping Sweep</h3>
              <p className="text-sm text-slate-500">19 experiments × 3 seeds × 3 folds × 150 epochs</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Running
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-slate-100 rounded-full h-3">
            <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${(progress.completed / progress.total) * 100}%` }} />
          </div>
          <span className="text-sm font-semibold text-slate-700">{progress.completed}/{progress.total}</span>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Currently: {progress.running}</span>
          <span>ETA: {progress.eta}</span>
        </div>
      </div>

      {/* Experiment Leaderboard */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Experiment Leaderboard</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Ranked by mean bps — champion to beat: <span className="font-semibold text-slate-700">+{progress.championBps} bps</span></p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 text-slate-500 font-medium w-8">#</th>
                <th className="text-left py-3 text-slate-500 font-medium">Experiment</th>
                <th className="text-right py-3 text-slate-500 font-medium">Mean bps</th>
                <th className="text-right py-3 text-slate-500 font-medium">Std</th>
                <th className="text-right py-3 text-slate-500 font-medium">Seed 1</th>
                <th className="text-right py-3 text-slate-500 font-medium">Seed 2</th>
                <th className="text-right py-3 text-slate-500 font-medium">Seed 3</th>
                <th className="text-right py-3 text-slate-500 font-medium">vs Champion</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((exp, i) => {
                const delta = exp.meanBps - progress.championBps;
                const statusColors: Record<string, string> = {
                  leader: "bg-amber-50",
                  strong: "bg-emerald-50",
                  baseline: "bg-blue-50",
                  normal: "",
                  weak: "bg-red-50",
                };
                return (
                  <tr key={exp.name} className={`border-b border-slate-50 ${statusColors[exp.status] || ""}`}>
                    <td className="py-3 text-slate-400 font-mono">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                    </td>
                    <td className="py-3 font-medium text-slate-900">
                      <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{exp.name}</span>
                      {exp.status === "baseline" && <span className="ml-2 text-[10px] text-blue-600 font-semibold">BASELINE</span>}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">+{exp.meanBps.toFixed(2)}</td>
                    <td className={`py-3 text-right ${exp.std > 7 ? "text-amber-600" : "text-slate-500"}`}>{exp.std.toFixed(2)}</td>
                    {exp.seeds.map((s, j) => (
                      <td key={j} className="py-3 text-right text-slate-600 font-mono text-xs">+{s.toFixed(2)}</td>
                    ))}
                    <td className={`py-3 text-right font-semibold ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {delta > 0 ? "+" : ""}{delta.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reward Shaping Comparison Bar Chart */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Visual Comparison</h3>
        <p className="text-sm text-slate-500 mb-4">Mean bps with champion baseline reference</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sorted} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} label={{ value: "Mean bps", position: "bottom", fontSize: 10, fill: "#94a3b8" }} domain={[0, 35]} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} width={120} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} formatter={(v: unknown) => [`+${v} bps`, "Mean"]} />
            <Bar dataKey="meanBps" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {sorted.map((entry) => (
                <Cell key={entry.name} fill={entry.status === "leader" ? "#f59e0b" : entry.status === "strong" ? "#10b981" : entry.status === "baseline" ? "#3b82f6" : entry.meanBps > progress.championBps ? "#93c5fd" : "#fca5a5"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Champion line reference */}
        <div className="flex items-center gap-2 mt-2">
          <div className="h-0.5 w-4 bg-red-400 border-dashed" />
          <span className="text-[10px] text-slate-400">Champion baseline: +{progress.championBps} bps</span>
        </div>
      </section>

      {/* Seed Variance */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Seed Variance Analysis</h3>
        <p className="text-sm text-slate-500 mb-4">Range of results across random seeds — wider range = less stable</p>
        <div className="space-y-3">
          {seedData.sort((a, b) => b.mean - a.mean).map((exp) => {
            const range = exp.max - exp.min;
            const stability = range < 10 ? "healthy" as const : range < 20 ? "caution" as const : "critical" as const;
            return (
              <div key={exp.name} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 font-mono w-28 flex-shrink-0 truncate">{exp.name}</span>
                <div className="flex-1 relative h-6">
                  {/* Background track */}
                  <div className="absolute inset-y-0 left-0 right-0 bg-slate-100 rounded-full" />
                  {/* Range bar */}
                  <div
                    className={`absolute inset-y-1 rounded-full ${stability === "healthy" ? "bg-blue-200" : stability === "caution" ? "bg-amber-200" : "bg-red-200"}`}
                    style={{
                      left: `${(exp.min / 45) * 100}%`,
                      right: `${100 - (exp.max / 45) * 100}%`,
                    }}
                  />
                  {/* Mean dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shadow"
                    style={{ left: `${(exp.mean / 45) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
                  <span className="text-xs font-mono text-slate-500">σ={exp.std.toFixed(1)}</span>
                  <HealthDot status={stability} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3">
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shadow" /> Mean</span>
          <span className="text-[10px] text-slate-400">Colored bar = min–max range across seeds</span>
        </div>
        <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-xs text-amber-700"><span className="font-semibold">entry_cost_1.0 has high variance</span> (σ=9.48) — seed 2 hit +41.37 while seed 1 only got +18.27. entry_cost_0.5 (σ=5.42) may be the safer production choice.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
