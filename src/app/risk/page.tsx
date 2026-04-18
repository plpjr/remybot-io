"use client";

import { ShieldCheck, Zap } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { HealthCard } from "@/components/HealthIndicator";
import Chart from "@/components/Chart";
import type { EChartsOption } from "@/components/Chart";
import { useKronosData } from "@/lib/use-data";
import { getHealthStatus, type HealthStatus } from "@/lib/health-status";

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

function BreakerBadge({ state }: { state: string }) {
  const s = state.toLowerCase();
  const cls =
    s === "closed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
      : s === "half" || s === "half_open" || s === "half-open"
        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
        : s === "open"
          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
          : "bg-[var(--bg)] text-[var(--text-muted)] border-[var(--border)]";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {state}
    </span>
  );
}

const EMPTY_MSG =
  "No paper trades yet — drawdown + risk curves fill in once the bot executes trades.";

export default function RiskPage() {
  const { data } = useKronosData();
  const drawdownCurve = data.drawdownCurve;
  const overview = data.overview;
  const streaks = data.streaks;
  const breakers = data.circuitBreakers;
  const hasDrawdown = drawdownCurve.length > 0;

  const maxDD = overview.maxDrawdown; // %
  const currentDD = drawdownCurve.length
    ? drawdownCurve[drawdownCurve.length - 1].drawdownPct
    : 0;
  const winRate = overview.winRate;
  const profitFactor = overview.profitFactor;

  // Sharpe proxy — computed upstream by fetchOverviewStats (currently 0 until mart lands).
  const sharpe = overview.sharpeRatio;

  const currentLossStreakLen =
    streaks.currentStreak.type === "loss" ? streaks.currentStreak.length : 0;

  const drawdownOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = (params as { name: string; data: number }[])[0];
        return `${p.name}<br/>Drawdown: <b>${p.data}%</b>`;
      },
    },
    xAxis: {
      type: "category",
      data: drawdownCurve.map((d) => d.date.slice(5)),
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      max: 0,
      axisLabel: { formatter: (v: number) => `${v}%` },
    },
    series: [{
      type: "line",
      data: drawdownCurve.map((d) => d.drawdownPct),
      showSymbol: false,
      lineStyle: { width: 2, color: "#ef4444" },
      itemStyle: { color: "#ef4444" },
      areaStyle: { color: "#fecaca", opacity: 0.3 },
    }],
  };

  const breakerEntries = Object.entries(breakers);
  const hasBreakers = breakerEntries.length > 0;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Risk" description="Drawdown analysis and risk-adjusted performance metrics" icon={ShieldCheck} />

      {/* Key Risk Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HealthCard
          label="Max Drawdown"
          value={`${maxDD.toFixed(2)}%`}
          status={getHealthStatus("maxDrawdown", maxDD)}
          sub="From peak equity"
        />
        <HealthCard
          label="Current DD"
          value={`${currentDD.toFixed(2)}%`}
          status={currentDD > -2 ? "healthy" : currentDD > -5 ? "caution" : "critical"}
          sub={hasDrawdown ? "Latest equity day" : "No trades yet"}
        />
        <HealthCard
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          status={getHealthStatus("winRate", winRate)}
          sub={`${overview.totalTrades} closed trades`}
        />
        <HealthCard
          label="Profit Factor"
          value={profitFactor.toFixed(2)}
          status={getHealthStatus("profitFactor", profitFactor)}
          sub="Gross profit / loss"
        />
      </div>

      {/* Drawdown Chart */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Drawdown Over Time</h3>
        <p className="text-sm text-[var(--text-muted)] mb-6">Underwater equity curve — time and depth of losses</p>
        {hasDrawdown ? (
          <Chart option={drawdownOption} height={260} />
        ) : (
          <EmptyState title="No drawdown curve yet" message={EMPTY_MSG} height={260} />
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk-Adjusted Metrics */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Risk-Adjusted Returns</h3>
          <div className="space-y-1">
            {[
              {
                label: "Sharpe Ratio",
                value: sharpe > 0 ? sharpe.toFixed(2) : "—",
                status: sharpe > 0 ? getHealthStatus("sharpe", sharpe) : ("caution" as HealthStatus),
                note: sharpe > 0 ? undefined : "Needs daily returns mart",
              },
              {
                label: "Max Drawdown",
                value: `${maxDD.toFixed(2)}%`,
                status: getHealthStatus("maxDrawdown", maxDD),
              },
              {
                label: "Current Drawdown",
                value: `${currentDD.toFixed(2)}%`,
                status: (currentDD > -2
                  ? "healthy"
                  : currentDD > -5
                    ? "caution"
                    : "critical") as HealthStatus,
              },
              {
                label: "Profit Factor",
                value: profitFactor.toFixed(2),
                status: getHealthStatus("profitFactor", profitFactor),
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                <span className="text-sm text-[var(--text-muted)]">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--text)]">{item.value}</span>
                  <span className={`w-2 h-2 rounded-full ${item.status === "healthy" ? "bg-emerald-500" : item.status === "caution" ? "bg-amber-500" : "bg-red-500"}`} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-4">
            Sortino / Calmar / Ulcer will surface once the daily-returns mart lands in Supabase.
          </p>
        </section>

        {/* Consecutive Losses (from streaks) */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Consecutive Losses</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">Loss-streak tracker from closed trades</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-[var(--bg)] rounded-xl">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Current</p>
              <p className={`text-2xl font-bold ${currentLossStreakLen >= 4 ? "text-red-600 dark:text-red-400" : currentLossStreakLen >= 2 ? "text-amber-600 dark:text-amber-400" : "text-[var(--text)]"}`}>
                {currentLossStreakLen}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">losses in a row</p>
            </div>
            <div className="p-3 bg-[var(--bg)] rounded-xl">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Longest</p>
              <p className="text-2xl font-bold text-[var(--text)]">{streaks.longestLossStreak}</p>
              <p className="text-[10px] text-[var(--text-muted)]">worst run to date</p>
            </div>
          </div>
          <div className={`mt-3 p-3 rounded-xl border ${currentLossStreakLen >= 4 ? "bg-red-50 border-red-100 dark:bg-red-950 dark:border-red-900" : "bg-amber-50 border-amber-100 dark:bg-amber-950 dark:border-amber-900"}`}>
            <p className={`text-xs ${currentLossStreakLen >= 4 ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
              <span className="font-semibold">Status: {getHealthStatus("consecutiveLosses", currentLossStreakLen)}</span>
              {" — "}
              {currentLossStreakLen === 0
                ? "No active loss streak."
                : `${currentLossStreakLen} consecutive losses; cutoff at 7 triggers circuit breaker.`}
            </p>
          </div>
        </section>
      </div>

      {/* Circuit Breakers */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Circuit Breakers</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Latest breaker state from <code>kronos_bot_status.circuit_breakers</code>
        </p>
        {hasBreakers ? (
          <div className="grid md:grid-cols-2 gap-2">
            {breakerEntries.map(([name, b]) => (
              <div
                key={name}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    failures: {b.failure_count}
                  </p>
                </div>
                <BreakerBadge state={b.state} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No breaker state reported"
            message="Bot has not written a status heartbeat yet (or breakers weren't included)."
            height={120}
          />
        )}
      </section>
    </div>
  );
}
