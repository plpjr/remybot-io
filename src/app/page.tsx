"use client";

import { useState } from "react";
import { useKronosData } from "@/lib/use-data";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { OverviewSkeleton } from "@/components/Skeleton";
import Chart from "@/components/Chart";
import type { EChartsOption } from "@/components/Chart";
import BotHealthCard from "@/components/BotHealthCard";
import ModelChorusCard from "@/components/ModelChorusCard";
import {
  TrendingUp,
  Target,
  BarChart3,
  Shield,
  Activity,
  LayoutDashboard,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

type TimeRange = "1W" | "1M" | "3M" | "ALL";

const RANGE_DAYS: Record<TimeRange, number | null> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  ALL: null,
};

export default function OverviewPage() {
  const { data, loading, error } = useKronosData();
  const s = data.overview;
  const [activeRange, setActiveRange] = useState<TimeRange>("ALL");

  if (loading) return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <OverviewSkeleton />
    </div>
  );

  // Filter equity curve based on selected time range
  const days = RANGE_DAYS[activeRange];
  const filteredCurve = days
    ? data.equityCurve.slice(-days)
    : data.equityCurve;

  const equityOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = (params as { data: [string, number] }[])[0];
        return `${p.data[0]}<br/>Equity: <b>$${p.data[1].toLocaleString()}</b>`;
      },
    },
    xAxis: {
      type: "category",
      data: filteredCurve.map((d) => d.date.slice(5)),
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(1)}k` },
    },
    series: [
      {
        type: "line",
        data: filteredCurve.map((d) => d.equity),
        smooth: false,
        showSymbol: false,
        lineStyle: { width: 2.5 },
        areaStyle: { opacity: 0.08 },
        emphasis: { disabled: true },
      },
    ],
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 animate-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Could not refresh data: {error}. Showing last known values.</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PageHeader title="Overview" description="Real-time performance dashboard" icon={LayoutDashboard} />
        <div className="flex items-center gap-3">
          <StatusBadge status={s.status} />
          <div className="text-right hidden sm:block">
            <p className="text-xs text-[var(--text-muted)]">Model {s.modelVersion}</p>
            <p className="text-xs text-[var(--text-muted)] opacity-70">Trained {s.lastTrained}</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="animate-in stagger-1">
          <StatCard
            label="Total Return"
            value={s.totalTrades > 0 ? `${s.totalReturn > 0 ? "+" : ""}${s.totalReturn}%` : "---"}
            sub={s.totalTrades > 0 ? `${s.totalReturnMonth > 0 ? "+" : ""}${s.totalReturnMonth}% this month` : "No live trades yet"}
            icon={TrendingUp}
            trend={s.totalTrades > 0 ? "up" : "neutral"}
          />
        </div>
        <div className="animate-in stagger-2">
          <StatCard
            label="Win Rate"
            value={s.winRate > 0 ? `${s.winRate}%` : "---"}
            sub={s.totalTrades > 0 ? `${s.totalTrades} total trades` : "In-sample estimate"}
            icon={Target}
            trend={s.winRate > 0 ? "up" : "neutral"}
          />
        </div>
        <div className="animate-in stagger-3">
          <StatCard
            label="Avg PnL/Trade"
            value={s.avgPnlBps > 0 ? `+${s.avgPnlBps} bps` : "---"}
            sub="10-seed robustness mean"
            icon={BarChart3}
            trend={s.avgPnlBps > 0 ? "up" : "neutral"}
          />
        </div>
        <div className="animate-in stagger-4">
          <StatCard
            label="Sharpe Ratio"
            value={s.sharpeRatio > 0 ? s.sharpeRatio.toFixed(2) : "---"}
            icon={Shield}
            trend={s.sharpeRatio > 0 ? "up" : "neutral"}
          />
        </div>
        <div className="animate-in stagger-5">
          <StatCard
            label="Max Drawdown"
            value={s.maxDrawdown !== 0 ? `${s.maxDrawdown}%` : "---"}
            icon={Activity}
            trend="neutral"
          />
        </div>
      </div>

      {/* Model Chorus — per-cycle model votes + final decision */}
      <ModelChorusCard latest={data.latestModelVotes} />

      {/* Equity Curve */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Equity Curve</h2>
            <p className="text-sm text-[var(--text-muted)]">Portfolio value over time (USD)</p>
          </div>
          {filteredCurve.length > 0 && (
            <div className="flex gap-2" role="group" aria-label="Equity curve time range">
              {(["1W", "1M", "3M", "ALL"] as TimeRange[]).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setActiveRange(period)}
                  aria-pressed={activeRange === period}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 ${
                    activeRange === period
                      ? "bg-blue-600 text-white"
                      : "bg-[var(--bg)] text-[var(--text-muted)] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          )}
        </div>
        {filteredCurve.length > 0 ? (
          <Chart option={equityOption} height={320} />
        ) : (
          <div className="py-16 text-center">
            <BarChart3 className="w-10 h-10 text-[var(--text-muted)] opacity-30 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm text-[var(--text-muted)]">
              No closed trades yet. The equity curve populates from
              paper-trade PnL as the bot runs.
            </p>
          </div>
        )}
      </section>

      {/* Recent Performance + live Bot Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-1">Recent Performance</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">Rolling returns</p>
          {data.recentPerformance.every((r) => r.trades === 0) ? (
            <div className="py-8 text-center">
              <Activity className="w-8 h-8 text-[var(--text-muted)] opacity-40 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-[var(--text-muted)]">
                No closed trades yet. Paper-trade run hasn&apos;t started.
              </p>
              <p className="text-xs text-[var(--text-muted)] opacity-70 mt-1">
                Stats appear here within ~5 minutes of the first closed trade.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentPerformance.map((r) => (
                <div key={r.period} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="font-medium text-[var(--text)]">{r.period}</p>
                    <p className="text-xs text-[var(--text-muted)]">{r.trades} trades · {r.winRate}% WR</p>
                  </div>
                  <span className={`text-lg font-bold tabular-nums ${r.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {r.pnl >= 0 ? "+" : ""}{r.pnl}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Live bot health via /api/healthz — Phase 3 integration */}
        <BotHealthCard />
      </div>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--text-muted)]">
          Kronos Trading Bot · Range prediction + entry timing + signal fusion
        </p>
        <p className="text-xs text-[var(--text-muted)] opacity-50 mt-1">
          Performance shown is from backtesting / paper trading. Past performance does not guarantee future results.
        </p>
      </footer>
    </div>
  );
}
