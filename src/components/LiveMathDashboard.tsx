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
import { Activity, Zap, Brain, TrendingUp, BarChart3 } from "lucide-react";

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

function hurstLabel(h: number): { label: string; color: string; trend: "up" | "down" | "neutral" } {
  if (h < 0.45) return { label: "Mean Reverting", color: "text-emerald-500", trend: "up" };
  if (h < 0.55) return { label: "Random Walk", color: "text-amber-500", trend: "neutral" };
  return { label: "Trending", color: "text-red-500", trend: "down" };
}

// Simple internal StatCard for the math dashboard to avoid prop mismatches with the main StatCard
function MathStatCard({ label, value, sub, icon: Icon, trend }: { label: string; value: string; sub: string; icon: any; trend?: "up" | "down" | "neutral" }) {
  return (
    <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)] shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-xl font-bold text-[var(--text)] tabular-nums">{value}</p>
      <p className={`text-[10px] mt-1 font-medium ${trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-[var(--text-muted)]"}`}>
        {sub}
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export default function LiveMathDashboard() {
  const { prices, currentPrice, futuresPrice, spotPrice, connected, tickCount } = useLiveBTC();
  const [feed, setFeed] = useState<"spot" | "futures">("spot");

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

    let avgInterval = 5;
    if (prices.length >= 2) {
      const totalTime = (prices[prices.length - 1].timestamp - prices[0].timestamp) / 1000;
      avgInterval = totalTime / (prices.length - 1) || 5;
    }

    const stats = rollingStats(returns);
    const hurst = hurstExponent(returns);
    const ent = shannonEntropy(returns);

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

  const priceChartOption: EChartsOption = useMemo(() => ({
    tooltip: { trigger: "axis" },
    legend: { data: ["Price", "SMA(20)"], bottom: 0 },
    grid: { bottom: 36, left: 10, right: 10, top: 10, containLabel: true },
    xAxis: { type: "category", data: last200.map((_, i) => String(i)), show: false },
    yAxis: { type: "value", scale: true, axisLabel: { formatter: (v: number) => "$" + v.toLocaleString() } },
    series: [
      { name: "Price", type: "line", data: last200, showSymbol: false, lineStyle: { width: 2, color: "#3b82f6" } },
      { name: "SMA(20)", type: "line", data: sma20Arr, showSymbol: false, lineStyle: { width: 1.5, color: "#f59e0b", type: "dashed" } },
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
      grid: { left: 10, right: 10, top: 10, bottom: 10, containLabel: true },
      xAxis: { type: "category", data: labels, show: false },
      yAxis: { type: "value" },
      series: [{
        type: "bar",
        data: counts.map((c: number, i: number) => ({
          value: c,
          itemStyle: { color: i < bins / 2 ? "#ef4444" : "#22c55e", borderRadius: [2, 2, 0, 0] },
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
      grid: { left: 10, right: 10, top: 10, bottom: 10, containLabel: true },
      xAxis: { type: "category", data: frequencies.slice(0, show).map((f) => f.toFixed(3)), show: false },
      yAxis: { type: "value" },
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
      grid: { bottom: 36, left: 10, right: 10, top: 10, containLabel: true },
      xAxis: { type: "category", data: history.map((h) => h.time), show: false },
      yAxis: { type: "value", scale: true },
      series: [
        { name: "Hurst", type: "line", data: history.map((h) => Number(h.hurst.toFixed(4))), showSymbol: false, lineStyle: { width: 2, color: "#f59e0b" } },
        { name: "Entropy", type: "line", data: history.map((h) => Number(h.entropy.toFixed(4))), showSymbol: false, lineStyle: { width: 2, color: "#06b6d4" } },
      ],
    };
  }, [history]);

  const displayedPrice = feed === "futures" && futuresPrice !== null ? futuresPrice : currentPrice;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">Live Mathematical Analysis</h2>
          <p className="text-sm text-[var(--text-muted)]">Real-time price analysis via Coinbase — computing 30+ math features</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs font-medium">
            <button
              onClick={() => setFeed("spot")}
              className={`px-3 py-1.5 transition-colors ${feed === "spot" ? "bg-blue-500 text-white" : "bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--text)]"}`}
            >
              Spot
            </button>
            <button
              onClick={() => setFeed("futures")}
              className={`px-3 py-1.5 transition-colors ${feed === "futures" ? "bg-emerald-500 text-white" : "bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--text)]"}`}
            >
              Futures
            </button>
          </div>
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs text-[var(--text-muted)]">{connected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">BTC / USD</p>
              {feed === "futures" ? (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500">BIP Nano Futures</span>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500">Spot</span>
              )}
            </div>
            <p className="text-4xl font-bold text-[var(--text)] tabular-nums">
              {fmtPrice(displayedPrice)}
            </p>
            {futuresPrice !== null && spotPrice !== null && (
              <div className="flex gap-4 mt-1 text-xs text-[var(--text-muted)]">
                <span>Spot: {fmtPrice(spotPrice)}</span>
                <span>Futures: {fmtPrice(futuresPrice)}</span>
                <span className={`font-semibold ${(futuresPrice - spotPrice) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  Premium: {((futuresPrice - spotPrice) / spotPrice * 10000).toFixed(1)} bps
                </span>
              </div>
            )}
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
            {computed?.cumReturn !== null && (
              <div>
                <span className="text-xs uppercase tracking-wider">Session Return</span>
                <p className={`font-mono ${(computed?.cumReturn ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {((computed?.cumReturn ?? 0) >= 0 ? "+" : "") + ((computed?.cumReturn ?? 0) * 100).toFixed(4)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!minDataReady && (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-8 animate-in text-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[var(--text-muted)]">Collecting price data... ({prices.length}/20 ticks)</p>
        </div>
      )}

      {minDataReady && computed && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MathStatCard
              label="Volatility (ann.)"
              value={fmtPct(computed.annualizedVol !== null ? computed.annualizedVol * 100 : null)}
              sub="Annualized from tick data"
              icon={Activity}
            />
            <MathStatCard
              label="Hurst Exponent"
              value={fmt(computed.hurst)}
              sub={computed.hurst !== null ? hurstLabel(computed.hurst).label : "--"}
              icon={Zap}
              trend={computed.hurst !== null ? hurstLabel(computed.hurst).trend : "neutral"}
            />
            <MathStatCard
              label="Shannon Entropy"
              value={fmt(computed.entropy, 3)}
              sub={computed.predict !== null ? `${fmtPct(computed.predict)} predictable` : "--"}
              icon={Brain}
            />
            <MathStatCard
              label="GBM Drift (mu)"
              value={fmt(computed.annualizedDrift, 4)}
              sub="Annualized drift rate"
              icon={TrendingUp}
              trend={computed.annualizedDrift !== null && computed.annualizedDrift > 0 ? "up" : "down"}
            />
            <MathStatCard
              label="Futures Premium"
              value={
                futuresPrice !== null && spotPrice !== null && spotPrice > 0
                  ? `${((futuresPrice - spotPrice) / spotPrice * 10000) >= 0 ? "+" : ""}${((futuresPrice - spotPrice) / spotPrice * 10000).toFixed(1)} bps`
                  : "--"
              }
              sub={futuresPrice !== null ? `BIP ${fmtPrice(futuresPrice)}` : "No futures data"}
              icon={BarChart3}
              trend={futuresPrice !== null && spotPrice !== null ? ((futuresPrice - spotPrice) >= 0 ? "up" : "down") : "neutral"}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1">Price + SMA(20)</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Last {last200.length} ticks</p>
              <Chart option={priceChartOption} height={240} />
            </div>
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1">Return Distribution</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">Log returns histogram</p>
              <Chart option={returnHistOption} height={240} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
