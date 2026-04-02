"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Chart from "@/components/Chart";
import type { EChartsOption } from "@/components/Chart";
import { useLiveBTC } from "@/lib/useLiveBTC";
import {
  logReturns, sma, smaArray, ema,
  rollingStats, autocorrelation,
  rateOfChange, acceleration, cumulativeReturn,
  shannonEntropy, predictability,
  hurstExponent,
  fftSpectrum,
  gbmParameters,
  rollingPCA,
  annualizeVol, annualizeDrift,
} from "@/lib/live-math";

// ─── Types ────────────────────────────────────────────────────────────

interface ComputedMath {
  returns: number[];
  stats: ReturnType<typeof rollingStats>;
  sma20: number | null;
  sma50: number | null;
  ema20: number | null;
  lastReturn: number | null;
  roc: number | null;
  accel: number | null;
  cumReturn: number | null;
  entropy: number | null;
  predict: number | null;
  hurst: number | null;
  fft: ReturnType<typeof fftSpectrum>;
  gbm: ReturnType<typeof gbmParameters>;
  pca: ReturnType<typeof rollingPCA>;
  annualizedVol: number | null;
  annualizedDrift: number | null;
  autocorr1: number | null;
}

// ─── History for rolling charts ───────────────────────────────────────

interface HistoryPoint {
  time: string;
  hurst: number;
  entropy: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, decimals = 4): string {
  if (v === null || v === undefined || isNaN(v)) return "--";
  return v.toFixed(decimals);
}

function fmtPct(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined || isNaN(v)) return "--";
  return v.toFixed(decimals) + "%";
}

