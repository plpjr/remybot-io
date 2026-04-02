"use client";

import { useState } from "react";
import { useKronosData } from "@/lib/use-data";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { OverviewSkeleton } from "@/components/Skeleton";
import Chart from "@/components/Chart";
import type { EChartsOption } from "@/components/Chart";
import {
  TrendingUp,
  Target,
  BarChart3,
  Shield,
  Activity,
  Clock,
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

      {/* Equity Curve */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Equity Curve</h2>
            <p className="text-sm text-[var(--text-muted)]">Portfolio value over time (USD)</p>
          </div>
          <div className="flex gap-2">
            {(["1W", "1M", "3M", "ALL"] as TimeRange[]).map((period) => (
              <button
                key={period}
                onClick={() => setActiveRange(period)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeRange === period
                    ? "bg-blue-600 text-white"
                    : "bg-[var(--bg)] text-[var(--text-muted)] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <Chart option={equityOption} height={320} />
      </section>

      {/* Recent Performance */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-1">Recent Performance</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">Rolling returns</p>
        <div className="space-y-4">
          {data.recentPerformance.map((r) => (
            <div key={r.period} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
              <div>
                <p className="font-medium text-[var(--text)]">{r.period}</p>
                <p className="text-xs text-[var(--text-muted)]">{r.trades} trades · {r.winRate}% WR</p>
              </div>
              <span className={`text-lg font-bold ${r.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                {r.pnl >= 0 ? "+" : ""}{r.pnl}%
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-900">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Bot Status</span>
          </div>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
            {s.status === "running" ? s.uptime : "Offline"}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Model: {s.modelVersion}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--text-muted)]">Kronos Trading Bot · Powered by Reinforcement Learning</p>
        <p className="text-xs text-[var(--text-muted)] opacity-50 mt-1">
          Performance shown is from backtesting/paper trading. Past performance does not guarantee future results.
        </p>
      </footer>
    </div>
  );
}
