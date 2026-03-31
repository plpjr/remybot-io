"use client";

import { useKronosData } from "@/lib/use-data";
import type { ChangelogEntry, Experiment, SweepRun, ModelInfo } from "@/lib/data";
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
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  CandlestickChart,
  Cpu,
  FlaskConical,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

/* ─── Navigation Items ─── */
const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "trading", label: "Trading", icon: CandlestickChart },
  { id: "model", label: "Model", icon: Cpu },
  { id: "research", label: "Research", icon: FlaskConical },
];

/* ─── Reusable Components ─── */
function StatusBadge({ status }: { status: string }) {
  const isRunning = status === "running";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        isRunning
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isRunning ? "bg-emerald-500 animate-pulse" : "bg-red-500"
        }`}
      />
      {isRunning ? "Live" : "Offline"}
    </span>
  );
}

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

function ChangelogCard({ entry }: { entry: ChangelogEntry }) {
  const [open, setOpen] = useState(false);
  const verdictColor =
    entry.verdict === "improvement"
      ? "text-emerald-600 bg-emerald-50"
      : entry.verdict === "regression"
      ? "text-red-600 bg-red-50"
      : "text-slate-600 bg-slate-50";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 text-left flex items-start justify-between hover:bg-slate-50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {entry.category}
            </span>
            <span className="text-xs text-slate-400">{entry.date}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${verdictColor}`}>
              {entry.verdict}
            </span>
          </div>
          <p className="font-semibold text-slate-900">{entry.title}</p>
          {entry.after_metric && (
            <div className="flex gap-4 mt-2">
              {Object.entries(entry.after_metric).map(([key, val]) => (
                <span key={key} className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{String(val)}</span>{" "}
                  {key.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-50">
          <p className="mt-3 text-sm text-slate-600">{entry.description}</p>
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex gap-1 mt-3">
              {entry.tags.map((tag) => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Section Components ─── */
function OverviewSection({
  overview,
  equityCurve,
  recentPerformance,
}: {
  overview: ReturnType<typeof useKronosData>["data"]["overview"];
  equityCurve: ReturnType<typeof useKronosData>["data"]["equityCurve"];
  recentPerformance: ReturnType<typeof useKronosData>["data"]["recentPerformance"];
}) {
  const s = overview;
  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Performance Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Return"
            value={s.totalTrades > 0 ? `${s.totalReturn > 0 ? "+" : ""}${s.totalReturn}%` : "—"}
            sub={s.totalTrades > 0 ? `${s.totalReturnMonth > 0 ? "+" : ""}${s.totalReturnMonth}% this month` : "No live trades yet"}
            icon={TrendingUp}
            trend={s.totalTrades > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Win Rate"
            value={s.winRate > 0 ? `${s.winRate}%` : "—"}
            sub={s.totalTrades > 0 ? `${s.totalTrades} total trades` : "Robustness: 82.1%"}
            icon={Target}
            trend={s.winRate > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Avg PnL/Trade"
            value={s.avgPnlBps > 0 ? `+${s.avgPnlBps} bps` : "—"}
            sub="10-seed robustness mean"
            icon={BarChart3}
            trend={s.avgPnlBps > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Sharpe Ratio"
            value={s.sharpeRatio > 0 ? s.sharpeRatio.toFixed(2) : "—"}
            icon={Shield}
            trend={s.sharpeRatio > 0 ? "up" : "neutral"}
          />
          <StatCard
            label="Max Drawdown"
            value={s.maxDrawdown !== 0 ? `${s.maxDrawdown}%` : "—"}
            icon={Activity}
            trend="neutral"
          />
        </div>
      </section>

      {/* Equity Curve */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Equity Curve
            </h2>
            <p className="text-sm text-slate-500">
              Portfolio value over time (USD)
            </p>
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
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
              formatter={(value: unknown) => [
                `$${Number(value).toLocaleString()}`,
                "Equity",
              ]}
            />
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#2563eb" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Recent Performance */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Recent Performance
        </h2>
        <p className="text-sm text-slate-500 mb-6">Rolling returns</p>
        <div className="space-y-4">
          {recentPerformance.map((r) => (
            <div
              key={r.period}
              className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
            >
              <div>
                <p className="font-medium text-slate-900">{r.period}</p>
                <p className="text-xs text-slate-400">
                  {r.trades} trades · {r.winRate}% WR
                </p>
              </div>
              <span
                className={`text-lg font-bold ${
                  r.pnl >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {r.pnl >= 0 ? "+" : ""}
                {r.pnl}%
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Bot Status</span>
          </div>
          <p className="text-2xl font-bold text-blue-800">
            {s.status === "running" ? s.uptime : "Offline"}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Model: {s.modelVersion}
          </p>
        </div>
      </section>
    </div>
  );
}

function TradingSection({
  monthlyReturns,
  longShortBreakdown,
  overview,
}: {
  monthlyReturns: ReturnType<typeof useKronosData>["data"]["monthlyReturns"];
  longShortBreakdown: ReturnType<typeof useKronosData>["data"]["longShortBreakdown"];
  overview: ReturnType<typeof useKronosData>["data"]["overview"];
}) {
  return (
    <div className="space-y-8">
      {/* Monthly Returns */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Monthly Returns
        </h2>
        <p className="text-sm text-slate-500 mb-6">2026 performance</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyReturns}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
              formatter={(value: unknown) => [`${value}%`, "Return"]}
            />
            <Bar
              dataKey="return"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Long vs Short */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Long vs Short
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Performance by direction
        </p>
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-emerald-700">Long Trades</span>
              <span className="text-slate-500">
                {longShortBreakdown.longTrades} trades
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all"
                style={{ width: `${longShortBreakdown.longWinRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Win Rate: {longShortBreakdown.longWinRate}%</span>
              <span>Avg: +{longShortBreakdown.longAvgPnl} bps</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-blue-700">Short Trades</span>
              <span className="text-slate-500">
                {longShortBreakdown.shortTrades} trades
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${longShortBreakdown.shortWinRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Win Rate: {longShortBreakdown.shortWinRate}%</span>
              <span>Avg: +{longShortBreakdown.shortAvgPnl} bps</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Long/Short Ratio</span>
              <span className="font-semibold text-slate-900">
                {longShortBreakdown.shortTrades > 0
                  ? (longShortBreakdown.longTrades / longShortBreakdown.shortTrades).toFixed(2)
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-500">Profit Factor</span>
              <span className="font-semibold text-slate-900">
                {overview.profitFactor || "—"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trade Distribution placeholder */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Trade Distribution
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          PnL distribution across all trades
        </p>
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          Coming soon — histogram of trade PnL
        </div>
      </section>
    </div>
  );
}

function ModelSection({
  skillRadar,
  changelog,
  activeModel,
}: {
  skillRadar: ReturnType<typeof useKronosData>["data"]["skillRadar"];
  changelog: ChangelogEntry[];
  activeModel: ModelInfo | null;
}) {
  const modelConfig = activeModel
    ? [
        { label: "Algorithm", value: activeModel.algorithm },
        { label: "Architecture", value: activeModel.architecture },
        { label: "Embeddings", value: activeModel.embedding_model },
        { label: "Timeframes", value: activeModel.timeframes?.join(" + ") || "—" },
        { label: "Features", value: String(activeModel.feature_count || "—") },
        { label: "Training Data", value: activeModel.training_data_range || "—" },
        { label: "Data Rows", value: activeModel.training_data_rows?.toLocaleString() || "—" },
        { label: "Deployed", value: activeModel.deployed_at?.slice(0, 10) || "—" },
      ]
    : [
        { label: "Algorithm", value: "PPO" },
        { label: "Architecture", value: "MLP [256, 256]" },
        { label: "Embeddings", value: "Kronos-small 512d" },
        { label: "Timeframes", value: "5m + 1h + Daily" },
        { label: "TA Features", value: "27" },
        { label: "Training Epochs", value: "150" },
        { label: "Walk-Forward Folds", value: "3" },
        { label: "Robustness Seeds", value: "10" },
      ];

  return (
    <div className="space-y-8">
      {/* Model Strengths Radar */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Model Strengths
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Current vs previous training cycle
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={skillRadar}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#94a3b8" }}
            />
            <Radar
              name="Current"
              dataKey="current"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Radar
              name="Previous"
              dataKey="previous"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.05}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-0.5 bg-blue-600 rounded" /> Current
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-0.5 bg-slate-400 rounded border-dashed" />{" "}
            Previous
          </span>
        </div>
      </section>

      {/* Experiment Changelog */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Experiment Changelog
          </h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          What changed, why, and what happened
        </p>
        <div className="space-y-3">
          {changelog.length > 0 ? (
            changelog.map((entry) => (
              <ChangelogCard key={entry.id} entry={entry} />
            ))
          ) : (
            <div className="text-sm text-slate-400 p-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
              No changelog entries yet
            </div>
          )}
        </div>
      </section>

      {/* Model Config */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Model Configuration
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {modelConfig.map((item) => (
            <div
              key={item.label}
              className="flex justify-between py-2 border-b border-slate-50"
            >
              <span className="text-sm text-slate-500">{item.label}</span>
              <span className="text-sm font-medium text-slate-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ResearchSection({
  activeSweep,
  experiments,
  activeModel,
}: {
  activeSweep: SweepRun | null;
  experiments: Experiment[];
  activeModel: ModelInfo | null;
}) {
  return (
    <div className="space-y-8">
      {/* Active Experiment */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Active Experiment
          </h2>
          {activeSweep ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Running
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
              No active sweep
            </span>
          )}
        </div>
        {activeSweep ? (
          <>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">Experiment</span>
                <span className="text-sm font-medium text-slate-900">
                  {activeSweep.description?.slice(0, 60) || activeSweep.sweep_name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">Progress</span>
                <span className="text-sm font-medium text-slate-900">
                  {activeSweep.completed_experiments} / {activeSweep.total_experiments} configs
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">Current Leader</span>
                <span className="text-sm font-bold text-emerald-600">
                  +{activeSweep.leader_bps} bps ({activeSweep.leader_experiment})
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">Champion to Beat</span>
                <span className="text-sm font-medium text-slate-900">
                  +{activeSweep.champion_bps} bps
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-500">Hardware</span>
                <span className="text-sm font-medium text-slate-900">
                  RTX 2060 6GB · Windows 11
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Overall Progress</span>
                <span>{Math.round((activeSweep.completed_experiments / activeSweep.total_experiments) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${(activeSweep.completed_experiments / activeSweep.total_experiments) * 100}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">No sweep currently running.</p>
        )}
      </section>

      {/* Completed Experiments */}
      {experiments.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Experiment Results
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">#</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Config</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">Mean bps</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">Std</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">vs Champion</th>
                  <th className="text-right py-3 px-2 text-slate-500 font-medium">Seeds</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp, i) => (
                  <tr
                    key={exp.experiment_name}
                    className={`border-b border-slate-50 ${i === 0 ? "bg-emerald-50/50" : ""}`}
                  >
                    <td className="py-3 px-2 text-slate-400">{exp.rank}</td>
                    <td className="py-3 px-2 font-medium text-slate-900">
                      {exp.experiment_name}
                      {i === 0 && " 🏆"}
                    </td>
                    <td className={`py-3 px-2 text-right font-bold ${
                      exp.vs_champion_bps > 0 ? "text-emerald-600" : "text-red-500"
                    }`}>
                      +{exp.mean_bps.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-500">
                      {exp.std_bps.toFixed(2)}
                    </td>
                    <td className={`py-3 px-2 text-right font-medium ${
                      exp.vs_champion_bps > 0 ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {exp.vs_champion_bps > 0 ? "+" : ""}{exp.vs_champion_bps.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-500">{exp.total_seeds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Robustness Test Results */}
      {activeModel && activeModel.robustness_mean_bps && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Robustness Test ({activeModel.robustness_seeds}-seed)
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Champion — {activeModel.version}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">+{activeModel.robustness_mean_bps}</p>
              <p className="text-xs text-slate-500 mt-1">Mean bps</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{activeModel.robustness_std_bps}</p>
              <p className="text-xs text-slate-500 mt-1">Std bps</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">100%</p>
              <p className="text-xs text-slate-500 mt-1">Profitable</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">82.1%</p>
              <p className="text-xs text-slate-500 mt-1">Mean WR</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {activeModel.notes}
          </div>
        </section>
      )}

      {/* Experiment Roadmap */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Experiment Roadmap
        </h2>
        <div className="space-y-4">
          {[
            { name: "6A: PPO Baseline", status: "done", result: "+20.27 bps" },
            { name: "6B: DSAC", status: "done", result: "Failed" },
            { name: "6C: Hyperparameter Sweep", status: "done", result: "+23.63 bps (epochs_150)" },
            {
              name: "6C: Reward Shaping Sweep",
              status: activeSweep?.status === "running" ? "running" : "done",
              result: activeSweep
                ? `${activeSweep.completed_experiments}/${activeSweep.total_experiments} configs`
                : "Complete",
            },
            { name: "Robustness Test (winner)", status: "pending", result: "After sweep" },
            { name: "Phase 7: TorchTrade Migration", status: "pending", result: "Next phase" },
          ].map((exp) => (
            <div key={exp.name} className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  exp.status === "done"
                    ? "bg-emerald-500"
                    : exp.status === "running"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-slate-300"
                }`}
              />
              <div className="flex-1 flex items-center justify-between">
                <span
                  className={`text-sm ${
                    exp.status === "pending"
                      ? "text-slate-400"
                      : "text-slate-900 font-medium"
                  }`}
                >
                  {exp.name}
                </span>
                <span
                  className={`text-xs ${
                    exp.status === "done" && !exp.result.includes("Failed")
                      ? "text-emerald-600 font-medium"
                      : exp.status === "done"
                      ? "text-red-500"
                      : exp.status === "running"
                      ? "text-amber-600"
                      : "text-slate-400"
                  }`}
                >
                  {exp.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const { data, loading } = useKronosData();
  const s = data.overview;
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Kronos</h1>
              <p className="text-xs text-slate-500">
                AI-Powered BTC Trading Bot
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={s.status} />
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Model {s.modelVersion}</p>
              <p className="text-xs text-slate-400">
                Trained {s.lastTrained}
              </p>
            </div>
            {loading && (
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" title="Loading..." />
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto flex">
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={`fixed lg:sticky top-[73px] left-0 z-20 h-[calc(100vh-73px)] w-64 bg-white border-r border-slate-100 p-4 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? "text-blue-600" : "text-slate-400"
                    }`}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer stats */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl">
            <p className="text-xs font-medium text-slate-500 mb-2">
              Quick Stats
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Model</span>
                <span className="text-slate-700 font-medium">
                  {s.modelVersion}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Robustness</span>
                <span className="text-emerald-600 font-medium">
                  +{s.avgPnlBps} bps
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Win Rate</span>
                <span className="text-emerald-600 font-medium">
                  {s.winRate}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <span className={`font-medium ${s.status === "running" ? "text-emerald-600" : "text-slate-500"}`}>
                  {s.status === "running" ? "Live" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-10 lg:hidden" />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-8">
          {activeSection === "overview" && (
            <OverviewSection
              overview={data.overview}
              equityCurve={data.equityCurve}
              recentPerformance={data.recentPerformance}
            />
          )}
          {activeSection === "trading" && (
            <TradingSection
              monthlyReturns={data.monthlyReturns}
              longShortBreakdown={data.longShortBreakdown}
              overview={data.overview}
            />
          )}
          {activeSection === "model" && (
            <ModelSection
              skillRadar={data.skillRadar}
              changelog={data.changelog}
              activeModel={data.activeModel}
            />
          )}
          {activeSection === "research" && (
            <ResearchSection
              activeSweep={data.activeSweep}
              experiments={data.experiments}
              activeModel={data.activeModel}
            />
          )}

          {/* Footer */}
          <footer className="text-center py-8 mt-8 border-t border-slate-100">
            <p className="text-sm text-slate-400">
              Kronos Trading Bot · Powered by Reinforcement Learning
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Performance shown is from live/paper trading. Past performance does
              not guarantee future results.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
