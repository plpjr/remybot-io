"use client";

import {
  overviewStats,
  equityCurve,
  monthlyReturns,
  longShortBreakdown,
  weeklyImprovements,
  skillRadar,
  recentPerformance,
} from "@/lib/mock-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Target,
  Shield,
  Zap,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-blue-50 rounded-xl">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        {trend && trend !== "neutral" && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trend === "up" ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ImprovementCard({
  improvement,
}: {
  improvement: (typeof weeklyImprovements)[0];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 text-left flex items-start justify-between hover:bg-slate-50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Week {improvement.week}
            </span>
            <span className="text-xs text-slate-400">{improvement.date}</span>
          </div>
          <p className="font-semibold text-slate-900">{improvement.summary}</p>
          <div className="flex gap-4 mt-2">
            {Object.entries(improvement.metrics).map(([key, val]) => (
              <span key={key} className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{val}</span>{" "}
                {key === "winRate"
                  ? "win rate"
                  : key === "avgPnl"
                  ? "avg PnL"
                  : key}
              </span>
            ))}
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-50">
          <ul className="mt-3 space-y-2">
            {improvement.details.map((d, i) => (
              <li
                key={i}
                className="text-sm text-slate-600 flex items-start gap-2"
              >
                <span className="text-blue-400 mt-1">•</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const s = overviewStats;
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="pl-12 lg:pl-0">
          <h2 className="text-2xl font-bold text-slate-900">Performance Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time trading metrics and analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Model {s.modelVersion}</p>
            <p className="text-xs text-slate-400">Trained {s.lastTrained}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Return"
          value={`${s.totalReturn > 0 ? "+" : ""}${s.totalReturn}%`}
          sub={`${s.totalReturnMonth > 0 ? "+" : ""}${s.totalReturnMonth}% this month`}
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          label="Win Rate"
          value={`${s.winRate}%`}
          sub={`${s.totalTrades} total trades`}
          icon={Target}
          trend="up"
        />
        <StatCard
          label="Avg PnL/Trade"
          value={`+${s.avgPnlBps} bps`}
          icon={BarChart3}
          trend="up"
        />
        <StatCard
          label="Sharpe Ratio"
          value={s.sharpeRatio.toFixed(2)}
          icon={Shield}
          trend="up"
        />
        <StatCard
          label="Max Drawdown"
          value={`${s.maxDrawdown}%`}
          icon={Activity}
          trend="neutral"
        />
      </div>

      {/* Equity Curve */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Equity Curve</h3>
            <p className="text-sm text-slate-500">Portfolio value over time (USD)</p>
          </div>
          <div className="flex gap-2">
            {["1W", "1M", "3M", "ALL"].map((period) => (
              <button
                key={period}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={equityCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
              formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, "Equity"]}
            />
            <Line type="monotone" dataKey="equity" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#2563eb" }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Two Column: Monthly Returns + Long/Short */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Monthly Returns</h3>
          <p className="text-sm text-slate-500 mb-6">2026 performance</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} formatter={(value: unknown) => [`${value}%`, "Return"]} />
              <Bar dataKey="return" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Long vs Short</h3>
          <p className="text-sm text-slate-500 mb-6">Performance by direction</p>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-emerald-700">Long Trades</span>
                <span className="text-slate-500">{longShortBreakdown.longTrades} trades</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${longShortBreakdown.longWinRate}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Win Rate: {longShortBreakdown.longWinRate}%</span>
                <span>Avg: +{longShortBreakdown.longAvgPnl} bps</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-blue-700">Short Trades</span>
                <span className="text-slate-500">{longShortBreakdown.shortTrades} trades</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${longShortBreakdown.shortWinRate}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Win Rate: {longShortBreakdown.shortWinRate}%</span>
                <span>Avg: +{longShortBreakdown.shortAvgPnl} bps</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Long/Short Ratio</span>
                <span className="font-semibold text-slate-900">{(longShortBreakdown.longTrades / longShortBreakdown.shortTrades).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-500">Profit Factor</span>
                <span className="font-semibold text-slate-900">{overviewStats.profitFactor}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Two Column: Skill Radar + Recent Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Model Strengths</h3>
          <p className="text-sm text-slate-500 mb-4">Current vs previous training cycle</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={skillRadar}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#64748b" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <Radar name="Current" dataKey="current" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Previous" dataKey="previous" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.05} strokeWidth={1.5} strokeDasharray="4 4" />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-0.5 bg-blue-600 rounded" /> Current
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-0.5 bg-slate-400 rounded" /> Previous
            </span>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Recent Performance</h3>
          <p className="text-sm text-slate-500 mb-6">Rolling returns</p>
          <div className="space-y-4">
            {recentPerformance.map((r) => (
              <div key={r.period} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{r.period}</p>
                  <p className="text-xs text-slate-400">{r.trades} trades · {r.winRate}% WR</p>
                </div>
                <span className={`text-lg font-bold ${r.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {r.pnl >= 0 ? "+" : ""}{r.pnl}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Uptime</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{s.uptime}</p>
            <p className="text-xs text-blue-600 mt-1">~{s.avgTradesPerDay} trades/day average</p>
          </div>
        </section>
      </div>

      {/* Weekly Improvements */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Weekly Improvements</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">What Kronos learned each Friday training cycle</p>
        <div className="space-y-3">
          {weeklyImprovements.map((imp) => (
            <ImprovementCard key={imp.week} improvement={imp} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-slate-100">
        <p className="text-sm text-slate-400">Kronos Trading Bot · Powered by Reinforcement Learning</p>
        <p className="text-xs text-slate-300 mt-1">Performance shown is from live/paper trading. Past performance does not guarantee future results.</p>
      </footer>
    </div>
  );
}
