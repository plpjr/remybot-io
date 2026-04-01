"use client";

import { FlaskConical, Trophy, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MockDataBanner from "@/components/MockDataBanner";
import { HealthDot } from "@/components/HealthIndicator";
import { useChartTheme, tooltipStyle } from "@/lib/useChartTheme";
import { experimentLeaderboard, sweepProgress } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AutoresearchPage() {
  const ct = useChartTheme();
  const progress = sweepProgress;
  const sorted = [...experimentLeaderboard].sort((a, b) => b.meanBps - a.meanBps);

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
      <MockDataBanner />

      {/* Sweep Status */}
      <div className="bg-[var(--card)] rounded-2xl border border-blue-100 dark:border-blue-900 shadow-sm p-6 animate-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <FlaskConical className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)]">V2 Reward Shaping Sweep</h3>
              <p className="text-sm text-[var(--text-muted)]">19 experiments x 3 seeds x 3 folds x 150 epochs</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Running
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-3">
            <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${(progress.completed / progress.total) * 100}%` }} />
          </div>
          <span className="text-sm font-semibold text-[var(--text)]">{progress.completed}/{progress.total}</span>
        </div>
        <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)]">
          <span>Currently: {progress.running}</span>
          <span>ETA: {progress.eta}</span>
        </div>
      </div>

      {/* Experiment Leaderboard */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Experiment Leaderboard</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">Ranked by mean bps -- champion to beat: <span className="font-semibold text-[var(--text)]">+{progress.championBps} bps</span></p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 text-[var(--text-muted)] font-medium w-8">#</th>
                <th className="text-left py-3 text-[var(--text-muted)] font-medium">Experiment</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">Mean bps</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">Std</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">Seed 1</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">Seed 2</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">Seed 3</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">vs Champion</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((exp, i) => {
                const delta = exp.meanBps - progress.championBps;
                const statusColors: Record<string, string> = {
                  leader: "bg-amber-50 dark:bg-amber-950/50",
                  strong: "bg-emerald-50 dark:bg-emerald-950/50",
                  baseline: "bg-blue-50 dark:bg-blue-950/50",
                  normal: "",
                  weak: "bg-red-50 dark:bg-red-950/50",
                };
                return (
                  <tr key={exp.name} className={`border-b border-[var(--border)] ${statusColors[exp.status] || ""}`}>
                    <td className="py-3 text-[var(--text-muted)] font-mono">
                      {i === 0 ? "1" : i === 1 ? "2" : i === 2 ? "3" : `${i + 1}`}
                    </td>
                    <td className="py-3 font-medium text-[var(--text)]">
                      <span className="font-mono text-xs bg-[var(--bg)] text-[var(--text)] px-1.5 py-0.5 rounded">{exp.name}</span>
                      {exp.status === "baseline" && <span className="ml-2 text-[10px] text-blue-600 dark:text-blue-400 font-semibold">BASELINE</span>}
                    </td>
                    <td className="py-3 text-right font-bold text-[var(--text)]">+{exp.meanBps.toFixed(2)}</td>
                    <td className={`py-3 text-right ${exp.std > 7 ? "text-amber-600 dark:text-amber-400" : "text-[var(--text-muted)]"}`}>{exp.std.toFixed(2)}</td>
                    {exp.seeds.map((s, j) => (
                      <td key={j} className="py-3 text-right text-[var(--text-muted)] font-mono text-xs">+{s.toFixed(2)}</td>
                    ))}
                    <td className={`py-3 text-right font-semibold ${delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                      {delta > 0 ? "+" : ""}{delta.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Visual Comparison */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Visual Comparison</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">Mean bps with champion baseline reference</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sorted} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis type="number" tick={{ fontSize: 11, fill: ct.tick }} label={{ value: "Mean bps", position: "bottom", fontSize: 10, fill: ct.tick }} domain={[0, 35]} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: ct.tick }} width={120} />
            <Tooltip contentStyle={tooltipStyle(ct)} formatter={(v: unknown) => [`+${v} bps`, "Mean"]} />
            <Bar dataKey="meanBps" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {sorted.map((entry) => (
                <Cell key={entry.name} fill={entry.status === "leader" ? "#f59e0b" : entry.status === "strong" ? "#10b981" : entry.status === "baseline" ? "#3b82f6" : entry.meanBps > progress.championBps ? "#93c5fd" : "#fca5a5"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-0.5 w-4 bg-red-400 border-dashed" />
          <span className="text-[10px] text-[var(--text-muted)]">Champion baseline: +{progress.championBps} bps</span>
        </div>
      </section>

      {/* Seed Variance */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Seed Variance Analysis</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">Range of results across random seeds -- wider range = less stable</p>
        <div className="space-y-3">
          {seedData.sort((a, b) => b.mean - a.mean).map((exp) => {
            const range = exp.max - exp.min;
            const stability = range < 10 ? "healthy" as const : range < 20 ? "caution" as const : "critical" as const;
            return (
              <div key={exp.name} className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)] font-mono w-28 flex-shrink-0 truncate">{exp.name}</span>
                <div className="flex-1 relative h-6">
                  <div className="absolute inset-y-0 left-0 right-0 bg-slate-100 dark:bg-slate-700 rounded-full" />
                  <div
                    className={`absolute inset-y-1 rounded-full ${stability === "healthy" ? "bg-blue-200 dark:bg-blue-800" : stability === "caution" ? "bg-amber-200 dark:bg-amber-800" : "bg-red-200 dark:bg-red-800"}`}
                    style={{
                      left: `${(exp.min / 45) * 100}%`,
                      right: `${100 - (exp.max / 45) * 100}%`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 border-2 border-white dark:border-slate-800 shadow"
                    style={{ left: `${(exp.mean / 45) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
                  <span className="text-xs font-mono text-[var(--text-muted)]">s={exp.std.toFixed(1)}</span>
                  <HealthDot status={stability} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3">
          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 border-2 border-white dark:border-slate-800 shadow" /> Mean</span>
          <span className="text-[10px] text-[var(--text-muted)]">Colored bar = min-max range across seeds</span>
        </div>
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-100 dark:border-amber-900">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-400"><span className="font-semibold">entry_cost_1.0 has high variance</span> (s=9.48) -- seed 2 hit +41.37 while seed 1 only got +18.27. entry_cost_0.5 (s=5.42) may be the safer production choice.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
