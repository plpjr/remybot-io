"use client";

import { Brain, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { HealthBadge, HealthDot } from "@/components/HealthIndicator";
import { trainingRewardCurve, isVsOos, actionDistribution, confidenceDistribution, featureImportance, retrainingHistory } from "@/lib/mock-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

export default function ModelPage() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Model" description="Training performance and model diagnostics" icon={Brain} />

      {/* Training Reward Curve */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Training Reward Curve</h3>
        <p className="text-sm text-slate-500 mb-6">Episode reward over 150 training epochs (latest model)</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trainingRewardCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: "#94a3b8" }} label={{ value: "Epoch", position: "bottom", fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
            <Line type="monotone" dataKey="reward" stroke="#2563eb" strokeWidth={2} dot={false} name="Current" />
            <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Baseline" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-blue-600 rounded" /> Current model</span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-slate-400 rounded" /> Baseline</span>
        </div>
      </section>

      {/* IS vs OOS */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">In-Sample vs Out-of-Sample</h3>
            <p className="text-sm text-slate-500">Checking for overfitting — smaller gap is better</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 text-slate-500 font-medium">Metric</th>
                <th className="text-right py-3 text-slate-500 font-medium">In-Sample</th>
                <th className="text-right py-3 text-slate-500 font-medium">Out-of-Sample</th>
                <th className="text-right py-3 text-slate-500 font-medium">Gap</th>
                <th className="text-center py-3 text-slate-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isVsOos.map((row) => {
                const gap = Math.abs(row.inSample - row.outOfSample);
                const pctGap = row.inSample !== 0 ? (gap / Math.abs(row.inSample)) * 100 : 0;
                const status = pctGap < 15 ? "healthy" as const : pctGap < 30 ? "caution" as const : "critical" as const;
                return (
                  <tr key={row.metric} className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-900">{row.metric}</td>
                    <td className="py-3 text-right text-slate-700">{row.inSample}</td>
                    <td className="py-3 text-right text-slate-700">{row.outOfSample}</td>
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
        <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-xs text-amber-700"><span className="font-semibold">Max DD gap is 81%</span> — the model may be underestimating tail risk out-of-sample. Consider wider stoploss or drawdown-aware training.</p>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Action Distribution */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Action Distribution</h3>
          <p className="text-sm text-slate-500 mb-4">How often the model goes long, short, or stays neutral</p>
          <div className="space-y-4">
            {actionDistribution.map((a) => {
              const colors: Record<string, string> = { Long: "bg-emerald-500", Short: "bg-blue-500", Neutral: "bg-slate-300" };
              return (
                <div key={a.action}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-900">{a.action}</span>
                    <span className="text-slate-500">{a.percentage}% · {a.trades} trades</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className={`${colors[a.action]} h-3 rounded-full`} style={{ width: `${a.percentage}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Avg PnL: {a.avgPnl > 0 ? "+" : ""}{a.avgPnl} bps</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Confidence Distribution */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Confidence Distribution</h3>
          <p className="text-sm text-slate-500 mb-4">Model prediction confidence vs actual PnL</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={confidenceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
              <Bar dataKey="count" name="Trades" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {confidenceDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.avgPnl > 15 ? "#2563eb" : entry.avgPnl > 0 ? "#93c5fd" : "#fca5a5"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-2">Higher confidence → higher PnL — the model is well-calibrated ✓</p>
        </section>
      </div>

      {/* Feature Importance */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Feature Importance</h3>
        <p className="text-sm text-slate-500 mb-4">Which inputs the model relies on most (top 10)</p>
        <div className="space-y-3">
          {featureImportance.map((f) => (
            <div key={f.feature} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 w-44 flex-shrink-0 truncate">{f.feature}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-4 relative">
                <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${f.importance * 100 / 0.23 * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-slate-500 w-12 text-right">{(f.importance * 100).toFixed(1)}%</span>
              <span className={`text-xs font-semibold w-10 text-right ${f.delta > 0 ? "text-emerald-600" : f.delta < 0 ? "text-red-500" : "text-slate-400"}`}>
                {f.delta > 0 ? "+" : ""}{f.delta > 0 || f.delta < 0 ? (f.delta * 100).toFixed(0) + "%" : "—"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Retraining History */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Weekly Retraining History</h3>
        <p className="text-sm text-slate-500 mb-4">Performance delta after each Friday retraining cycle</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 text-slate-500 font-medium">Week</th>
                <th className="text-right py-3 text-slate-500 font-medium">WR Before</th>
                <th className="text-right py-3 text-slate-500 font-medium">WR After</th>
                <th className="text-right py-3 text-slate-500 font-medium">PnL Before</th>
                <th className="text-right py-3 text-slate-500 font-medium">PnL After</th>
                <th className="text-center py-3 text-slate-500 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {retrainingHistory.map((r) => (
                <tr key={r.week} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-900">{r.week}</td>
                  <td className="py-3 text-right text-slate-600">{r.winRateBefore}%</td>
                  <td className="py-3 text-right text-slate-600">{r.winRateAfter}%</td>
                  <td className="py-3 text-right text-slate-600">{r.pnlBefore} bps</td>
                  <td className="py-3 text-right text-slate-600">{r.pnlAfter} bps</td>
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
