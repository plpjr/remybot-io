"use client";

import { BarChart3 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { HealthDot } from "@/components/HealthIndicator";
import { volatilityRegimes, trendVsRange, btcCorrelation, volumeRegimes } from "@/lib/mock-data";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

function RegimeTable({ title, description, data }: { title: string; description: string; data: { regime: string; winRate: number; avgPnl: number; trades: number; sharpe?: number }[] }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-4">{description}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 text-slate-500 font-medium">Regime</th>
              <th className="text-right py-3 text-slate-500 font-medium">Win Rate</th>
              <th className="text-right py-3 text-slate-500 font-medium">Avg PnL</th>
              <th className="text-right py-3 text-slate-500 font-medium">Trades</th>
              <th className="text-center py-3 text-slate-500 font-medium">Health</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const status = row.avgPnl > 15 ? "healthy" as const : row.avgPnl > 5 ? "caution" as const : "critical" as const;
              return (
                <tr key={row.regime} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-900">{row.regime}</td>
                  <td className="py-3 text-right text-slate-700">{row.winRate}%</td>
                  <td className={`py-3 text-right font-semibold ${row.avgPnl > 15 ? "text-emerald-600" : row.avgPnl > 5 ? "text-amber-600" : "text-red-600"}`}>
                    +{row.avgPnl} bps
                  </td>
                  <td className="py-3 text-right text-slate-500">{row.trades}</td>
                  <td className="py-3 text-center"><HealthDot status={status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Visual bar comparison */}
      <div className="mt-4 space-y-2">
        {data.map((row) => (
          <div key={row.regime} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-24 flex-shrink-0">{row.regime}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${row.avgPnl > 15 ? "bg-blue-500" : row.avgPnl > 5 ? "bg-amber-400" : "bg-red-400"}`}
                style={{ width: `${Math.min(100, (row.avgPnl / 30) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-500 w-14 text-right">+{row.avgPnl}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AnalysisPage() {
  // Calculate correlation
  const n = btcCorrelation.length;
  const meanX = btcCorrelation.reduce((s, p) => s + p.btcReturn, 0) / n;
  const meanY = btcCorrelation.reduce((s, p) => s + p.botReturn, 0) / n;
  const cov = btcCorrelation.reduce((s, p) => s + (p.btcReturn - meanX) * (p.botReturn - meanY), 0) / n;
  const stdX = Math.sqrt(btcCorrelation.reduce((s, p) => s + (p.btcReturn - meanX) ** 2, 0) / n);
  const stdY = Math.sqrt(btcCorrelation.reduce((s, p) => s + (p.botReturn - meanY) ** 2, 0) / n);
  const corr = cov / (stdX * stdY);

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Analysis" description="Market regime analysis and conditional performance" icon={BarChart3} />

      <div className="grid md:grid-cols-2 gap-6">
        <RegimeTable
          title="Performance by Volatility"
          description="How the bot performs in different volatility environments"
          data={volatilityRegimes}
        />
        <RegimeTable
          title="Trend vs Range"
          description="Performance when BTC is trending vs consolidating"
          data={trendVsRange}
        />
      </div>

      {/* BTC Correlation Scatter */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-slate-900">BTC Correlation</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${Math.abs(corr) < 0.3 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : Math.abs(corr) < 0.6 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            r = {corr.toFixed(2)} {Math.abs(corr) < 0.3 ? "Low — Good alpha ✓" : Math.abs(corr) < 0.6 ? "Moderate" : "High — Correlated"}
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6">Bot returns vs BTC price movement — lower correlation = more independent alpha</p>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" dataKey="btcReturn" name="BTC Return" tick={{ fontSize: 11, fill: "#94a3b8" }} label={{ value: "BTC Return %", position: "bottom", fontSize: 10, fill: "#94a3b8" }} />
            <YAxis type="number" dataKey="botReturn" name="Bot Return" tick={{ fontSize: 11, fill: "#94a3b8" }} label={{ value: "Bot Return %", angle: -90, position: "insideLeft", fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} formatter={(v: unknown) => [`${v}%`]} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={btcCorrelation} fill="#3b82f6" fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </section>

      {/* Volume Regimes */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Volume Regime Performance</h3>
        <p className="text-sm text-slate-500 mb-4">How trade volume conditions affect bot profitability</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={volumeRegimes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="regime" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v} bps`} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} formatter={(v: unknown) => [`+${v} bps`, "Avg PnL"]} />
            <Bar dataKey="avgPnl" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {volumeRegimes.map((entry, i) => (
                <Cell key={i} fill={entry.avgPnl > 15 ? "#3b82f6" : entry.avgPnl > 5 ? "#fbbf24" : "#f87171"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
          <p className="text-xs text-red-700"><span className="font-semibold">⚠️ Low volume weakness:</span> Only +8.4 bps avg PnL during low-volume periods (72.1% WR). Consider reducing position size or filtering entries during low-volume hours.</p>
        </div>
      </section>
    </div>
  );
}
