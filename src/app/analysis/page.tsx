"use client";

import { BarChart3, Target } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MockDataBanner from "@/components/MockDataBanner";
import LiveMathDashboard from "@/components/LiveMathDashboard";
import { HealthDot } from "@/components/HealthIndicator";
import { useKronosData } from "@/lib/use-data";
import Chart from "@/components/Chart";
import type { EChartsOption } from "@/components/Chart";
import { volatilityRegimes, trendVsRange, btcCorrelation, volumeRegimes } from "@/lib/mock-data";

function RangeKpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-[var(--bg)] rounded-xl p-4 border border-[var(--border)]">
      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-[var(--text)] mt-1">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>
    </div>
  );
}

function RegimeTable({ title, description, data }: { title: string; description: string; data: { regime: string; winRate: number; avgPnl: number; trades: number; sharpe?: number }[] }) {
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
  const { data: kronosData } = useKronosData();
  const volRegime = kronosData.volatilityRegime;
  const hasVolRegime = volRegime.length > 0;

  const predAcc = kronosData.predictionAccuracy;
  const hasPredAcc = predAcc.rows.length > 0;

  const bands = kronosData.predictedVsActualBands;
  const scatter = kronosData.accuracyScatter;
  const volTimeline = kronosData.volatilityTimeline;
  const btcPrice = kronosData.btcPriceChart;
  const hasBands = bands.length > 0;
  const hasScatter = scatter.length > 0;
  const hasVolTimeline = volTimeline.length > 0;
  const hasBtcPrice = btcPrice.length > 0;

  // Predicted vs actual bands: plot predicted_high/low as a shaded band
  // (via two lines with stacked area), plus current_price + observed
  // extremes as separate lines.
  const bandsOption: EChartsOption = hasBands
    ? {
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
        },
        legend: {
          data: [
            "Predicted Low",
            "Predicted High",
            "Current Price",
            "Observed High",
            "Observed Low",
          ],
          bottom: 0,
          textStyle: { fontSize: 10 },
        },
        grid: { bottom: 40, top: 12 },
        xAxis: {
          type: "category",
          data: bands.map((b) => b.t.slice(5, 16)),
          boundaryGap: false,
          axisLabel: {
            fontSize: 10,
            interval: Math.max(0, Math.floor(bands.length / 10) - 1),
          },
        },
        yAxis: {
          type: "value",
          scale: true,
          axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(1)}k` },
        },
        series: [
          {
            name: "Predicted Low",
            type: "line",
            data: bands.map((b) => b.predicted_low),
            showSymbol: false,
            lineStyle: { width: 0 },
            stack: "predicted-band",
            areaStyle: { color: "transparent" },
          },
          {
            name: "Predicted High",
            type: "line",
            data: bands.map((b) =>
              Math.max(0, b.predicted_high - b.predicted_low),
            ),
            showSymbol: false,
            stack: "predicted-band",
            lineStyle: { width: 0 },
            areaStyle: { color: "rgba(59, 130, 246, 0.18)" },
          },
          {
            name: "Current Price",
            type: "line",
            data: bands.map((b) => b.current_price),
            showSymbol: false,
            lineStyle: { width: 2, color: "#0ea5e9" },
          },
          {
            name: "Observed High",
            type: "line",
            data: bands.map((b) => b.observed_high),
            showSymbol: false,
            lineStyle: { width: 1.5, color: "#10b981", type: "dashed" },
            connectNulls: false,
          },
          {
            name: "Observed Low",
            type: "line",
            data: bands.map((b) => b.observed_low),
            showSymbol: false,
            lineStyle: { width: 1.5, color: "#ef4444", type: "dashed" },
            connectNulls: false,
          },
        ],
      }
    : {};

  // Accuracy scatter: x = confidence, y = range_error_bps; colour = hit/miss.
  const scatterHits = scatter.filter((s) => s.high_hit === true);
  const scatterMisses = scatter.filter((s) => s.high_hit !== true);
  const accuracyScatterOption: EChartsOption = hasScatter
    ? {
        tooltip: {
          trigger: "item",
          formatter: (params: unknown) => {
            const p = params as { data: number[] };
            return `Conf: ${(p.data[0] * 100).toFixed(1)}%<br/>Err: ${p.data[1].toFixed(1)} bps`;
          },
        },
        legend: { data: ["High hit", "High miss"], bottom: 0, textStyle: { fontSize: 10 } },
        grid: { bottom: 44, top: 12 },
        xAxis: {
          type: "value",
          name: "Confidence",
          nameLocation: "middle",
          nameGap: 24,
          min: 0,
          max: 1,
          axisLabel: {
            formatter: (v: number) => `${(v * 100).toFixed(0)}%`,
            fontSize: 10,
          },
        },
        yAxis: {
          type: "value",
          name: "Range error (bps)",
          nameLocation: "middle",
          nameGap: 38,
          nameTextStyle: { fontSize: 10 },
          axisLabel: { fontSize: 10 },
        },
        series: [
          {
            name: "High hit",
            type: "scatter",
            data: scatterHits.map((s) => [s.confidence, s.range_error_bps]),
            itemStyle: { color: "#10b981", opacity: 0.65 },
            symbolSize: 7,
          },
          {
            name: "High miss",
            type: "scatter",
            data: scatterMisses.map((s) => [s.confidence, s.range_error_bps]),
            itemStyle: { color: "#94a3b8", opacity: 0.45 },
            symbolSize: 6,
          },
        ],
      }
    : {};

  const volTimelineOption: EChartsOption = hasVolTimeline
    ? {
        tooltip: { trigger: "axis" },
        legend: {
          data: ["10s vol", "60s vol"],
          bottom: 0,
          textStyle: { fontSize: 10 },
        },
        grid: { bottom: 36, top: 12 },
        xAxis: {
          type: "category",
          data: volTimeline.map((v) => v.t.slice(11, 19)),
          boundaryGap: false,
          axisLabel: {
            fontSize: 10,
            interval: Math.max(0, Math.floor(volTimeline.length / 8) - 1),
          },
        },
        yAxis: { type: "value", scale: true },
        series: [
          {
            name: "10s vol",
            type: "line",
            data: volTimeline.map((v) => v.vol_10s),
            showSymbol: false,
            lineStyle: { width: 1, color: "#94a3b8" },
          },
          {
            name: "60s vol",
            type: "line",
            data: volTimeline.map((v) => v.vol_60s),
            showSymbol: false,
            lineStyle: { width: 2, color: "#3b82f6" },
          },
        ],
      }
    : {};

  const btcPriceOption: EChartsOption = hasBtcPrice
    ? {
        tooltip: { trigger: "axis" },
        grid: { top: 12, bottom: 24 },
        xAxis: {
          type: "category",
          data: btcPrice.map((p) => p.t.slice(11, 19)),
          boundaryGap: false,
          axisLabel: {
            fontSize: 10,
            interval: Math.max(0, Math.floor(btcPrice.length / 8) - 1),
          },
        },
        yAxis: {
          type: "value",
          scale: true,
          axisLabel: { formatter: (v: number) => `$${(v / 1000).toFixed(1)}k` },
        },
        series: [
          {
            type: "line",
            data: btcPrice.map((p) => p.price),
            showSymbol: false,
            lineStyle: { width: 2, color: "#3b82f6" },
            areaStyle: { opacity: 0.08 },
          },
        ],
      }
    : {};

  const rangeErrorOption: EChartsOption = hasPredAcc ? {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = (params as { name: string; data: number }[])[0];
        return `${p.name}<br/>Range error: <b>${p.data?.toFixed(1)} bps</b>`;
      },
    },
    xAxis: {
      type: "category",
      data: predAcc.rows.map((r) => r.timestamp.slice(5, 16)),
      axisLabel: { fontSize: 10, interval: Math.max(0, Math.floor(predAcc.rows.length / 8) - 1) },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (v: number) => `${v}` },
      name: "bps",
      nameTextStyle: { fontSize: 10 },
    },
    series: [{
      type: "bar",
      data: predAcc.rows.map((r) => ({
        value: r.range_error_bps ?? 0,
        itemStyle: {
          color: (r.range_error_bps ?? 0) < 10 ? "#10b981" : (r.range_error_bps ?? 0) < 30 ? "#f59e0b" : "#ef4444",
          borderRadius: [3, 3, 0, 0],
        },
      })),
      barMaxWidth: 6,
    }],
  } : {};

  const n = btcCorrelation.length;
  const meanX = btcCorrelation.reduce((s, p) => s + p.btcReturn, 0) / n;
  const meanY = btcCorrelation.reduce((s, p) => s + p.botReturn, 0) / n;
  const cov = btcCorrelation.reduce((s, p) => s + (p.btcReturn - meanX) * (p.botReturn - meanY), 0) / n;
  const stdX = Math.sqrt(btcCorrelation.reduce((s, p) => s + (p.btcReturn - meanX) ** 2, 0) / n);
  const stdY = Math.sqrt(btcCorrelation.reduce((s, p) => s + (p.botReturn - meanY) ** 2, 0) / n);
  const corr = cov / (stdX * stdY);

  const scatterOption: EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const p = params as { data: number[] };
        return `BTC: ${p.data[0]}%<br/>Bot: ${p.data[1]}%`;
      },
    },
    xAxis: {
      type: "value",
      name: "BTC Return %",
      nameLocation: "center",
      nameGap: 28,
      nameTextStyle: { fontSize: 10 },
    },
    yAxis: {
      type: "value",
      name: "Bot Return %",
      nameLocation: "center",
      nameGap: 38,
      nameTextStyle: { fontSize: 10 },
    },
    series: [{
      type: "scatter",
      data: btcCorrelation.map((d) => [d.btcReturn, d.botReturn]),
      symbolSize: 8,
      itemStyle: { color: "#3b82f6", opacity: 0.6 },
    }],
  };

  const volumeOption: EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const p = (params as { name: string; data: { value: number } }[])[0];
        return `${p.name}<br/>Avg PnL: <b>+${p.data.value} bps</b>`;
      },
    },
    xAxis: {
      type: "category",
      data: volumeRegimes.map((d) => d.regime),
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (v: number) => `${v} bps` },
    },
    series: [{
      type: "bar",
      data: volumeRegimes.map((d) => ({
        value: d.avgPnl,
        itemStyle: {
          color: d.avgPnl > 15 ? "#3b82f6" : d.avgPnl > 5 ? "#fbbf24" : "#f87171",
          borderRadius: [6, 6, 0, 0],
        },
      })),
      barMaxWidth: 60,
    }],
  };

  // Live volatility regime chart
  const volRegimeOption: EChartsOption = hasVolRegime ? {
    tooltip: { trigger: "axis" },
    legend: { data: ["Volatility", "Hurst", "Predictability"], bottom: 0 },
    grid: { bottom: 36 },
    xAxis: {
      type: "category",
      data: volRegime.map((d) => d.time?.slice(5, 16) ?? ""),
      boundaryGap: false,
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Volatility",
        type: "line",
        data: volRegime.map((d) => Number(d.avg_vol?.toFixed(4))),
        showSymbol: false,
        lineStyle: { width: 2 },
      },
      {
        name: "Hurst",
        type: "line",
        data: volRegime.map((d) => Number(d.avg_hurst?.toFixed(4))),
        showSymbol: false,
        lineStyle: { width: 2 },
      },
      {
        name: "Predictability",
        type: "line",
        data: volRegime.map((d) => Number(d.avg_predictability?.toFixed(4))),
        showSymbol: false,
        lineStyle: { width: 2 },
      },
    ],
  } : {};

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader title="Analysis" description="Market regime analysis and conditional performance" icon={BarChart3} />
      <MockDataBanner />

      {/* Live Mathematical Analysis */}
      <LiveMathDashboard />

      {/* Chronos Range Prediction Accuracy (backed by kronos_paper_prediction_accuracy view) */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Chronos Range Prediction Accuracy</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          How close predicted high/low ranges land to observed ranges. Only evaluates rows with observed data (5 min+ old).
        </p>
        {hasPredAcc ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <RangeKpi
                label="Avg Range Error"
                value={`${predAcc.summary.avgRangeErrorBps.toFixed(1)} bps`}
                sub="Lower is better"
              />
              <RangeKpi
                label="High Hit Rate"
                value={`${predAcc.summary.highHitRate.toFixed(1)}%`}
                sub="Observed high within range"
              />
              <RangeKpi
                label="Low Hit Rate"
                value={`${predAcc.summary.lowHitRate.toFixed(1)}%`}
                sub="Observed low within range"
              />
              <RangeKpi
                label="Direction Accuracy"
                value={`${predAcc.summary.directionAccuracy.toFixed(1)}%`}
                sub={`Across ${predAcc.summary.n} evaluated rows`}
              />
            </div>
            <Chart option={rangeErrorOption} height={220} />
            <p className="text-xs text-[var(--text-muted)] mt-3">
              Bars = range_error_bps (green &lt; 10, amber &lt; 30, red &gt;= 30). High accuracy on range is the core Chronos edge — see project CLAUDE.md.
            </p>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] text-center px-4"
            style={{ height: 200 }}
          >
            <p className="text-sm font-medium text-[var(--text)]">No observed ranges yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
              Waiting for the first batch of predictions to age into the 5-minute observation window.
            </p>
          </div>
        )}
      </section>

      {/* Predicted vs Actual Bands */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Predicted vs Actual Bands</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Chronos predicted range (blue ribbon), current price (solid), and observed extremes (dashed)
        </p>
        {hasBands ? (
          <Chart option={bandsOption} height={320} />
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] text-center px-4"
            style={{ height: 280 }}
          >
            <p className="text-sm font-medium text-[var(--text)]">Waiting for observed data</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
              Ribbon fills in once predictions age into the 5-minute
              observation window.
            </p>
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Accuracy Scatter */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Accuracy Scatter</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Confidence vs range error — green dots are predictions where the high was hit
          </p>
          {hasScatter ? (
            <Chart option={accuracyScatterOption} height={280} />
          ) : (
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] text-center px-4"
              style={{ height: 280 }}
            >
              <p className="text-sm font-medium text-[var(--text)]">No scored predictions yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                Scatter fills in once the accuracy view backfills (5 min+ cadence).
              </p>
            </div>
          )}
        </section>

        {/* Live BTC Price */}
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Live BTC Price</h3>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Most recent ticks from <code>market_pulse</code>
          </p>
          {hasBtcPrice ? (
            <Chart option={btcPriceOption} height={280} />
          ) : (
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] text-center px-4"
              style={{ height: 280 }}
            >
              <p className="text-sm font-medium text-[var(--text)]">No ticks landed yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                Chart fills in once the ticker service is streaming market_pulse.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Volatility Timeline */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Volatility Timeline</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Realized volatility over the last ~300 ticks — thin line is 10s, thick line is 60s
        </p>
        {hasVolTimeline ? (
          <Chart option={volTimelineOption} height={260} />
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] text-center px-4"
            style={{ height: 260 }}
          >
            <p className="text-sm font-medium text-[var(--text)]">No volatility data yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
              Timeline fills in once the ticker service writes realized_vol fields.
            </p>
          </div>
        )}
      </section>

      {/* Live Volatility Regime (from Supabase view) */}
      {hasVolRegime && (
        <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Live Volatility Regime</h3>
          <p className="text-sm text-[var(--text-muted)] mb-6">Hourly averages from statistical features -- vol, Hurst exponent, predictability</p>
          <Chart option={volRegimeOption} height={280} />
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <RegimeTable title="Performance by Volatility" description="How the bot performs in different volatility environments" data={volatilityRegimes} />
        <RegimeTable title="Trend vs Range" description="Performance when BTC is trending vs consolidating" data={trendVsRange} />
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
        <Chart option={scatterOption} height={300} />
      </section>

      {/* Volume Regimes */}
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Volume Regime Performance</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">How trade volume conditions affect bot profitability</p>
        <Chart option={volumeOption} height={200} />
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-xl border border-red-100 dark:border-red-900">
          <p className="text-xs text-red-700 dark:text-red-400"><span className="font-semibold">Low volume weakness:</span> Only +8.4 bps avg PnL during low-volume periods (72.1% WR). Consider reducing position size or filtering entries during low-volume hours.</p>
        </div>
      </section>
    </div>
  );
}
