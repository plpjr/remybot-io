"use client";

import { Brain, Layers, Gauge } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PlaceholderCard from "@/components/PlaceholderCard";
import { HealthDot } from "@/components/HealthIndicator";
import Chart from "@/components/Chart";
import type { EChartsOption } from "@/components/Chart";
import { useKronosData } from "@/lib/use-data";

function EmptyState({
  title,
  message,
  height = 200,
}: {
  title: string;
  message: string;
  height?: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] text-center px-4"
      style={{ height }}
    >
      <p className="text-sm font-medium text-[var(--text)]">{title}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">{message}</p>
    </div>
  );
}

const EMPTY_MSG =
  "No paper predictions yet — chart populates once Chronos starts writing decisions.";

export default function ModelPage() {
  const { data } = useKronosData();
  const confidenceDistribution = data.confidenceDistribution;
  const decisionTrace = data.decisionTrace;
  const regimeBreakdown = data.regimeBreakdown;

  const hasConfidence = confidenceDistribution.some((b) => b.count > 0);
  const hasDecisions = decisionTrace.length > 0;
  const hasRegimes = regimeBreakdown.length > 0;

  // Action distribution derived from decision trace.
  const actionCounts = new Map<string, number>();
  for (const d of decisionTrace) {
    const a = (d.decision_action ?? "unknown").toLowerCase();
    actionCounts.set(a, (actionCounts.get(a) ?? 0) + 1);
  }
  const totalActions = Array.from(actionCounts.values()).reduce((s, v) => s + v, 0);
  const actionRows = Array.from(actionCounts.entries())
    .map(([action, count]) => ({
      action,
      count,
      percentage: totalActions > 0 ? Math.round((count / totalActions) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const confidenceOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: confidenceDistribution.map((d) => d.bucket),
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: "value" },
    series: [{
      type: "bar",
      data: confidenceDistribution.map((d) => ({
        value: d.count,
        itemStyle: {
          color: "#3b82f6",
          borderRadius: [4, 4, 0, 0],
        },
      })),
      barMaxWidth: 40,
    }],
  };

  const actionColors: Record<string, string> = {
    long: "bg-emerald-500",
    short: "bg-blue-500",
    hold: "bg-slate-300 dark:bg-slate-600",
    close: "bg-amber-500",
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Model" description="Chronos + Kronos prediction diagnostics" icon={Brain} />

      {/* Confidence Distribution (top) */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Confidence Distribution</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">Prediction confidence across the most recent paper cycles</p>
        {hasConfidence ? (
          <Chart option={confidenceOption} height={220} />
        ) : (
          <EmptyState title="No predictions yet" message={EMPTY_MSG} height={220} />
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Action Distribution (derived from decision_trace) */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Action Distribution</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">How often each decision action fires (last {totalActions} cycles)</p>
          {hasDecisions ? (
            <div className="space-y-4">
              {actionRows.map((a) => (
                <div key={a.action}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-[var(--text)] capitalize">{a.action}</span>
                    <span className="text-[var(--text-muted)]">
                      {a.percentage}% · {a.count} cycles
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                    <div
                      className={`${actionColors[a.action] ?? "bg-slate-400"} h-3 rounded-full`}
                      style={{ width: `${a.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No decisions yet" message={EMPTY_MSG} height={180} />
          )}
        </section>

        {/* Regime Breakdown */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-[var(--text)]">Regime Breakdown</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">Predictions + trades grouped by regime classifier</p>
          {hasRegimes ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 text-[var(--text-muted)] font-medium">Regime</th>
                    <th className="text-right py-2 text-[var(--text-muted)] font-medium">Predictions</th>
                    <th className="text-right py-2 text-[var(--text-muted)] font-medium">Trades</th>
                    <th className="text-right py-2 text-[var(--text-muted)] font-medium">Avg PnL</th>
                    <th className="text-center py-2 text-[var(--text-muted)] font-medium">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {regimeBreakdown.map((r) => {
                    const status =
                      r.trades === 0
                        ? ("caution" as const)
                        : r.avgPnlBps > 5
                          ? ("healthy" as const)
                          : r.avgPnlBps > -5
                            ? ("caution" as const)
                            : ("critical" as const);
                    return (
                      <tr key={r.regime} className="border-b border-[var(--border)]">
                        <td className="py-2 font-medium text-[var(--text)]">{r.regime}</td>
                        <td className="py-2 text-right text-[var(--text-muted)]">{r.predictions}</td>
                        <td className="py-2 text-right text-[var(--text-muted)]">{r.trades}</td>
                        <td className={`py-2 text-right font-semibold ${r.avgPnlBps > 5 ? "text-emerald-600" : r.avgPnlBps < -5 ? "text-red-600" : "text-[var(--text-muted)]"}`}>
                          {r.trades > 0 ? `${r.avgPnlBps >= 0 ? "+" : ""}${r.avgPnlBps} bps` : "—"}
                        </td>
                        <td className="py-2 text-center"><HealthDot status={status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No regime data yet" message={EMPTY_MSG} height={180} />
          )}
        </section>
      </div>

      {/* Decision Trace */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Recent Decision Trace</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">Last 50 cycles — why the bot held, entered, or closed</p>
        {hasDecisions ? (
          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--card)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 text-[var(--text-muted)] font-medium">Time (UTC)</th>
                  <th className="text-left py-2 text-[var(--text-muted)] font-medium">Action</th>
                  <th className="text-right py-2 text-[var(--text-muted)] font-medium">Conf.</th>
                  <th className="text-right py-2 text-[var(--text-muted)] font-medium">Range (bps)</th>
                  <th className="text-left py-2 text-[var(--text-muted)] font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {decisionTrace.map((d, i) => (
                  <tr key={`${d.timestamp}-${i}`} className="border-b border-[var(--border)]">
                    <td className="py-2 font-mono text-[var(--text-muted)] text-xs">{d.timestamp.slice(5, 16)}</td>
                    <td className="py-2">
                      <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded ${
                        d.decision_action === "long" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                        d.decision_action === "short" ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
                        d.decision_action === "close" ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {d.decision_action ?? "—"}
                      </span>
                    </td>
                    <td className="py-2 text-right text-[var(--text-muted)] font-mono">
                      {d.confidence !== null && d.confidence !== undefined
                        ? `${(d.confidence > 1 ? d.confidence : d.confidence * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="py-2 text-right text-[var(--text-muted)] font-mono">
                      {d.predicted_range_bps !== null ? d.predicted_range_bps.toFixed(1) : "—"}
                    </td>
                    <td className="py-2 text-[var(--text-muted)] text-xs">{d.decision_reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No decision cycles yet" message={EMPTY_MSG} height={180} />
        )}
      </section>

      {/* Coming-later placeholders */}
      <div className="grid md:grid-cols-3 gap-6">
        <PlaceholderCard
          title="Training Reward Curve"
          description="Coming once training runs log to Supabase"
        />
        <PlaceholderCard
          title="Feature Importance"
          description="Coming once training runs log to Supabase"
        />
        <PlaceholderCard
          title="Retraining History"
          description="Coming once training runs log to Supabase"
        />
      </div>
    </div>
  );
}
