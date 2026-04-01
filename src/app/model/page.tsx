"use client";

import { Brain, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MockDataBanner from "@/components/MockDataBanner";
import { HealthBadge, HealthDot } from "@/components/HealthIndicator";
import { useChartTheme, tooltipStyle } from "@/lib/useChartTheme";
import { trainingRewardCurve, isVsOos, actionDistribution, confidenceDistribution, featureImportance, retrainingHistory } from "@/lib/mock-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export default function ModelPage() {
  const ct = useChartTheme();
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Model" description="Training performance and model diagnostics" icon={Brain} />
      <MockDataBanner />

      {/* Training Reward Curve */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Training Reward Curve</h3>
        <p className="text-sm text-[var(--text-muted)] mb-6">Episode reward over 150 training epochs (latest model)</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trainingRewardCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: ct.tick }} label={{ value: "Epoch", position: "bottom", fontSize: 10, fill: ct.tick }} />
            <YAxis tick={{ fontSize: 11, fill: ct.tick }} />
            <Tooltip contentStyle={tooltipStyle(ct)} />
            <Line type="monotone" dataKey="reward" stroke={ct.line} strokeWidth={2} dot={false} name="Current" />
            <Line type="monotone" dataKey="baseline" stroke={ct.lineMuted} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Baseline" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]"><span className="w-3 h-0.5 bg-blue-600 dark:bg-blue-400 rounded" /> Current model</span>
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]"><span className="w-3 h-0.5 bg-slate-400 rounded" /> Baseline</span>
        </div>
      </section>

      {/* IS vs OOS */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">In-Sample vs Out-of-Sample</h3>
            <p className="text-sm text-[var(--text-muted)]">Checking for overfitting -- smaller gap is better</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 text-[var(--text-muted)] font-medium">Metric</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">In-Sample</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">Out-of-Sample</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">Gap</th>
                <th className="text-center py-3 text-[var(--text-muted)] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isVsOos.map((row) => {
                const gap = Math.abs(row.inSample - row.outOfSample);
                const pctGap = row.inSample !== 0 ? (gap / Math.abs(row.inSample)) * 100 : 0;
                const status = pctGap < 15 ? "healthy" as const : pctGap < 30 ? "caution" as const : "critical" as const;
                return (
                  <tr key={row.metric} className="border-b border-[var(--border)]">
                    <td className="py-3 font-medium text-[var(--text)]">{row.metric}</td>
                    <td className="py-3 text-right text-[var(--text-muted)]">{row.inSample}</td>
                    <td className="py-3 text-right text-[var(--text-muted)]">{row.outOfSample}</td>
                    <td className={`py-3 text-right font-semibold ${status === "healthy" ? "text-emerald-600" : status === "caution" ? "text-amber-600" : "text-red-600"}`}>
                      {pctGap.toFixed(0)}%
                    </td>
                    <td className="py-3 text-center"><HealthDot status={status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-100 dark:border-amber-900">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-400"><span className="font-semibold">Max DD gap is 81%</span> -- the model may be underestimating tail risk out-of-sample. Consider wider stoploss or drawdown-aware training.</p>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Action Distribution */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Action Distribution</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">How often the model goes long, short, or stays neutral</p>
          <div className="space-y-4">
            {actionDistribution.map((a) => {
              const colors: Record<string, string> = { Long: "bg-emerald-500", Short: "bg-blue-500", Neutral: "bg-slate-300 dark:bg-slate-600" };
              return (
                <div key={a.action}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-[var(--text)]">{a.action}</span>
                    <span className="text-[var(--text-muted)]">{a.percentage}% · {a.trades} trades</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3">
                    <div className={`${colors[a.action]} h-3 rounded-full`} style={{ width: `${a.percentage}%` }} />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Avg PnL: {a.avgPnl > 0 ? "+" : ""}{a.avgPnl} bps</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Confidence Distribution */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Confidence Distribution</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">Model prediction confidence vs actual PnL</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={confidenceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: ct.tick }} />
              <YAxis tick={{ fontSize: 11, fill: ct.tick }} />
              <Tooltip contentStyle={tooltipStyle(ct)} />
              <Bar dataKey="count" name="Trades" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {confidenceDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.avgPnl > 15 ? "#2563eb" : entry.avgPnl > 0 ? "#93c5fd" : "#fca5a5"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-[var(--text-muted)] mt-2">Higher confidence → higher PnL -- the model is well-calibrated</p>
        </section>
      </div>

      {/* Feature Importance */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Feature Importance</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">Which inputs the model relies on most (top 10)</p>
        <div className="space-y-3">
          {featureImportance.map((f) => (
            <div key={f.feature} className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-muted)] w-44 flex-shrink-0 truncate">{f.feature}</span>
              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-4 relative">
                <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${f.importance * 100 / 0.23 * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)] w-12 text-right">{(f.importance * 100).toFixed(1)}%</span>
              <span className={`text-xs font-semibold w-10 text-right ${f.delta > 0 ? "text-emerald-600 dark:text-emerald-400" : f.delta < 0 ? "text-red-500 dark:text-red-400" : "text-[var(--text-muted)]"}`}>
                {f.delta > 0 ? "+" : ""}{f.delta > 0 || f.delta < 0 ? (f.delta * 100).toFixed(0) + "%" : "---"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Retraining History */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Weekly Retraining History</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">Performance delta after each Friday retraining cycle</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 text-[var(--text-muted)] font-medium">Week</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">WR Before</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">WR After</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">PnL Before</th>
                <th className="text-right py-3 text-[var(--text-muted)] font-medium">PnL After</th>
                <th className="text-center py-3 text-[var(--text-muted)] font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {retrainingHistory.map((r) => (
                <tr key={r.week} className="border-b border-[var(--border)]">
                  <td className="py-3 font-medium text-[var(--text)]">{r.week}</td>
                  <td className="py-3 text-right text-[var(--text-muted)]">{r.winRateBefore}%</td>
                  <td className="py-3 text-right text-[var(--text-muted)]">{r.winRateAfter}%</td>
                  <td className="py-3 text-right text-[var(--text-muted)]">{r.pnlBefore} bps</td>
                  <td className="py-3 text-right text-[var(--text-muted)]">{r.pnlAfter} bps</td>
                  <td className="py-3 text-center">
                    <HealthBadge status={r.status === "improved" ? "healthy" : "caution"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
