"use client";

import { useState } from "react";
import { Brain, Layers, Gauge, PieChart, BarChart3, Compass } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PlaceholderCard from "@/components/PlaceholderCard";
import { HealthDot } from "@/components/HealthIndicator";
import Chart from "@/components/Chart";
import type { EChartsOption } from "@/components/Chart";
import DecisionDetailModal from "@/components/DecisionDetailModal";
import { useKronosData } from "@/lib/use-data";
import type { LatestModelVotes, ModelVotes } from "@/lib/data";

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
  const holdReasons = data.holdReasonBreakdown;
  const rangeWidth = data.rangeWidthHistogram;
  const directionBias = data.directionBiasCounts;
  const latestVotes = data.latestModelVotes;

  const hasConfidence = confidenceDistribution.some((b) => b.count > 0);
  const hasDecisions = decisionTrace.length > 0;
  const hasRegimes = regimeBreakdown.length > 0;
  const hasHoldReasons = holdReasons.length > 0;
  const hasRangeWidth = rangeWidth.some((b) => b.count > 0);
  const hasDirectionBias = directionBias.some((b) => b.count > 0);

  // State for the decision-detail modal. The dashboard doesn't yet
  // fetch per-row model_votes, so the modal always renders the latest
  // row's votes as a best-effort preview (with the honest "pre-Track B"
  // fallback inside the modal for older rows).
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState<LatestModelVotes | null>(null);

  const openModalForRow = (idx: number) => {
    const row = decisionTrace[idx];
    if (!row) return;
    // Use the latest model_votes jsonb only when the row timestamp
    // matches the latest cycle; otherwise mark as pre-Track B so the
    // modal shows the honest "older schema" message.
    const isLatest =
      latestVotes.timestamp &&
      latestVotes.timestamp === row.timestamp;
    const votes: ModelVotes | null = isLatest ? latestVotes.model_votes : null;
    setModalRow({
      timestamp: row.timestamp,
      model_votes: votes,
      decision_action: row.decision_action ?? "",
      decision_reason: row.decision_reason ?? "",
    });
    setModalOpen(true);
  };

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

  // Hold-reason donut — register isn't wired for pie, so show as a
  // horizontal bar with top-6 + "other" bucket. Labels stay readable
  // and colors come from a seeded palette for consistency between loads.
  const holdTop = holdReasons.slice(0, 6);
  const holdOther = holdReasons.slice(6).reduce((s, r) => s + r.count, 0);
  const holdRows =
    holdOther > 0
      ? [...holdTop, { reason: "other", count: holdOther }]
      : holdTop;
  const holdTotal = holdRows.reduce((s, r) => s + r.count, 0);
  const holdPalette = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#a855f7",
    "#06b6d4",
    "#94a3b8",
  ];
  const holdReasonOption: EChartsOption = hasHoldReasons
    ? {
        tooltip: {
          trigger: "item",
          formatter: (params: unknown) => {
            const p = params as { name: string; value: number };
            const pct = holdTotal > 0
              ? ((p.value / holdTotal) * 100).toFixed(1)
              : "0";
            return `${p.name}<br/><b>${p.value}</b> holds (${pct}%)`;
          },
        },
        xAxis: { type: "value", show: false },
        yAxis: {
          type: "category",
          data: holdRows.map((r) => r.reason),
          inverse: true,
          axisLabel: { fontSize: 10 },
        },
        grid: { left: 120 },
        series: [
          {
            type: "bar",
            data: holdRows.map((r, i) => ({
              value: r.count,
              name: r.reason,
              itemStyle: {
                color: holdPalette[i % holdPalette.length],
                borderRadius: [0, 4, 4, 0],
              },
            })),
            barMaxWidth: 20,
            label: {
              show: true,
              position: "right",
              formatter: "{c}",
              fontSize: 10,
            },
          },
        ],
      } as EChartsOption
    : {};

  const rangeWidthOption: EChartsOption = hasRangeWidth
    ? {
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category",
          data: rangeWidth.map((d) => d.bucket),
          axisLabel: { fontSize: 10 },
          name: "bps",
          nameTextStyle: { fontSize: 10 },
          nameGap: 22,
          nameLocation: "middle",
        },
        yAxis: { type: "value" },
        grid: { bottom: 36 },
        series: [
          {
            type: "bar",
            data: rangeWidth.map((d) => ({
              value: d.count,
              itemStyle: {
                color: "#3b82f6",
                borderRadius: [4, 4, 0, 0],
              },
            })),
            barMaxWidth: 50,
          },
        ],
      }
    : {};

  const directionPalette: Record<string, string> = {
    up: "#10b981",
    down: "#ef4444",
    null: "#94a3b8",
    unknown: "#94a3b8",
  };
  const directionBiasOption: EChartsOption = hasDirectionBias
    ? {
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category",
          data: directionBias.map((d) => d.bias),
        },
        yAxis: { type: "value" },
        series: [
          {
            type: "bar",
            data: directionBias.map((d) => ({
              value: d.count,
              itemStyle: {
                color: directionPalette[d.bias] ?? "#64748b",
                borderRadius: [4, 4, 0, 0],
              },
            })),
            barMaxWidth: 60,
          },
        ],
      }
    : {};

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
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Last 50 cycles — click a row to see the full per-model breakdown
        </p>
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
                  <tr
                    key={`${d.timestamp}-${i}`}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg)] cursor-pointer transition-colors"
                    onClick={() => openModalForRow(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openModalForRow(i);
                      }
                    }}
                  >
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

      {/* Tier-2: Hold Reason Donut + Range Width Histogram + Direction Bias */}
      <div className="grid md:grid-cols-3 gap-6">
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-[var(--text)]">Hold Reasons</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Why the bot stayed in hold across recent cycles
          </p>
          {hasHoldReasons ? (
            <Chart option={holdReasonOption} height={260} />
          ) : (
            <EmptyState
              title="No hold reasons yet"
              message="Card populates once the bot logs its first hold decision."
              height={260}
            />
          )}
        </section>

        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-[var(--text)]">Range Width</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Distribution of Chronos predicted ranges (basis points)
          </p>
          {hasRangeWidth ? (
            <Chart option={rangeWidthOption} height={260} />
          ) : (
            <EmptyState
              title="No range predictions yet"
              message="Histogram fills in once Chronos emits its first predictions."
              height={260}
            />
          )}
        </section>

        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-[var(--text)]">Direction Bias</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Up / down / null counts from the Chronos predicted close
          </p>
          {hasDirectionBias ? (
            <Chart option={directionBiasOption} height={260} />
          ) : (
            <EmptyState
              title="No direction bias yet"
              message="Card populates once predictions land with a direction value."
              height={260}
            />
          )}
        </section>
      </div>

      {/* Decision Detail Modal */}
      <DecisionDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        timestamp={modalRow?.timestamp ?? null}
        votes={modalRow?.model_votes ?? null}
        decisionAction={modalRow?.decision_action}
        decisionReason={modalRow?.decision_reason}
      />

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
