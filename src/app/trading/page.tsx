"use client";

import { TrendingUp, DollarSign, Timer, Flame, BarChart3, Grid3X3 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MockDataBanner from "@/components/MockDataBanner";
import { HealthCard } from "@/components/HealthIndicator";
import { useChartTheme, tooltipStyle } from "@/lib/useChartTheme";
import {
  dailyPnl, weeklyPnl, tradeDurations, streaks, hourlyPerformance, tradingMetrics, getHealthStatus,
} from "@/lib/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

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

export default function TradingPage() {
  const m = tradingMetrics;
  const ct = useChartTheme();
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Trading" description="Detailed trade analysis and PnL breakdown" icon={TrendingUp} />
      <MockDataBanner />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HealthCard label="Profit Factor" value={m.profitFactor.toFixed(1)} status={getHealthStatus("profitFactor", m.profitFactor)} sub="Gross profit / loss" />
        <HealthCard label="Expectancy" value={`+${m.expectancy} bps`} status={getHealthStatus("avgPnl", m.expectancy)} sub="Per trade expected value" />
        <HealthCard label="Payoff Ratio" value={m.payoffRatio.toFixed(2)} status={m.payoffRatio > 1.5 ? "healthy" : m.payoffRatio > 1.0 ? "caution" : "critical"} sub="Avg win / avg loss" />
        <HealthCard label="Net After Fees" value={`$${m.netAfterFees.toLocaleString()}`} status="healthy" sub={`Fees: $${Math.abs(m.totalFees).toFixed(2)}`} />
      </div>

      {/* Daily PnL Chart */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Daily PnL</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">Profit and loss by day (March 2026)</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dailyPnl}>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: ct.tick }} interval={2} />
            <YAxis tick={{ fontSize: 11, fill: ct.tick }} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle(ct)} formatter={(value: unknown) => [`${Number(value).toFixed(2)}%`, "PnL"]} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={20}>
              {dailyPnl.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Weekly PnL */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Weekly PnL</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">Aggregated weekly returns</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyPnl}>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: ct.tick }} />
            <YAxis tick={{ fontSize: 11, fill: ct.tick }} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle(ct)} formatter={(v: unknown) => [`${v}%`, "PnL"]} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={30}>
              {weeklyPnl.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? "#3b82f6" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trade Duration */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-[var(--text)]">Trade Duration</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">Hold time distribution and impact on PnL</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tradeDurations} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis type="number" tick={{ fontSize: 11, fill: ct.tick }} />
              <YAxis type="category" dataKey="range" tick={{ fontSize: 11, fill: ct.tick }} width={60} />
              <Tooltip contentStyle={tooltipStyle(ct)} formatter={(v: unknown, name: unknown) => [name === "count" ? `${v}` : `${v} bps`, name === "count" ? "Trades" : "Avg PnL"]} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-900">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-semibold">Sweet spot:</span> 30m-1h trades have the highest avg PnL (+{tradeDurations[2].avgPnl} bps). Trades over 4h tend to lose money.
            </p>
          </div>
        </section>

        {/* Win/Loss Streaks */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-[var(--text)]">Win/Loss Streaks</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">Consecutive wins and losses</p>
          <div className="flex items-center gap-3 mb-4">
            <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${streaks.currentStreak.type === "win" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"}`}>
              Current: {streaks.currentStreak.length} {streaks.currentStreak.type === "loss" ? "losses" : "wins"}
            </div>
          </div>
          <div className="space-y-1 mb-4">
            <MetricRow label="Longest Win Streak" value={`${streaks.longestWinStreak} trades`} />
            <MetricRow label="Longest Loss Streak" value={`${streaks.longestLossStreak} trades`} />
            <MetricRow label="Avg Win Streak" value={`${streaks.avgWinStreak} trades`} />
            <MetricRow label="Avg Loss Streak" value={`${streaks.avgLossStreak} trades`} />
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
        </section>
      </div>

      {/* Hourly Heatmap */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <Grid3X3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Hourly Performance</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">Average PnL by hour (UTC) -- find the best and worst trading windows</p>
        <div className="grid grid-cols-12 gap-1">
          {hourlyPerformance.map((h) => {
            const intensity = Math.min(1, Math.max(0, (h.avgPnl + 10) / 30));
            const bg = h.avgPnl >= 0
              ? `rgba(16, 185, 129, ${0.1 + intensity * 0.6})`
              : `rgba(239, 68, 68, ${0.1 + Math.abs(h.avgPnl) / 15 * 0.6})`;
            return (
              <div key={h.hour} className="rounded-lg p-2 text-center border border-[var(--border)]" style={{ backgroundColor: bg }}>
                <p className="text-[10px] font-mono text-[var(--text-muted)]">{h.hour.slice(0, 2)}</p>
                <p className={`text-xs font-bold ${h.avgPnl >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}>
                  {h.avgPnl >= 0 ? "+" : ""}{h.avgPnl}
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
      </section>

      {/* Trade Metrics Table */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Key Trade Metrics</h3>
        <div className="grid md:grid-cols-2 gap-x-8">
          <div>
            <MetricRow label="Average Win" value={`+${m.avgWin} bps`} />
            <MetricRow label="Average Loss" value={`${m.avgLoss} bps`} />
            <MetricRow label="Largest Win" value={`+${m.largestWin} bps`} />
            <MetricRow label="Largest Loss" value={`${m.largestLoss} bps`} />
          </div>
          <div>
            <MetricRow label="Profit Factor" value={m.profitFactor.toFixed(1)} />
            <MetricRow label="Payoff Ratio" value={m.payoffRatio.toFixed(2)} />
            <MetricRow label="Avg Slippage" value={`${m.avgSlippage} bps`} />
            <MetricRow label="Total Fees" value={`$${Math.abs(m.totalFees).toFixed(2)}`} />
          </div>
        </div>
      </section>
    </div>
  );
}
