"use client";

import { useState } from "react";
import { TrendingUp, DollarSign, Timer, Flame, BarChart3, Grid3X3, Activity, LogOut, FileSearch } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { HealthCard } from "@/components/HealthIndicator";
import { useKronosData } from "@/lib/use-data";
import Chart from "@/components/Chart";
import type { EChartsOption } from "@/components/Chart";
import DecisionDetailModal from "@/components/DecisionDetailModal";
import { getHealthStatus } from "@/lib/health-status";
import type { LatestModelVotes, ModelVotes } from "@/lib/data";

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-[var(--text)]">{value}</span>
        {sub && <p className="text-[10px] text-[var(--text-muted)] opacity-70">{sub}</p>}
      </div>
    </div>
  );
}

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
  "No paper trades yet — the bot has been holding. Charts fill in once the bot executes trades.";

export default function TradingPage() {
  const { data } = useKronosData();
  const m = data.tradeMetrics;
  const dailyPnl = data.dailyPnl;
  const weeklyPnl = data.weeklyPnl;
  const tradeDurations = data.tradeDurations;
  const streaks = data.streaks;
  const hourlyPerformance = data.hourlyPerformance;
  const micro = data.microstructureHourly;
  const exitReasons = data.exitReasonBreakdown;
  const signalAudit = data.signalOutcomeAudit;
  const latestVotes = data.latestModelVotes;
  const hasMicro = micro.length > 0;
  const hasDailyPnl = dailyPnl.length > 0;
  const hasWeeklyPnl = weeklyPnl.length > 0;
  const hasDurations = tradeDurations.some((b) => b.count > 0);
  const hasHourly = hourlyPerformance.some((h) => h.trades > 0);
  const hasStreaks = streaks.streakHistory.length > 0;
  const hasExits = exitReasons.length > 0;
  const hasSignalAudit = signalAudit.length > 0;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState<LatestModelVotes | null>(null);

  const openModalForSignal = (signalIdx: number) => {
    const row = signalAudit[signalIdx];
    if (!row) return;
    // Only the row whose signal_time matches latestVotes.timestamp can
    // carry a populated votes jsonb; everything else falls through to
    // the "pre-Track B" message inside the modal.
    const isLatest =
      latestVotes.timestamp && latestVotes.timestamp === row.signal_time;
    const votes: ModelVotes | null = isLatest ? latestVotes.model_votes : null;
    setModalRow({
      timestamp: row.signal_time,
      model_votes: votes,
      decision_action: "signal",
      decision_reason: `Signal → trade ${row.trade_id}, exit ${row.exit_reason ?? "pending"}`,
    });
    setModalOpen(true);
  };

  const exitReasonOption: EChartsOption = hasExits
    ? {
        tooltip: {
          trigger: "axis",
          formatter: (params: unknown) => {
            const arr = params as { name: string; value: number; seriesName: string }[];
            return arr
              .map((p) => `${p.seriesName}: ${p.value}`)
              .join("<br/>");
          },
        },
        legend: {
          data: ["Count", "Total PnL ($)"],
          bottom: 0,
          textStyle: { fontSize: 10 },
        },
        grid: { bottom: 40, left: 110 },
        xAxis: { type: "value" },
        yAxis: {
          type: "category",
          data: exitReasons.map((r) => r.reason),
          inverse: true,
          axisLabel: { fontSize: 10 },
        },
        series: [
          {
            name: "Count",
            type: "bar",
            data: exitReasons.map((r) => r.count),
            itemStyle: { color: "#3b82f6", borderRadius: [0, 4, 4, 0] },
            barMaxWidth: 16,
          },
          {
            name: "Total PnL ($)",
            type: "bar",
            data: exitReasons.map((r) => ({
              value: r.total_pnl_usd,
              itemStyle: {
                color: r.total_pnl_usd >= 0 ? "#10b981" : "#ef4444",
                borderRadius: [0, 4, 4, 0],
              },
            })),
            barMaxWidth: 16,
          },
        ],
      }
    : {};

  const microPriceOption: EChartsOption = hasMicro ? {
    tooltip: { trigger: "axis" },
    legend: { data: ["Avg Price", "Trade Intensity"], bottom: 0 },
    grid: { bottom: 36 },
    xAxis: {
      type: "category",
      data: micro.map((d) => d.time?.slice(5, 16) ?? ""),
      boundaryGap: false,
    },
    yAxis: [
      { type: "value", axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(0)}k` }, position: "left" },
      { type: "value", axisLabel: { formatter: (v: number) => v.toFixed(1) }, position: "right", splitLine: { show: false } },
    ],
    series: [
      {
        name: "Avg Price",
        type: "line",
        data: micro.map((d) => d.avg_price),
        showSymbol: false,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.06 },
      },
      {
        name: "Trade Intensity",
        type: "bar",
        yAxisIndex: 1,
        data: micro.map((d) => d.avg_trade_intensity),
        itemStyle: { opacity: 0.5 },
        barMaxWidth: 4,
      },
    ],
  } : {};

  const dailyPnlOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = (params as { name: string; data: number }[])[0];
        return `${p.name}<br/>PnL: <b>$${p.data.toFixed(2)}</b>`;
      },
    },
    xAxis: {
      type: "category",
      data: dailyPnl.map((d) => d.date.slice(5)),
      axisLabel: { interval: Math.max(0, Math.floor(dailyPnl.length / 10) - 1), fontSize: 10 },
    },
    yAxis: { type: "value", axisLabel: { formatter: (v: number) => `$${v}` } },
    series: [{
      type: "bar",
      data: dailyPnl.map((d) => ({
        value: d.pnl_usd,
        itemStyle: { color: d.pnl_usd >= 0 ? "#10b981" : "#ef4444", borderRadius: [4, 4, 0, 0] },
      })),
      barMaxWidth: 20,
    }],
  };

  const weeklyPnlOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = (params as { name: string; data: number }[])[0];
        return `${p.name}<br/>PnL: <b>$${p.data.toFixed(2)}</b>`;
      },
    },
    xAxis: { type: "category", data: weeklyPnl.map((d) => d.week) },
    yAxis: { type: "value", axisLabel: { formatter: (v: number) => `$${v}` } },
    series: [{
      type: "bar",
      data: weeklyPnl.map((d) => ({
        value: d.pnl_usd,
        itemStyle: { color: d.pnl_usd >= 0 ? "#3b82f6" : "#ef4444", borderRadius: [4, 4, 0, 0] },
      })),
      barMaxWidth: 30,
    }],
  };

  const durationOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "value" },
    yAxis: { type: "category", data: tradeDurations.map((d) => d.range), inverse: true },
    series: [{
      type: "bar",
      data: tradeDurations.map((d) => d.count),
      itemStyle: { color: "#3b82f6", borderRadius: [0, 4, 4, 0] },
      barMaxWidth: 20,
    }],
    grid: { left: 70 },
  };

  const bestDurationBucket = tradeDurations
    .filter((b) => b.count > 0)
    .sort((a, b) => b.avgPnlBps - a.avgPnlBps)[0];

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Trading" description="Detailed trade analysis and PnL breakdown" icon={TrendingUp} />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HealthCard label="Profit Factor" value={m.profitFactor.toFixed(2)} status={getHealthStatus("profitFactor", m.profitFactor)} sub="Gross profit / loss" />
        <HealthCard label="Expectancy" value={`${m.expectancy >= 0 ? "+" : ""}${m.expectancy} bps`} status={getHealthStatus("avgPnl", m.expectancy)} sub="Per trade expected value" />
        <HealthCard label="Payoff Ratio" value={m.payoffRatio.toFixed(2)} status={m.payoffRatio > 1.5 ? "healthy" : m.payoffRatio > 1.0 ? "caution" : "critical"} sub="Avg win / avg loss" />
        <HealthCard label="Net PnL" value={`$${m.netAfterFees.toLocaleString()}`} status={m.netAfterFees >= 0 ? "healthy" : "caution"} sub={`${m.totalTrades} closed trades`} />
      </div>

      {/* Microstructure Price Chart (live data) */}
      {hasMicro && (
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-[var(--text)]">BTC Price + Microstructure</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-6">Hourly averages from live order flow data</p>
          <Chart option={microPriceOption} height={280} />
        </section>
      )}

      {/* Daily PnL Chart */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Daily PnL</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">Profit and loss by day (USD, UTC)</p>
        {hasDailyPnl ? (
          <Chart option={dailyPnlOption} height={240} />
        ) : (
          <EmptyState title="No daily PnL yet" message={EMPTY_MSG} height={240} />
        )}
      </section>

      {/* Weekly PnL */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Weekly PnL</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">Aggregated weekly returns (USD, ISO week)</p>
        {hasWeeklyPnl ? (
          <Chart option={weeklyPnlOption} height={200} />
        ) : (
          <EmptyState title="No weekly PnL yet" message={EMPTY_MSG} height={200} />
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trade Duration */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-[var(--text)]">Trade Duration</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">Hold time distribution and impact on PnL</p>
          {hasDurations ? (
            <>
              <Chart option={durationOption} height={200} />
              {bestDurationBucket && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-900">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    <span className="font-semibold">Best bucket:</span> {bestDurationBucket.range} at {bestDurationBucket.avgPnlBps >= 0 ? "+" : ""}{bestDurationBucket.avgPnlBps} bps avg across {bestDurationBucket.count} trades.
                  </p>
                </div>
              )}
            </>
          ) : (
            <EmptyState title="No closed trades yet" message={EMPTY_MSG} height={200} />
          )}
        </section>

        {/* Win/Loss Streaks */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-[var(--text)]">Win/Loss Streaks</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">Consecutive wins and losses</p>
          {hasStreaks ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${streaks.currentStreak.type === "win" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : streaks.currentStreak.type === "loss" ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400" : "bg-[var(--bg)] text-[var(--text-muted)]"}`}>
                  Current: {streaks.currentStreak.length} {streaks.currentStreak.type === "none" ? "—" : streaks.currentStreak.type === "loss" ? "losses" : "wins"}
                </div>
              </div>
              <div className="space-y-1 mb-4">
                <MetricRow label="Longest Win Streak" value={`${streaks.longestWinStreak} trades`} />
                <MetricRow label="Longest Loss Streak" value={`${streaks.longestLossStreak} trades`} />
              </div>
              <div className="flex gap-1 flex-wrap">
                {streaks.streakHistory.map((s, i) => (
                  <div key={i} className="flex gap-0.5">
                    {Array.from({ length: s.length }).map((_, j) => (
                      <div key={j} className={`w-2.5 h-6 rounded-sm ${s.type === "win" ? "bg-emerald-400" : "bg-red-400"}`} />
                    ))}
                    <div className="w-1" />
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400" /> Wins</span>
                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400" /> Losses</span>
              </div>
            </>
          ) : (
            <EmptyState title="No streaks yet" message={EMPTY_MSG} height={220} />
          )}
        </section>
      </div>

      {/* Hourly Heatmap */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <Grid3X3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Hourly Performance</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">Average PnL by hour (UTC) — find the best and worst trading windows</p>
        {hasHourly ? (
          <>
            <div className="grid grid-cols-12 gap-1">
              {hourlyPerformance.map((h) => {
                const intensity = Math.min(1, Math.max(0, (h.avgPnlBps + 10) / 30));
                const bg = h.trades === 0
                  ? "rgba(148, 163, 184, 0.05)"
                  : h.avgPnlBps >= 0
                    ? `rgba(16, 185, 129, ${0.1 + intensity * 0.6})`
                    : `rgba(239, 68, 68, ${0.1 + Math.abs(h.avgPnlBps) / 15 * 0.6})`;
                return (
                  <div key={h.hour} className="rounded-lg p-2 text-center border border-[var(--border)]" style={{ backgroundColor: bg }}>
                    <p className="text-[10px] font-mono text-[var(--text-muted)]">{String(h.hour).padStart(2, "0")}</p>
                    <p className={`text-xs font-bold ${h.trades === 0 ? "text-[var(--text-muted)]" : h.avgPnlBps >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}>
                      {h.trades === 0 ? "—" : `${h.avgPnlBps >= 0 ? "+" : ""}${h.avgPnlBps}`}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)]">{h.trades}t</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-6 mt-3">
              <span className="text-[10px] text-[var(--text-muted)]">Green = profitable hours</span>
              <span className="text-[10px] text-[var(--text-muted)]">Red = unprofitable hours</span>
              <span className="text-[10px] text-[var(--text-muted)]">Darker = stronger signal</span>
            </div>
          </>
        ) : (
          <EmptyState title="No hourly breakdown yet" message={EMPTY_MSG} height={160} />
        )}
      </section>

      {/* Exit Reason Breakdown */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <LogOut className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Exit Reason Breakdown</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          How trades are closing — stop_loss / take_profit / signal_exit / tick_feed_crash / manual
        </p>
        {hasExits ? (
          <Chart option={exitReasonOption} height={260} />
        ) : (
          <EmptyState
            title="No trades closed yet"
            message="Bar chart fills in once the executor records its first closed trade."
            height={200}
          />
        )}
      </section>

      {/* Signal Outcome Audit */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <FileSearch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Signal Outcome Audit</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Each recent signal and what happened to the trade it opened — click for per-model breakdown
        </p>
        {hasSignalAudit ? (
          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--card)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 text-[var(--text-muted)] font-medium">Signal Time</th>
                  <th className="text-right py-2 text-[var(--text-muted)] font-medium">Conf.</th>
                  <th className="text-left py-2 text-[var(--text-muted)] font-medium">Exit Reason</th>
                  <th className="text-right py-2 text-[var(--text-muted)] font-medium">PnL (USD)</th>
                  <th className="text-right py-2 text-[var(--text-muted)] font-medium">PnL (bps)</th>
                </tr>
              </thead>
              <tbody>
                {signalAudit.map((r, i) => (
                  <tr
                    key={`${r.signal_time}-${i}`}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg)] cursor-pointer transition-colors"
                    onClick={() => openModalForSignal(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openModalForSignal(i);
                      }
                    }}
                  >
                    <td className="py-2 font-mono text-[var(--text-muted)] text-xs">{r.signal_time.slice(5, 16)}</td>
                    <td className="py-2 text-right text-[var(--text-muted)] font-mono">
                      {(r.signal_confidence > 1
                        ? r.signal_confidence
                        : r.signal_confidence * 100
                      ).toFixed(1)}%
                    </td>
                    <td className="py-2 text-[var(--text-muted)] text-xs">
                      {r.exit_reason ?? (
                        <span className="italic opacity-70">open</span>
                      )}
                    </td>
                    <td className={`py-2 text-right font-mono ${r.profit_usd === null ? "text-[var(--text-muted)]" : r.profit_usd >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {r.profit_usd === null
                        ? "—"
                        : `${r.profit_usd >= 0 ? "+" : ""}$${r.profit_usd.toFixed(2)}`}
                    </td>
                    <td className={`py-2 text-right font-mono ${r.profit_bps === null ? "text-[var(--text-muted)]" : r.profit_bps >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {r.profit_bps === null
                        ? "—"
                        : `${r.profit_bps >= 0 ? "+" : ""}${r.profit_bps.toFixed(1)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No signals yet"
            message="Audit table fills in once the bot records its first signal (entry)."
            height={200}
          />
        )}
      </section>

      {/* Decision Detail Modal (shared with /model) */}
      <DecisionDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        timestamp={modalRow?.timestamp ?? null}
        votes={modalRow?.model_votes ?? null}
        decisionAction={modalRow?.decision_action}
        decisionReason={modalRow?.decision_reason}
      />

      {/* Trade Metrics Table */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Key Trade Metrics</h3>
        <div className="grid md:grid-cols-2 gap-x-8">
          <div>
            <MetricRow label="Average Win" value={`${m.avgWin >= 0 ? "+" : ""}${m.avgWin} bps`} />
            <MetricRow label="Average Loss" value={`${m.avgLoss} bps`} />
            <MetricRow label="Largest Win" value={`${m.largestWin >= 0 ? "+" : ""}${m.largestWin} bps`} />
            <MetricRow label="Largest Loss" value={`${m.largestLoss} bps`} />
          </div>
          <div>
            <MetricRow label="Profit Factor" value={m.profitFactor.toFixed(2)} />
            <MetricRow label="Payoff Ratio" value={m.payoffRatio.toFixed(2)} />
            <MetricRow label="Avg Slippage" value="— not tracked yet" />
            <MetricRow label="Total Fees" value="— not tracked yet" />
          </div>
        </div>
      </section>
    </div>
  );
}
