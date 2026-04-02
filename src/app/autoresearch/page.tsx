"use client";

import { FlaskConical, Trophy, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { HealthDot } from "@/components/HealthIndicator";
import { useKronosData } from "@/lib/use-data";
import Chart from "@/components/Chart";
import type { EChartsOption } from "@/components/Chart";
import { experimentLeaderboard as mockLeaderboard, sweepProgress as mockSweep } from "@/lib/mock-data";

export default function AutoresearchPage() {
  const { data } = useKronosData();

  // Use live experiments if available, else fall back to mock
  const hasLiveExperiments = data.experiments.length > 0;
  const hasLiveSweep = data.activeSweep !== null;

  const experiments = hasLiveExperiments
    ? data.experiments.map((e) => ({
        name: e.experiment_name,
        meanBps: e.mean_bps,
        std: e.std_bps,
        seeds: Object.values(e.seed_results ?? {}),
        status: e.rank === 1 ? "leader" as const : e.rank <= 3 ? "strong" as const : e.status === "baseline" ? "baseline" as const : e.mean_bps < (data.experiments[0]?.mean_bps ?? 0) * 0.85 ? "weak" as const : "normal" as const,
      }))
    : mockLeaderboard;

  const progress = hasLiveSweep
    ? {
        total: data.activeSweep!.total_experiments,
        completed: data.activeSweep!.completed_experiments,
        running: data.activeSweep!.leader_experiment ?? "---",
        championBps: data.activeSweep!.champion_bps ?? data.activeSweep!.leader_bps,
        eta: data.activeSweep!.finished_at ? "Complete" : "Running",
        sweepName: data.activeSweep!.sweep_name,
        description: data.activeSweep!.description,
      }
    : {
        ...mockSweep,
        sweepName: "V2 Reward Shaping Sweep",
        description: "19 experiments x 3 seeds x 3 folds x 150 epochs",
      };

  const sorted = [...experiments].sort((a, b) => b.meanBps - a.meanBps);

  const seedData = experiments.map((exp) => ({
    name: exp.name.replace("entry_cost_", "ec_").replace("neutral_pen_", "np_").replace("_win_bonus", "_wb"),
    min: exp.seeds.length > 0 ? Math.min(...exp.seeds) : 0,
    max: exp.seeds.length > 0 ? Math.max(...exp.seeds) : 0,
    mean: exp.meanBps,
    std: exp.std,
  }));

  const barOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = (params as { name: string; data: { value: number } }[])[0];
        return `${p.name}<br/>Mean: <b>+${p.data.value.toFixed(2)} bps</b>`;
      },
    },
    grid: { left: 130 },
    xAxis: {
      type: "value",
      max: 35,
      name: "Mean bps",
      nameLocation: "center",
      nameGap: 28,
      nameTextStyle: { fontSize: 10 },
    },
    yAxis: {
      type: "category",
      data: sorted.map((e) => e.name),
      inverse: true,
      axisLabel: { fontSize: 10 },
    },
    series: [{
      type: "bar",
      data: sorted.map((e) => ({
        value: e.meanBps,
        itemStyle: {
          color: e.status === "leader" ? "#f59e0b" : e.status === "strong" ? "#10b981" : e.status === "baseline" ? "#3b82f6" : e.meanBps > progress.championBps ? "#93c5fd" : "#fca5a5",
          borderRadius: [0, 6, 6, 0],
        },
      })),
      barMaxWidth: 24,
    }],
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Autoresearch" description="Automated experiment results and hyperparameter exploration" icon={FlaskConical} />

      {/* Sweep Status */}
      <div className="bg-[var(--card)] rounded-2xl border border-blue-100 dark:border-blue-900 shadow-sm p-6 animate-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <FlaskConical className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)]">{progress.sweepName}</h3>
              <p className="text-sm text-[var(--text-muted)]">{progress.description}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            {progress.eta === "Complete" ? "Complete" : "Running"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-3">
            <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }} />
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
          {hasLiveExperiments && <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 rounded-full font-semibold">LIVE</span>}
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
                {sorted[0]?.seeds?.length > 0 && sorted[0].seeds.map((_, j) => (
                  <th key={j} className="text-right py-3 text-[var(--text-muted)] font-medium">Seed {j + 1}</th>
                ))}
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
                    <td className="py-3 text-[var(--text-muted)] font-mono">{i + 1}</td>
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
        <Chart option={barOption} height={300} />
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
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-semibold">High variance experiments</span> may show inflated mean bps due to lucky seeds. Check std deviation before choosing a production candidate.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
