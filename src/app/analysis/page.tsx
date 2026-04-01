"use client";

import { BarChart3 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MockDataBanner from "@/components/MockDataBanner";
import { HealthDot } from "@/components/HealthIndicator";
import { useChartTheme, tooltipStyle } from "@/lib/useChartTheme";
import { volatilityRegimes, trendVsRange, btcCorrelation, volumeRegimes } from "@/lib/mock-data";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

function RegimeTable({ title, description, data, ct }: { title: string; description: string; ct: ReturnType<typeof useChartTheme>; data: { regime: string; winRate: number; avgPnl: number; trades: number; sharpe?: number }[] }) {
  return (
    <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
      <h3 className="text-lg font-semibold text-[var(--text)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-muted)] mb-4">{description}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-3 text-[var(--text-muted)] font-medium">Regime</th>
              <th className="text-right py-3 text-[var(--text-muted)] font-medium">Win Rate</th>
              <th className="text-right py-3 text-[var(--text-muted)] font-medium">Avg PnL</th>
              <th className="text-right py-3 text-[var(--text-muted)] font-medium">Trades</th>
              <th className="text-center py-3 text-[var(--text-muted)] font-medium">Health</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const status = row.avgPnl > 15 ? "healthy" as const : row.avgPnl > 5 ? "caution" as const : "critical" as const;
              return (
                <tr key={row.regime} className="border-b border-[var(--border)]">
                  <td className="py-3 font-medium text-[var(--text)]">{row.regime}</td>
                  <td className="py-3 text-right text-[var(--text-muted)]">{row.winRate}%</td>
                  <td className={`py-3 text-right font-semibold ${row.avgPnl > 15 ? "text-emerald-600 dark:text-emerald-400" : row.avgPnl > 5 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                    +{row.avgPnl} bps
                  </td>
                  <td className="py-3 text-right text-[var(--text-muted)]">{row.trades}</td>
                  <td className="py-3 text-center"><HealthDot status={status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((row) => (
          <div key={row.regime} className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)] w-24 flex-shrink-0">{row.regime}</span>
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${row.avgPnl > 15 ? "bg-blue-500" : row.avgPnl > 5 ? "bg-amber-400" : "bg-red-400"}`}
                style={{ width: `${Math.min(100, (row.avgPnl / 30) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)] w-14 text-right">+{row.avgPnl}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AnalysisPage() {
  const ct = useChartTheme();

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
      <MockDataBanner />

      <div className="grid md:grid-cols-2 gap-6">
        <RegimeTable title="Performance by Volatility" description="How the bot performs in different volatility environments" data={volatilityRegimes} ct={ct} />
        <RegimeTable title="Trend vs Range" description="Performance when BTC is trending vs consolidating" data={trendVsRange} ct={ct} />
      </div>

      {/* BTC Correlation Scatter */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-[var(--text)]">BTC Correlation</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${Math.abs(corr) < 0.3 ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" : Math.abs(corr) < 0.6 ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800" : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"}`}>
            r = {corr.toFixed(2)} {Math.abs(corr) < 0.3 ? "Low -- Good alpha" : Math.abs(corr) < 0.6 ? "Moderate" : "High -- Correlated"}
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">Bot returns vs BTC price movement -- lower correlation = more independent alpha</p>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis type="number" dataKey="btcReturn" name="BTC Return" tick={{ fontSize: 11, fill: ct.tick }} label={{ value: "BTC Return %", position: "bottom", fontSize: 10, fill: ct.tick }} />
            <YAxis type="number" dataKey="botReturn" name="Bot Return" tick={{ fontSize: 11, fill: ct.tick }} label={{ value: "Bot Return %", angle: -90, position: "insideLeft", fontSize: 10, fill: ct.tick }} />
            <Tooltip contentStyle={tooltipStyle(ct)} formatter={(v: unknown) => [`${v}%`]} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={btcCorrelation} fill="#3b82f6" fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </section>

      {/* Volume Regimes */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Volume Regime Performance</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">How trade volume conditions affect bot profitability</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={volumeRegimes}>
            <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
            <XAxis dataKey="regime" tick={{ fontSize: 11, fill: ct.tick }} />
            <YAxis tick={{ fontSize: 11, fill: ct.tick }} tickFormatter={(v) => `${v} bps`} />
            <Tooltip contentStyle={tooltipStyle(ct)} formatter={(v: unknown) => [`+${v} bps`, "Avg PnL"]} />
            <Bar dataKey="avgPnl" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {volumeRegimes.map((entry, i) => (
                <Cell key={i} fill={entry.avgPnl > 15 ? "#3b82f6" : entry.avgPnl > 5 ? "#fbbf24" : "#f87171"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-xl border border-red-100 dark:border-red-900">
          <p className="text-xs text-red-700 dark:text-red-400"><span className="font-semibold">Low volume weakness:</span> Only +8.4 bps avg PnL during low-volume periods (72.1% WR). Consider reducing position size or filtering entries during low-volume hours.</p>
        </div>
      </section>
    </div>
  );
}