function fmtPrice(v: number | null | undefined): string {
  if (v === null || v === undefined) return "--";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function hurstLabel(h: number): { label: string; color: string } {
  if (h < 0.45) return { label: "Mean Reverting", color: "text-emerald-500" };
  if (h < 0.55) return { label: "Random Walk", color: "text-amber-500" };
  return { label: "Trending", color: "text-red-500" };
}

// ─── Component ────────────────────────────────────────────────────────

export default function LiveMathDashboard() {
  const { prices, currentPrice, futuresPrice, spotPrice, connected, tickCount, source } = useLiveBTC();

  // Debounced computation: recompute every 2 seconds
  const [computed, setComputed] = useState<ComputedMath | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const lastComputeRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastComputeRef.current < 2000 && computed !== null) return;
    if (prices.length < 5) return;
    lastComputeRef.current = now;

    const priceArr = prices.map((p) => p.price);
    const returns = logReturns(priceArr);

    // Average tick interval
    let avgInterval = 5; // default 5s
    if (prices.length >= 2) {
      const totalTime = (prices[prices.length - 1].timestamp - prices[0].timestamp) / 1000;
      avgInterval = totalTime / (prices.length - 1) || 5;
    }

    const stats = rollingStats(returns);
    const hurst = hurstExponent(returns);
    const ent = shannonEntropy(returns);

    // Build volatility proxy for PCA
    const volProxy: number[] = [];
    const momProxy: number[] = [];
    for (let i = 0; i < returns.length; i++) {
      volProxy.push(Math.abs(returns[i]));
      const lookback = Math.min(10, i + 1);
      let mSum = 0;
      for (let j = i - lookback + 1; j <= i; j++) if (j >= 0) mSum += returns[j];
      momProxy.push(mSum);
    }

    const result: ComputedMath = {
      returns,
      stats,
      sma20: sma(priceArr, 20),
      sma50: sma(priceArr, 50),
      ema20: ema(priceArr, 20),
      lastReturn: returns.length > 0 ? returns[returns.length - 1] : null,
      roc: rateOfChange(priceArr),
      accel: acceleration(priceArr),
      cumReturn: cumulativeReturn(priceArr),
      entropy: ent,
      predict: predictability(returns),
      hurst,
      fft: fftSpectrum(returns),
      gbm: gbmParameters(returns, avgInterval),
      pca: rollingPCA(returns, volProxy, momProxy),
      annualizedVol: stats ? annualizeVol(stats.stdDev, avgInterval) : null,
      annualizedDrift: stats ? annualizeDrift(stats.mean, avgInterval) : null,
      autocorr1: autocorrelation(returns, 1),
    };

    setComputed(result);

    // Append to history
    if (hurst !== null && ent !== null) {
      const timeStr = new Date().toLocaleTimeString();
      setHistory((prev) => {
        const next = [...prev, { time: timeStr, hurst, entropy: ent }];
        return next.length > 100 ? next.slice(-100) : next;
      });
    }
  }, [prices, computed]);

  const priceArr = useMemo(() => prices.map((p) => p.price), [prices]);
  const last200 = useMemo(() => priceArr.slice(-200), [priceArr]);
  const sma20Arr = useMemo(() => smaArray(last200, 20), [last200]);

  const minDataReady = prices.length >= 20;

  // ─── Chart Options ──────────────────────────────────────────────────

  const priceChartOption: EChartsOption = useMemo(() => ({
    tooltip: { trigger: "axis" },
    legend: { data: ["Price", "SMA(20)"], bottom: 0 },
    grid: { bottom: 36 },
    xAxis: {
      type: "category",
      data: last200.map((_, i) => String(i)),
      show: false,
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: { formatter: (v: number) => "$" + v.toLocaleString() },
    },
    series: [
      {
        name: "Price",
        type: "line",
        data: last200,
        showSymbol: false,
        lineStyle: { width: 2, color: "#3b82f6" },
        itemStyle: { color: "#3b82f6" },
      },
      {
        name: "SMA(20)",
        type: "line",
        data: sma20Arr,
        showSymbol: false,
        lineStyle: { width: 1.5, color: "#f59e0b", type: "dashed" },
        itemStyle: { color: "#f59e0b" },
      },
    ],
  }), [last200, sma20Arr]);

  const returnHistOption: EChartsOption = useMemo(() => {
    if (!computed || computed.returns.length < 10) return {};
    const returns = computed.returns;
    const bins = 30;
    const min = Math.min(...returns);
    const max = Math.max(...returns);
    if (min === max) return {};
    const binWidth = (max - min) / bins;
    const counts = new Array(bins).fill(0);
    for (const r of returns) {
      const idx = Math.min(Math.floor((r - min) / binWidth), bins - 1);
      counts[idx]++;
    }
    const labels = counts.map((_, i) => ((min + (i + 0.5) * binWidth) * 100).toFixed(3) + "%");
    return {
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: labels, show: false },
      yAxis: { type: "value", name: "Count" },
      series: [{
        type: "bar",
        data: counts.map((c: number, i: number) => ({
          value: c,
          itemStyle: {
            color: i < bins / 2 ? "#ef4444" : "#22c55e",
            borderRadius: [2, 2, 0, 0],
          },
        })),
        barMaxWidth: 20,
      }],
    };
  }, [computed]);

  const fftChartOption: EChartsOption = useMemo(() => {
    if (!computed?.fft) return {};
    const { frequencies, magnitudes } = computed.fft;
    const show = Math.min(50, frequencies.length);
    return {
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: frequencies.slice(0, show).map((f) => f.toFixed(3)),
        name: "Frequency",
        nameLocation: "center",
        nameGap: 28,
        show: false,
      },
      yAxis: { type: "value", name: "Magnitude" },
      series: [{
        type: "bar",
        data: magnitudes.slice(0, show).map((m) => ({
          value: Number(m.toFixed(6)),
          itemStyle: { color: "#8b5cf6", borderRadius: [2, 2, 0, 0] },
        })),
        barMaxWidth: 12,
      }],
    };
  }, [computed]);

  const historyChartOption: EChartsOption = useMemo(() => {
    if (history.length < 2) return {};
    return {
      tooltip: { trigger: "axis" },
      legend: { data: ["Hurst", "Entropy"], bottom: 0 },
      grid: { bottom: 36 },
      xAxis: {
        type: "category",
        data: history.map((h) => h.time),
        show: false,
      },
      yAxis: { type: "value", scale: true },
      series: [
        {
          name: "Hurst",
          type: "line",
          data: history.map((h) => Number(h.hurst.toFixed(4))),
          showSymbol: false,
          lineStyle: { width: 2, color: "#f59e0b" },
          itemStyle: { color: "#f59e0b" },
        },
        {
          name: "Entropy",
          type: "line",
          data: history.map((h) => Number(h.entropy.toFixed(4))),
          showSymbol: false,
          lineStyle: { width: 2, color: "#06b6d4" },
          itemStyle: { color: "#06b6d4" },
        },
      ],
    };
  }, [history]);

  // ─── Math Table Rows ────────────────────────────────────────────────

  const tableRows = useMemo(() => {
    if (!computed) return [];
    const c = computed;
    const rows: { category: string; metric: string; value: string; interpretation: string }[] = [];

    // Algebra
    rows.push({ category: "Algebra", metric: "SMA(20)", value: fmtPrice(c.sma20), interpretation: "20-tick simple moving average" });
    rows.push({ category: "Algebra", metric: "SMA(50)", value: fmtPrice(c.sma50), interpretation: "50-tick simple moving average" });
    rows.push({ category: "Algebra", metric: "EMA(20)", value: fmtPrice(c.ema20), interpretation: "20-tick exponential moving average" });
    rows.push({ category: "Algebra", metric: "Log Return", value: fmt(c.lastReturn, 6), interpretation: "Latest log return" });

    // Statistics
    rows.push({ category: "Statistics", metric: "Mean Return", value: fmt(c.stats?.mean, 8), interpretation: "Average log return" });
    rows.push({ category: "Statistics", metric: "Std Dev", value: fmt(c.stats?.stdDev, 6), interpretation: "Return volatility" });
    rows.push({ category: "Statistics", metric: "Skewness", value: fmt(c.stats?.skewness), interpretation: c.stats && c.stats.skewness < -0.5 ? "Left-tailed" : c.stats && c.stats.skewness > 0.5 ? "Right-tailed" : "Symmetric" });
    rows.push({ category: "Statistics", metric: "Kurtosis", value: fmt(c.stats?.kurtosis), interpretation: c.stats && c.stats.kurtosis > 1 ? "Fat tails" : "Normal tails" });
    rows.push({ category: "Statistics", metric: "Z-Score", value: fmt(c.stats?.zScore, 2), interpretation: c.stats && Math.abs(c.stats.zScore) > 2 ? "Extreme" : "Normal" });
    rows.push({ category: "Statistics", metric: "Autocorr(1)", value: fmt(c.autocorr1), interpretation: c.autocorr1 !== null && Math.abs(c.autocorr1) > 0.1 ? "Serial dependence" : "Weak dependence" });

    // Calculus
    rows.push({ category: "Calculus", metric: "Rate of Change", value: fmtPrice(c.roc), interpretation: "Price velocity (1st derivative)" });
    rows.push({ category: "Calculus", metric: "Acceleration", value: fmtPrice(c.accel), interpretation: "Price acceleration (2nd derivative)" });
    rows.push({ category: "Calculus", metric: "Cumulative Return", value: fmtPct(c.cumReturn !== null ? c.cumReturn * 100 : null), interpretation: "Total return over window" });

    // Information Theory
    rows.push({ category: "Info Theory", metric: "Shannon Entropy", value: fmt(c.entropy, 3), interpretation: c.entropy !== null && c.entropy > 3 ? "High randomness" : "Lower randomness" });
    rows.push({ category: "Info Theory", metric: "Predictability", value: fmtPct(c.predict), interpretation: c.predict !== null && c.predict > 50 ? "More structured" : "More random" });

    // Fractal
    const h = c.hurst;
    rows.push({ category: "Fractal", metric: "Hurst Exponent", value: fmt(h), interpretation: h !== null ? hurstLabel(h).label : "--" });
    rows.push({ category: "Fractal", metric: "Fractal Dimension", value: h !== null ? fmt(2 - h) : "--", interpretation: "2 - Hurst" });

    // Signal
    rows.push({ category: "Signal", metric: "Dominant Cycle", value: c.fft ? fmt(c.fft.dominantPeriod, 1) + " ticks" : "--", interpretation: "Strongest periodic component" });
    rows.push({ category: "Signal", metric: "Spectral Entropy", value: fmt(c.fft?.spectralEntropy, 3), interpretation: c.fft && c.fft.spectralEntropy > 5 ? "Noisy spectrum" : "Some structure" });
    rows.push({ category: "Signal", metric: "Noise Ratio", value: fmtPct(c.fft ? c.fft.noiseRatio * 100 : null), interpretation: c.fft && c.fft.noiseRatio < 0.7 ? "Signal present" : "Mostly noise" });
    const snr = c.fft && c.fft.noiseRatio < 1 ? (1 - c.fft.noiseRatio) / c.fft.noiseRatio : null;
    rows.push({ category: "Signal", metric: "SNR", value: fmt(snr, 2), interpretation: snr !== null && snr > 0.5 ? "Decent signal" : "Weak signal" });

    // Stochastic Calculus
    rows.push({ category: "Stochastic", metric: "GBM Drift (mu)", value: fmt(c.annualizedDrift, 4), interpretation: "Annualized drift rate" });
    rows.push({ category: "Stochastic", metric: "GBM Vol (sigma)", value: fmtPct(c.annualizedVol !== null ? c.annualizedVol * 100 : null), interpretation: "Annualized volatility" });
    rows.push({ category: "Stochastic", metric: "Ito Correction", value: fmt(c.gbm?.itoCorrection, 6), interpretation: "Drift adjustment (-0.5 * sigma^2)" });

    // Linear Algebra
    rows.push({ category: "Lin. Algebra", metric: "PC1 Score", value: fmt(c.pca?.pc1, 3), interpretation: "Primary principal component" });
    rows.push({ category: "Lin. Algebra", metric: "PC2 Score", value: fmt(c.pca?.pc2, 3), interpretation: "Secondary principal component" });
    rows.push({ category: "Lin. Algebra", metric: "Variance Explained", value: fmtPct(c.pca?.varianceExplained), interpretation: "Top 2 PCs capture" });

    return rows;
  }, [computed]);

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">Live Mathematical Analysis</h2>
          <p className="text-sm text-[var(--text-muted)]">Real-time BTC/USD price analysis via Coinbase WebSocket</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs text-[var(--text-muted)]">{connected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      {/* Row 1: Price + Status */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">BTC / USD</p>
              {source === "futures" ? (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500">BIP Nano Futures</span>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500">BTC/USD Spot</span>
              )}
            </div>
            <p className="text-4xl font-bold text-[var(--text)] tabular-nums">{fmtPrice(currentPrice)}</p>
          </div>
          <div className="flex gap-6 text-sm text-[var(--text-muted)]">
            <div>
              <span className="text-xs uppercase tracking-wider">Ticks</span>
              <p className="font-mono text-[var(--text)]">{tickCount}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider">Window</span>
              <p className="font-mono text-[var(--text)]">{prices.length} / 500</p>
            </div>
            {computed?.cumReturn !== null && computed?.cumReturn !== undefined && (
              <div>
                <span className="text-xs uppercase tracking-wider">Session Return</span>
                <p className={`font-mono ${computed.cumReturn >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {(computed.cumReturn >= 0 ? "+" : "") + (computed.cumReturn * 100).toFixed(4)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collecting state */}
      {!minDataReady && (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-8 animate-in text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[var(--text-muted)]">Collecting price data... ({prices.length}/20 ticks)</p>
        </div>
      )}

      {minDataReady && computed && (
        <>
          {/* Row 2: Core Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="Volatility (ann.)"
              value={computed.annualizedVol !== null ? fmtPct(computed.annualizedVol * 100) : "--"}
              sub="Annualized from tick data"
              accent="text-blue-500"
            />
            <StatCard
              label="Hurst Exponent"
              value={fmt(computed.hurst)}
              sub={computed.hurst !== null ? hurstLabel(computed.hurst).label : "--"}
              accent={computed.hurst !== null ? hurstLabel(computed.hurst).color : "text-[var(--text-muted)]"}
            />
            <StatCard
              label="Shannon Entropy"
              value={fmt(computed.entropy, 3)}
              sub={computed.predict !== null ? `${fmtPct(computed.predict)} predictable` : "--"}
              accent="text-cyan-500"
            />
            <StatCard
              label="GBM Drift (mu)"
              value={fmt(computed.annualizedDrift, 4)}
              sub="Annualized drift rate"
              accent={computed.annualizedDrift !== null && computed.annualizedDrift > 0 ? "text-emerald-500" : "text-red-500"}
            />
            <StatCard
              label="Futures Premium"
              value={
                futuresPrice !== null && spotPrice !== null && spotPrice > 0
                  ? `${((futuresPrice - spotPrice) / spotPrice * 10000) >= 0 ? "+" : ""}${((futuresPrice - spotPrice) / spotPrice * 10000).toFixed(1)} bps`
                  : "--"
              }
              sub={futuresPrice !== null ? `BIP ${fmtPrice(futuresPrice)}` : "No futures data"}
              accent={
                futuresPrice !== null && spotPrice !== null
                  ? (futuresPrice - spotPrice) >= 0 ? "text-emerald-500" : "text-red-500"
                  : "text-[var(--text-muted)]"
              }
            />
          </div>

          {/* Row 3: Price + Return Distribution Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1">Price + SMA(20)</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Last {last200.length} ticks</p>
              <Chart option={priceChartOption} height={240} />
            </div>
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1">Return Distribution</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Log returns histogram</p>
              <Chart option={returnHistOption} height={240} />
            </div>
          </div>

          {/* Row 4: FFT + Rolling Hurst/Entropy */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1">FFT Power Spectrum</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Frequency decomposition of returns</p>
              {computed.fft ? (
                <Chart option={fftChartOption} height={240} />
              ) : (
                <p className="text-[var(--text-muted)] text-sm py-12 text-center">Need 16+ ticks for FFT</p>
              )}
            </div>
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1">Rolling Hurst + Entropy</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Tracked over session</p>
              {history.length >= 2 ? (
                <Chart option={historyChartOption} height={240} />
              ) : (
                <p className="text-[var(--text-muted)] text-sm py-12 text-center">Accumulating history...</p>
              )}
            </div>
          </div>

          {/* Row 5: Full Math Table */}
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
            <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Complete Mathematical Profile</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 text-[var(--text-muted)] font-medium w-28">Category</th>
                    <th className="text-left py-2 text-[var(--text-muted)] font-medium w-40">Metric</th>
                    <th className="text-right py-2 text-[var(--text-muted)] font-medium w-36">Value</th>
                    <th className="text-left py-2 text-[var(--text-muted)] font-medium pl-4">Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => {
                    const isFirstInCategory = i === 0 || tableRows[i - 1].category !== row.category;
                    return (
                      <tr key={`${row.category}-${row.metric}`} className={isFirstInCategory ? "border-t border-[var(--border)]" : ""}>
                        <td className="py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                          {isFirstInCategory ? row.category : ""}
                        </td>
                        <td className="py-2 font-medium text-[var(--text)]">{row.metric}</td>
                        <td className="py-2 text-right font-mono text-[var(--text)]">{row.value}</td>
                        <td className="py-2 pl-4 text-xs text-[var(--text-muted)]">{row.interpretation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-5 animate-in">
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>
    </div>
  );
}
