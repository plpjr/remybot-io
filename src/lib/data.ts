import { supabase, supabaseConfigured } from "./supabase";
import {
  overviewStats as mockOverview,
  equityCurve as mockEquity,
  monthlyReturns as mockMonthly,
  longShortBreakdown as mockLongShort,
  weeklyImprovements as mockImprovements,
  skillRadar as mockRadar,
  recentPerformance as mockRecent,
} from "./mock-data";

/* ─── Types ─── */

export interface OverviewStats {
  totalReturn: number;
  totalReturnMonth: number;
  totalReturnWeek: number;
  winRate: number;
  avgPnlBps: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  profitFactor: number;
  avgTradesPerDay: number;
  modelVersion: string;
  lastTrained: string;
  status: "running" | "stopped" | "error";
  uptime: string;
}

export interface SweepRun {
  sweep_name: string;
  sweep_type: string;
  description: string;
  total_experiments: number;
  completed_experiments: number;
  champion_bps: number;
  leader_experiment: string;
  leader_bps: number;
  baseline_bps: number;
  started_at: string;
  finished_at: string | null;
  status: string;
  config: Record<string, unknown>;
}

export interface Experiment {
  experiment_name: string;
  mean_bps: number;
  std_bps: number;
  median_bps: number;
  min_bps: number;
  max_bps: number;
  rank: number;
  seed_results: Record<string, number>;
  status: string;
  avg_win_rate: number | null;
  avg_trade_count: number | null;
  vs_baseline_bps: number;
  vs_champion_bps: number;
  total_seeds: number;
}

export interface ModelInfo {
  version: string;
  algorithm: string;
  architecture: string;
  embedding_model: string;
  timeframes: string[];
  feature_count: number;
  training_data_rows: number;
  training_data_range: string;
  robustness_mean_bps: number;
  robustness_std_bps: number;
  robustness_seeds: number;
  reward_config: Record<string, unknown>;
  training_config: Record<string, unknown>;
  notes: string;
  deployed_at: string;
}

export interface ChangelogEntry {
  id: number;
  date: string;
  category: string;
  title: string;
  description: string;
  before_metric: Record<string, unknown> | null;
  after_metric: Record<string, unknown> | null;
  verdict: string;
  related_sweep: string | null;
  tags: string[];
}

/* ─── Per-cycle model votes (populated by bot after Track B deploys) ─── */

/**
 * Per-timeframe Kronos vote. Written by the bot's `_build_model_votes`
 * helper (see freqtrade-bot plan Track B); shape mirrored here for type
 * safety on the dashboard side. The `tests/test_data_contract_drift.py`
 * on the bot side cross-checks these keys.
 */
export interface KronosTimingVote {
  pattern: "dip_then_rise" | "rise_then_dip" | "flat" | string;
  entry_side: "long" | "short" | "none" | string;
  confidence: number;
}

/**
 * Full per-cycle model votes jsonb column, landing on
 * `kronos_predictions.model_votes`. All sub-objects are nullable (partial
 * failures are normal — e.g. Kronos 1h model not loaded on VPS).
 */
export interface ModelVotes {
  chronos: {
    predicted_high: number;
    predicted_low: number;
    predicted_close: number;
    range_bps: number;
    confidence: number;
    direction_bias: "up" | "down" | null;
  } | null;
  kronos_5m: KronosTimingVote | null;
  kronos_1h: KronosTimingVote | null;
  kronos_1m: KronosTimingVote | null;
  kronos_consensus: {
    direction: "up" | "down" | "flat" | null;
    strength: number;
  } | null;
  ta: Partial<{
    rsi: number;
    macd_hist: number;
    atr_pct: number;
    adx: number;
    bb_pct_b: number;
  }>;
  funding: {
    signal: "long" | "short" | "hold";
    rate_bps: number;
    zscore: number;
  } | null;
  regime: { name: string; adx?: number; bb_width?: number } | null;
  liquidation: { signal: string; intensity: number } | null;
  meta_learner: {
    probability: number;
    accepted: boolean;
    threshold: number;
  } | null;
  adaptive_weights: Record<string, number>;
  final: { action: string; reason: string; confidence: number };
}

/** Current bot-schema row shapes (see freqtrade-bot/trading/trade_logger.py). */
interface BotStatusRow {
  status: string;
  account_balance: number | null;
  drawdown_pct: number | null;
  total_trades: number | null;
  win_rate: number | null;
  uptime_seconds: number | null;
  models_loaded: boolean | null;
  chronos_ready: boolean | null;
  kronos_5m_ready: boolean | null;
  buffers_ready: boolean | null;
  timestamp: string;
}

interface KronosTradeRow {
  id: number;
  side: "long" | "short";
  entry_time: string;
  exit_time: string | null;
  entry_price: number;
  exit_price: number | null;
  profit_bps: number | null;
  profit_usd: number | null;
  exit_reason: string | null;
  duration_minutes: number | null;
  confidence: number | null;
  regime: string | null;
  session: string | null;
}

interface KronosPredictionRow {
  id: number;
  timestamp: string;
  timeframe: string;
  model: string;
  current_price: number | null;
  predicted_high: number | null;
  predicted_low: number | null;
  predicted_close: number | null;
  predicted_range_bps: number | null;
  confidence: number | null;
}

/* ─── Helpers ─── */

function formatUptime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Assume a 5-minute heartbeat cadence; anything older is "stopped". */
function isBotLive(statusRow: Pick<BotStatusRow, "status" | "timestamp">): boolean {
  if (statusRow.status !== "running") return false;
  const age = Date.now() - new Date(statusRow.timestamp).getTime();
  return age < 6 * 60 * 1000;
}

/* ─── Fetch Functions ─── */

/*
 * Trade-facing readers query the `kronos_paper_*` views instead of the
 * base `kronos_trades` / `kronos_signals` / `kronos_predictions` tables.
 * The views are defined by supabase migration
 * 20260417230000_paper_live_mode_and_symbol.sql as
 *   SELECT * FROM <base> WHERE mode = 'paper'
 * so paper + live never mix in Overview / Equity / Long-Short rollups.
 * When the bot eventually flips live, swap these to `kronos_live_*`
 * (or parameterize by a `mode` URL query param).
 *
 * Exceptions:
 *   - `kronos_bot_status` — singleton, mode-independent health heartbeat.
 *   - `market_pulse` — tick-level market data, shared across modes.
 *   - `fetchDataFreshness` — intentionally queries base tables to prove
 *     the WRITER is landing rows (views just filter; an empty view can
 *     hide a broken writer if every new row went to mode='live').
 */

/**
 * Overview stats blend bot-health (from `kronos_bot_status` singleton)
 * with trade-driven aggregates (from `kronos_paper_trades`). Zero trades
 * → zero-everything with `status: "stopped"`. No synthetic win-rate
 * fallback — dashboard honesty is the contract.
 */
export async function fetchOverviewStats(): Promise<OverviewStats> {
  if (!supabaseConfigured) return mockOverview;

  try {
    const [statusRes, tradesRes] = await Promise.all([
      supabase
        .from("kronos_bot_status")
        .select("*")
        .eq("id", 1)
        .maybeSingle(),
      // Pull last ~1000 closed trades to compute rollups client-side.
      // dbt marts (agg_daily_pnl, fct_trades) will replace this once applied.
      supabase
        .from("kronos_paper_trades")
        .select("id, entry_time, exit_time, profit_bps, profit_usd, side")
        .not("exit_time", "is", null)
        .order("exit_time", { ascending: false })
        .limit(1000),
    ]);

    const status = (statusRes.data ?? null) as BotStatusRow | null;
    const trades = (tradesRes.data ?? []) as Pick<
      KronosTradeRow,
      "id" | "entry_time" | "exit_time" | "profit_bps" | "profit_usd" | "side"
    >[];

    // No status row yet AND no trades → bot hasn't started. Return the
    // honest-empty shape; mock is only used when env is unconfigured.
    if (!status && trades.length === 0) {
      return {
        totalReturn: 0,
        totalReturnMonth: 0,
        totalReturnWeek: 0,
        winRate: 0,
        avgPnlBps: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalTrades: 0,
        profitFactor: 0,
        avgTradesPerDay: 0,
        modelVersion: "chronos+kronos",
        lastTrained: "—",
        status: "stopped",
        uptime: "—",
      };
    }

    const live = status ? isBotLive(status) : false;
    const winners = trades.filter((t) => (t.profit_usd ?? 0) > 0);
    const losers = trades.filter((t) => (t.profit_usd ?? 0) < 0);

    const totalProfitUsd = trades.reduce((s, t) => s + (t.profit_usd ?? 0), 0);
    const startingBalance = (status?.account_balance ?? 10_000) - totalProfitUsd;
    const totalReturnPct = startingBalance > 0
      ? (totalProfitUsd / startingBalance) * 100
      : 0;

    const now = Date.now();
    const weekAgo = now - 7 * 86400 * 1000;
    const monthAgo = now - 30 * 86400 * 1000;
    const weekTrades = trades.filter(
      (t) => t.exit_time && new Date(t.exit_time).getTime() >= weekAgo,
    );
    const monthTrades = trades.filter(
      (t) => t.exit_time && new Date(t.exit_time).getTime() >= monthAgo,
    );

    const weekPnl = weekTrades.reduce((s, t) => s + (t.profit_usd ?? 0), 0);
    const monthPnl = monthTrades.reduce((s, t) => s + (t.profit_usd ?? 0), 0);
    const weekReturn = startingBalance > 0 ? (weekPnl / startingBalance) * 100 : 0;
    const monthReturn = startingBalance > 0 ? (monthPnl / startingBalance) * 100 : 0;

    const avgPnlBps = trades.length
      ? trades.reduce((s, t) => s + (t.profit_bps ?? 0), 0) / trades.length
      : 0;

    const grossProfit = winners.reduce((s, t) => s + (t.profit_usd ?? 0), 0);
    const grossLoss = Math.abs(losers.reduce((s, t) => s + (t.profit_usd ?? 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Avg trades per day over observed window. If bot has <1 day of data,
    // treat as 0 (inflated averages from tiny samples are worse than zero).
    let avgTradesPerDay = 0;
    if (trades.length > 1) {
      const oldestExit = trades[trades.length - 1]?.exit_time;
      const newestExit = trades[0]?.exit_time;
      if (oldestExit && newestExit) {
        const span = new Date(newestExit).getTime() - new Date(oldestExit).getTime();
        const days = span / 86400000;
        avgTradesPerDay = days > 1 ? trades.length / days : 0;
      }
    }

    const winRate = trades.length ? (winners.length / trades.length) * 100 : 0;

    return {
      totalReturn: Math.round(totalReturnPct * 100) / 100,
      totalReturnMonth: Math.round(monthReturn * 100) / 100,
      totalReturnWeek: Math.round(weekReturn * 100) / 100,
      winRate: Math.round(winRate * 10) / 10,
      avgPnlBps: Math.round(avgPnlBps * 10) / 10,
      sharpeRatio: 0, // requires daily returns series; dbt mart (agg_daily_pnl) will feed this
      maxDrawdown: Math.round((status?.drawdown_pct ?? 0) * 100) / 100,
      totalTrades: status?.total_trades ?? trades.length,
      profitFactor: Math.round(profitFactor * 100) / 100,
      avgTradesPerDay: Math.round(avgTradesPerDay * 10) / 10,
      modelVersion: "chronos+kronos",
      lastTrained: "—",
      status: live ? "running" : "stopped",
      uptime: live ? formatUptime(status?.uptime_seconds) : "—",
    };
  } catch {
    return mockOverview;
  }
}

/**
 * Equity curve: cumulative realized PnL from closed trades, keyed by
 * `exit_time` day. No mock inversion — shows real history even when
 * short; no data → empty array (home page renders empty state).
 */
export async function fetchEquityCurve() {
  if (!supabaseConfigured) return mockEquity;

  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("exit_time, profit_usd")
      .not("exit_time", "is", null)
      .not("profit_usd", "is", null)
      .order("exit_time", { ascending: true })
      .limit(5000);

    const rows = (data ?? []) as { exit_time: string; profit_usd: number }[];
    if (rows.length === 0) return [];

    // Bucket by day (UTC), carry running cumulative PnL.
    const byDay = new Map<string, number>();
    let cumulative = 10_000; // starting balance baseline; real value comes from executor state
    for (const r of rows) {
      cumulative += r.profit_usd;
      byDay.set(r.exit_time.slice(0, 10), cumulative);
    }

    return Array.from(byDay.entries()).map(([date, equity]) => ({
      date,
      equity: Math.round(equity),
    }));
  } catch {
    return mockEquity;
  }
}

/** Monthly returns: aggregate `profit_usd` by month; return % of starting balance. */
export async function fetchMonthlyReturns() {
  if (!supabaseConfigured) return mockMonthly;

  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("exit_time, profit_usd")
      .not("exit_time", "is", null)
      .not("profit_usd", "is", null)
      .order("exit_time", { ascending: true })
      .limit(5000);

    const rows = (data ?? []) as { exit_time: string; profit_usd: number }[];
    if (rows.length === 0) return [];

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const byMonth = new Map<string, number>();
    for (const r of rows) {
      const key = r.exit_time.slice(0, 7); // YYYY-MM
      byMonth.set(key, (byMonth.get(key) ?? 0) + r.profit_usd);
    }

    return Array.from(byMonth.entries()).map(([ym, pnl]) => {
      const [, mm] = ym.split("-");
      const idx = Math.max(0, Math.min(11, parseInt(mm, 10) - 1));
      return {
        month: monthNames[idx] ?? ym,
        return: Math.round((pnl / 10_000) * 10000) / 100, // % of starting 10k, 2dp
      };
    });
  } catch {
    return mockMonthly;
  }
}

/** Long / short breakdown from `kronos_trades.side`. */
export async function fetchLongShortBreakdown() {
  if (!supabaseConfigured) return mockLongShort;

  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("side, profit_usd, profit_bps")
      .not("exit_time", "is", null)
      .limit(10_000);

    const rows = (data ?? []) as {
      side: "long" | "short";
      profit_usd: number | null;
      profit_bps: number | null;
    }[];

    if (rows.length === 0) {
      return {
        longWinRate: 0,
        shortWinRate: 0,
        longTrades: 0,
        shortTrades: 0,
        longAvgPnl: 0,
        shortAvgPnl: 0,
      };
    }

    const longs = rows.filter((t) => t.side === "long");
    const shorts = rows.filter((t) => t.side === "short");

    const winRate = (arr: typeof rows) =>
      arr.length
        ? Math.round(
            (arr.filter((t) => (t.profit_usd ?? 0) > 0).length / arr.length) * 1000,
          ) / 10
        : 0;
    const avgBps = (arr: typeof rows) =>
      arr.length
        ? Math.round(
            (arr.reduce((s, t) => s + (t.profit_bps ?? 0), 0) / arr.length) * 10,
          ) / 10
        : 0;

    return {
      longWinRate: winRate(longs),
      shortWinRate: winRate(shorts),
      longTrades: longs.length,
      shortTrades: shorts.length,
      longAvgPnl: avgBps(longs),
      shortAvgPnl: avgBps(shorts),
    };
  } catch {
    return mockLongShort;
  }
}

/** Recent performance rollups (today / week / month / all-time). */
export async function fetchRecentPerformance() {
  if (!supabaseConfigured) return mockRecent;

  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("exit_time, profit_usd, profit_bps")
      .not("exit_time", "is", null)
      .order("exit_time", { ascending: false })
      .limit(5000);

    const rows = (data ?? []) as {
      exit_time: string;
      profit_usd: number | null;
      profit_bps: number | null;
    }[];

    const now = Date.now();
    const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0)).getTime();
    const weekAgo = now - 7 * 86400 * 1000;
    const monthAgo = now - 30 * 86400 * 1000;

    const bucket = (after: number) =>
      rows.filter((r) => new Date(r.exit_time).getTime() >= after);

    const agg = (arr: typeof rows) => {
      if (arr.length === 0) return { pnl: 0, trades: 0, winRate: 0 };
      const pnl = Math.round(
        (arr.reduce((s, t) => s + ((t.profit_usd ?? 0) / 10_000) * 100, 0)) * 100,
      ) / 100; // % of baseline
      const winners = arr.filter((t) => (t.profit_usd ?? 0) > 0).length;
      return {
        pnl,
        trades: arr.length,
        winRate: Math.round((winners / arr.length) * 1000) / 10,
      };
    };

    return [
      { period: "Today", ...agg(bucket(todayStart)) },
      { period: "This Week", ...agg(bucket(weekAgo)) },
      { period: "This Month", ...agg(bucket(monthAgo)) },
      { period: "All Time", ...agg(rows) },
    ];
  } catch {
    return mockRecent;
  }
}

/**
 * Recent predictions feed for the /model and /analysis pages.
 * Feeds the Chronos range-prediction accuracy chart.
 */
export async function fetchRecentPredictions(limit: number = 500): Promise<KronosPredictionRow[]> {
  if (!supabaseConfigured) return [];

  try {
    const { data } = await supabase
      .from("kronos_paper_predictions")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    return (data as KronosPredictionRow[]) ?? [];
  } catch {
    return [];
  }
}

/** Recent trades feed for the /trading page (replaces `trade_journal`). */
export async function fetchRecentTrades(limit: number = 200): Promise<KronosTradeRow[]> {
  if (!supabaseConfigured) return [];

  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("*")
      .order("entry_time", { ascending: false })
      .limit(limit);

    return (data as KronosTradeRow[]) ?? [];
  } catch {
    return [];
  }
}

/* ─── Autoresearch / Evo (unchanged — tables kept) ─── */

export async function fetchChangelog(): Promise<ChangelogEntry[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("experiment_changelog")
      .select("*")
      .order("date", { ascending: false })
      .limit(20);
    return (data as ChangelogEntry[]) ?? [];
  } catch {
    return [];
  }
}

export async function fetchActiveSweep(): Promise<SweepRun | null> {
  if (!supabaseConfigured) return null;
  try {
    const { data } = await supabase
      .from("kronos_sweep_runs")
      .select("*")
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as SweepRun | null) ?? null;
  } catch {
    return null;
  }
}

export async function fetchExperiments(): Promise<Experiment[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_experiments")
      .select("*")
      .order("rank", { ascending: true });
    return (data as Experiment[]) ?? [];
  } catch {
    return [];
  }
}

export async function fetchActiveModel(): Promise<ModelInfo | null> {
  if (!supabaseConfigured) return null;
  try {
    const { data } = await supabase
      .from("model_registry")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();
    return (data as ModelInfo | null) ?? null;
  } catch {
    return null;
  }
}

export function getSkillRadar() {
  return mockRadar;
}

export function getWeeklyImprovements() {
  return mockImprovements;
}

/* ─── Microstructure / volatility regime (tick-derived) ─── */

export interface MicrostructureHourly {
  time: string;
  avg_price: number;
  avg_obi: number;
  avg_cvd_5m: number;
  avg_taker_buy_ratio: number;
  avg_futures_premium_bps: number;
  avg_volume_spike: number;
  avg_trade_intensity: number;
}

export interface VolatilityRegime {
  time: string;
  avg_vol: number;
  avg_hurst: number;
  avg_predictability: number;
  avg_regime_pc1: number;
}

export interface DataFreshness {
  source: string;
  total_rows: number;
  latest_data: string;
  hours_stale: number;
}

/**
 * Microstructure + volatility regime reads were originally wired to
 * Grafana views that depended on a legacy market_microstructure table.
 * Bot v1.1.0 writes tick-level data to `market_pulse` only; the
 * grafana-shaped views have not been re-created in the new schema.
 * These readers return empty so dashboards degrade gracefully to empty
 * states rather than to inflated mocks.
 *
 * TODO: once the dbt marts (int_market_pulse_1m, agg_range_prediction_accuracy)
 * are applied to Supabase, point these at those tables.
 */
export async function fetchMicrostructureHourly(): Promise<MicrostructureHourly[]> {
  return [];
}

export async function fetchVolatilityRegime(): Promise<VolatilityRegime[]> {
  return [];
}

/* ─── New paper-mode-backed fetchers for /trading /risk /model /analysis ─── */

export interface DailyPnlPoint {
  date: string; // YYYY-MM-DD (UTC)
  pnl_usd: number;
}

export interface WeeklyPnlPoint {
  week: string; // ISO-week key: YYYY-Www
  pnl_usd: number;
}

export interface HourlyPerformance {
  hour: number; // 0..23
  avgPnlBps: number;
  trades: number;
}

export interface TradeDurationBucket {
  range: string;
  count: number;
  avgPnlBps: number;
}

export interface StreakSummary {
  currentStreak: { type: "win" | "loss" | "none"; length: number };
  longestWinStreak: number;
  longestLossStreak: number;
  streakHistory: { type: "win" | "loss"; length: number }[];
}

export interface PredictionAccuracyRow {
  timestamp: string;
  predicted_range_bps: number;
  observed_range_bps: number | null;
  range_error_bps: number | null;
  high_hit: boolean | null;
  low_hit: boolean | null;
  direction_correct: boolean | null;
  confidence: number;
}

export interface PredictionAccuracySummary {
  avgRangeErrorBps: number;
  highHitRate: number;
  lowHitRate: number;
  directionAccuracy: number;
  n: number;
}

export interface ConfidenceBucket {
  bucket: string;
  count: number;
}

export interface RegimeBreakdown {
  regime: string;
  predictions: number;
  trades: number;
  avgPnlBps: number;
}

export interface DecisionTraceRow {
  timestamp: string;
  decision_action: string;
  decision_reason: string;
  predicted_range_bps: number | null;
  confidence: number | null;
}

export interface DrawdownPoint {
  date: string; // YYYY-MM-DD
  equity: number;
  drawdownPct: number; // <= 0
}

export interface BtcPricePoint {
  t: string;
  price: number;
  realized_vol_10s: number | null;
}

export interface CircuitBreakerState {
  state: string;
  failure_count: number;
}

export interface TradeMetrics {
  profitFactor: number;
  expectancy: number; // bps
  payoffRatio: number;
  avgWin: number; // bps
  avgLoss: number; // bps (negative)
  largestWin: number; // bps
  largestLoss: number; // bps (negative)
  avgSlippage: number; // bps — not tracked yet, returns 0
  totalFees: number; // USD — not tracked yet, returns 0
  netAfterFees: number; // USD
  totalTrades: number;
}

/** ISO week key (YYYY-Www) for a given Date. Week starts on Monday, per ISO-8601. */
function isoWeekKey(d: Date): string {
  // Copy to avoid mutating input.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Daily PnL in USD, bucketed by exit_time day (UTC). Empty array when
 * no closed trades exist.
 */
export async function fetchDailyPnl(): Promise<DailyPnlPoint[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("exit_time, profit_usd")
      .not("exit_time", "is", null)
      .not("profit_usd", "is", null)
      .order("exit_time", { ascending: true })
      .limit(5000);

    const rows = (data ?? []) as { exit_time: string; profit_usd: number }[];
    if (rows.length === 0) return [];

    const byDay = new Map<string, number>();
    for (const r of rows) {
      const day = r.exit_time.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + r.profit_usd);
    }
    return Array.from(byDay.entries()).map(([date, pnl_usd]) => ({
      date,
      pnl_usd: Math.round(pnl_usd * 100) / 100,
    }));
  } catch {
    return [];
  }
}

/** Weekly PnL in USD, bucketed by ISO week. */
export async function fetchWeeklyPnl(): Promise<WeeklyPnlPoint[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("exit_time, profit_usd")
      .not("exit_time", "is", null)
      .not("profit_usd", "is", null)
      .order("exit_time", { ascending: true })
      .limit(5000);

    const rows = (data ?? []) as { exit_time: string; profit_usd: number }[];
    if (rows.length === 0) return [];

    const byWeek = new Map<string, number>();
    for (const r of rows) {
      const key = isoWeekKey(new Date(r.exit_time));
      byWeek.set(key, (byWeek.get(key) ?? 0) + r.profit_usd);
    }
    return Array.from(byWeek.entries()).map(([week, pnl_usd]) => ({
      week,
      pnl_usd: Math.round(pnl_usd * 100) / 100,
    }));
  } catch {
    return [];
  }
}

/**
 * Hourly performance: group by `hour_utc` on `kronos_paper_trades`.
 * Always returns 24 rows; missing hours fill with zeros so heatmaps stay
 * aligned.
 */
export async function fetchHourlyPerformance(): Promise<HourlyPerformance[]> {
  const empty: HourlyPerformance[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    avgPnlBps: 0,
    trades: 0,
  }));
  if (!supabaseConfigured) return empty;

  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("hour_utc, profit_bps, exit_time")
      .not("exit_time", "is", null)
      .limit(10_000);

    const rows = (data ?? []) as {
      hour_utc: number | null;
      profit_bps: number | null;
      exit_time: string | null;
    }[];
    if (rows.length === 0) return empty;

    const sums = new Array(24).fill(0);
    const counts = new Array(24).fill(0);
    for (const r of rows) {
      // Fall back to deriving from exit_time if hour_utc is absent (older rows).
      const h =
        r.hour_utc !== null && r.hour_utc !== undefined
          ? r.hour_utc
          : r.exit_time
            ? new Date(r.exit_time).getUTCHours()
            : null;
      if (h === null || h < 0 || h > 23) continue;
      sums[h] += r.profit_bps ?? 0;
      counts[h] += 1;
    }
    return empty.map((base, h) => ({
      hour: h,
      trades: counts[h],
      avgPnlBps: counts[h] > 0 ? Math.round((sums[h] / counts[h]) * 10) / 10 : 0,
    }));
  } catch {
    return empty;
  }
}

/** Trade-duration histogram (minutes). Fixed bucket labels per spec. */
export async function fetchTradeDurations(): Promise<TradeDurationBucket[]> {
  const buckets: TradeDurationBucket[] = [
    { range: "<5m", count: 0, avgPnlBps: 0 },
    { range: "5-15m", count: 0, avgPnlBps: 0 },
    { range: "15-30m", count: 0, avgPnlBps: 0 },
    { range: "30-60m", count: 0, avgPnlBps: 0 },
    { range: "1-4h", count: 0, avgPnlBps: 0 },
    { range: ">4h", count: 0, avgPnlBps: 0 },
  ];
  if (!supabaseConfigured) return buckets;

  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("duration_minutes, profit_bps")
      .not("exit_time", "is", null)
      .limit(10_000);

    const rows = (data ?? []) as {
      duration_minutes: number | null;
      profit_bps: number | null;
    }[];

    const idx = (m: number) => {
      if (m < 5) return 0;
      if (m < 15) return 1;
      if (m < 30) return 2;
      if (m < 60) return 3;
      if (m < 240) return 4;
      return 5;
    };
    const sums = new Array(6).fill(0);
    const counts = new Array(6).fill(0);
    for (const r of rows) {
      if (r.duration_minutes === null || r.duration_minutes === undefined) continue;
      const i = idx(r.duration_minutes);
      sums[i] += r.profit_bps ?? 0;
      counts[i] += 1;
    }
    return buckets.map((b, i) => ({
      range: b.range,
      count: counts[i],
      avgPnlBps: counts[i] > 0 ? Math.round((sums[i] / counts[i]) * 10) / 10 : 0,
    }));
  } catch {
    return buckets;
  }
}

/** Win/loss streaks computed from recent closed trades ordered by exit_time. */
export async function fetchTradeStreaks(): Promise<StreakSummary> {
  const empty: StreakSummary = {
    currentStreak: { type: "none", length: 0 },
    longestWinStreak: 0,
    longestLossStreak: 0,
    streakHistory: [],
  };
  if (!supabaseConfigured) return empty;

  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("exit_time, profit_usd")
      .not("exit_time", "is", null)
      .not("profit_usd", "is", null)
      .order("exit_time", { ascending: true })
      .limit(5000);

    const rows = (data ?? []) as { exit_time: string; profit_usd: number }[];
    if (rows.length === 0) return empty;

    const streaks: { type: "win" | "loss"; length: number }[] = [];
    let current: { type: "win" | "loss"; length: number } | null = null;
    for (const r of rows) {
      const t: "win" | "loss" = r.profit_usd >= 0 ? "win" : "loss";
      if (current && current.type === t) {
        current.length += 1;
      } else {
        if (current) streaks.push(current);
        current = { type: t, length: 1 };
      }
    }
    if (current) streaks.push(current);

    const longestWin = streaks
      .filter((s) => s.type === "win")
      .reduce((m, s) => Math.max(m, s.length), 0);
    const longestLoss = streaks
      .filter((s) => s.type === "loss")
      .reduce((m, s) => Math.max(m, s.length), 0);

    const last = streaks[streaks.length - 1];
    return {
      currentStreak: last
        ? { type: last.type, length: last.length }
        : { type: "none", length: 0 },
      longestWinStreak: longestWin,
      longestLossStreak: longestLoss,
      streakHistory: streaks.slice(-20),
    };
  } catch {
    return empty;
  }
}

/**
 * Chronos range-prediction accuracy rows + summary. Backed by the
 * `kronos_paper_prediction_accuracy` VIEW (paper-mode only; no live
 * twin yet). Drops rows where observed_high is null (not yet backfilled).
 */
export async function fetchPredictionAccuracy(limit: number = 500): Promise<{
  rows: PredictionAccuracyRow[];
  summary: PredictionAccuracySummary;
}> {
  const empty = {
    rows: [] as PredictionAccuracyRow[],
    summary: {
      avgRangeErrorBps: 0,
      highHitRate: 0,
      lowHitRate: 0,
      directionAccuracy: 0,
      n: 0,
    },
  };
  if (!supabaseConfigured) return empty;

  try {
    const { data } = await supabase
      .from("kronos_paper_prediction_accuracy")
      .select(
        "timestamp, predicted_range_bps, observed_range_bps, range_error_bps, high_hit, low_hit, direction_correct, confidence",
      )
      .not("observed_high", "is", null)
      .order("timestamp", { ascending: false })
      .limit(limit);

    const raw = (data ?? []) as PredictionAccuracyRow[];
    if (raw.length === 0) return empty;

    // Present rows ascending by time for chart display.
    const rows = [...raw].reverse();

    const n = rows.length;
    const errSum = rows.reduce(
      (s, r) => s + (r.range_error_bps ?? 0),
      0,
    );
    const highHits = rows.filter((r) => r.high_hit === true).length;
    const lowHits = rows.filter((r) => r.low_hit === true).length;
    const dirHits = rows.filter((r) => r.direction_correct === true).length;

    return {
      rows,
      summary: {
        avgRangeErrorBps: Math.round((errSum / n) * 10) / 10,
        highHitRate: Math.round((highHits / n) * 1000) / 10,
        lowHitRate: Math.round((lowHits / n) * 1000) / 10,
        directionAccuracy: Math.round((dirHits / n) * 1000) / 10,
        n,
      },
    };
  } catch {
    return empty;
  }
}

/** 10-percent buckets of `kronos_paper_predictions.confidence`. */
export async function fetchConfidenceDistribution(): Promise<ConfidenceBucket[]> {
  const labels = [
    "0-10%",
    "10-20%",
    "20-30%",
    "30-40%",
    "40-50%",
    "50-60%",
    "60-70%",
    "70-80%",
    "80-90%",
    "90-100%",
  ];
  const empty: ConfidenceBucket[] = labels.map((bucket) => ({ bucket, count: 0 }));
  if (!supabaseConfigured) return empty;

  try {
    const { data } = await supabase
      .from("kronos_paper_predictions")
      .select("confidence")
      .not("confidence", "is", null)
      .limit(10_000);

    const rows = (data ?? []) as { confidence: number }[];
    if (rows.length === 0) return empty;

    const counts = new Array(10).fill(0);
    for (const r of rows) {
      // Confidence stored as 0..1 float; tolerate 0..100 too.
      const c = r.confidence > 1 ? r.confidence / 100 : r.confidence;
      const i = Math.min(9, Math.max(0, Math.floor(c * 10)));
      counts[i] += 1;
    }
    return labels.map((bucket, i) => ({ bucket, count: counts[i] }));
  } catch {
    return empty;
  }
}

/** Regime breakdown: prediction counts + trade counts + avg PnL bps per regime. */
export async function fetchRegimeBreakdown(): Promise<RegimeBreakdown[]> {
  if (!supabaseConfigured) return [];
  try {
    const [predRes, tradeRes] = await Promise.all([
      supabase
        .from("kronos_paper_predictions")
        .select("regime")
        .limit(10_000),
      supabase
        .from("kronos_paper_trades")
        .select("regime, profit_bps")
        .not("exit_time", "is", null)
        .limit(10_000),
    ]);

    const preds = (predRes.data ?? []) as { regime: string | null }[];
    const trades = (tradeRes.data ?? []) as {
      regime: string | null;
      profit_bps: number | null;
    }[];

    const agg = new Map<
      string,
      { predictions: number; trades: number; bpsSum: number }
    >();
    for (const p of preds) {
      const key = p.regime ?? "unknown";
      const entry = agg.get(key) ?? { predictions: 0, trades: 0, bpsSum: 0 };
      entry.predictions += 1;
      agg.set(key, entry);
    }
    for (const t of trades) {
      const key = t.regime ?? "unknown";
      const entry = agg.get(key) ?? { predictions: 0, trades: 0, bpsSum: 0 };
      entry.trades += 1;
      entry.bpsSum += t.profit_bps ?? 0;
      agg.set(key, entry);
    }

    return Array.from(agg.entries())
      .map(([regime, v]) => ({
        regime,
        predictions: v.predictions,
        trades: v.trades,
        avgPnlBps:
          v.trades > 0 ? Math.round((v.bpsSum / v.trades) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.predictions - a.predictions);
  } catch {
    return [];
  }
}

/**
 * Most-recent decision trace from `kronos_paper_predictions`. Answers
 * "why did the bot hold?" at a glance.
 */
export async function fetchDecisionTrace(limit: number = 50): Promise<DecisionTraceRow[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_predictions")
      .select(
        "timestamp, decision_action, decision_reason, predicted_range_bps, confidence",
      )
      .order("timestamp", { ascending: false })
      .limit(limit);

    const rows = (data ?? []) as DecisionTraceRow[];
    return rows;
  } catch {
    return [];
  }
}

/**
 * Drawdown curve: cumulative PnL → running max → drawdown %.
 * Baseline is $10k; first point is the starting equity on day zero.
 */
export async function fetchDrawdownCurve(): Promise<DrawdownPoint[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("exit_time, profit_usd")
      .not("exit_time", "is", null)
      .not("profit_usd", "is", null)
      .order("exit_time", { ascending: true })
      .limit(5000);

    const rows = (data ?? []) as { exit_time: string; profit_usd: number }[];
    if (rows.length === 0) return [];

    const baseline = 10_000;
    const byDay = new Map<string, number>();
    for (const r of rows) {
      const day = r.exit_time.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + r.profit_usd);
    }

    let equity = baseline;
    let peak = baseline;
    const out: DrawdownPoint[] = [];
    for (const [date, pnl] of Array.from(byDay.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      equity += pnl;
      if (equity > peak) peak = equity;
      const drawdownPct =
        peak > 0 ? ((equity - peak) / peak) * 100 : 0;
      out.push({
        date,
        equity: Math.round(equity * 100) / 100,
        drawdownPct: Math.round(drawdownPct * 100) / 100,
      });
    }
    return out;
  } catch {
    return [];
  }
}

/** Recent `market_pulse` rows; ascending by time for chart display. */
export async function fetchBtcPriceChart(limit: number = 300): Promise<BtcPricePoint[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("market_pulse")
      .select("timestamp, price, realized_vol_10s")
      .order("timestamp", { ascending: false })
      .limit(limit);

    const rows = (data ?? []) as {
      timestamp: string;
      price: number;
      realized_vol_10s: number | null;
    }[];
    if (rows.length === 0) return [];

    return rows
      .slice()
      .reverse()
      .map((r) => ({
        t: r.timestamp,
        price: r.price,
        realized_vol_10s: r.realized_vol_10s,
      }));
  } catch {
    return [];
  }
}

/**
 * Parse `kronos_bot_status.circuit_breakers` jsonb (already an object).
 * Empty object when no row exists yet.
 */
export async function fetchCircuitBreakers(): Promise<Record<string, CircuitBreakerState>> {
  if (!supabaseConfigured) return {};
  try {
    const { data } = await supabase
      .from("kronos_bot_status")
      .select("circuit_breakers")
      .eq("id", 1)
      .maybeSingle();

    if (!data) return {};
    const raw = (data as { circuit_breakers: unknown }).circuit_breakers;
    if (!raw || typeof raw !== "object") return {};

    const out: Record<string, CircuitBreakerState> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v && typeof v === "object") {
        const rec = v as Record<string, unknown>;
        out[k] = {
          state: typeof rec.state === "string" ? rec.state : "unknown",
          failure_count:
            typeof rec.failure_count === "number" ? rec.failure_count : 0,
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Aggregated trade metrics for the /trading "key metrics" row. Computed
 * client-side from recent closed trades. Slippage + fees aren't tracked
 * yet — returned as 0 with honest empty UI.
 */
export async function fetchTradeMetrics(): Promise<TradeMetrics> {
  const empty: TradeMetrics = {
    profitFactor: 0,
    expectancy: 0,
    payoffRatio: 0,
    avgWin: 0,
    avgLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    avgSlippage: 0,
    totalFees: 0,
    netAfterFees: 0,
    totalTrades: 0,
  };
  if (!supabaseConfigured) return empty;

  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("profit_bps, profit_usd")
      .not("exit_time", "is", null)
      .limit(5000);

    const rows = (data ?? []) as {
      profit_bps: number | null;
      profit_usd: number | null;
    }[];
    if (rows.length === 0) return empty;

    const winners = rows.filter((r) => (r.profit_usd ?? 0) > 0);
    const losers = rows.filter((r) => (r.profit_usd ?? 0) < 0);

    const grossProfitUsd = winners.reduce((s, r) => s + (r.profit_usd ?? 0), 0);
    const grossLossUsd = Math.abs(losers.reduce((s, r) => s + (r.profit_usd ?? 0), 0));
    const profitFactor = grossLossUsd > 0 ? grossProfitUsd / grossLossUsd : 0;

    const expectancy =
      rows.reduce((s, r) => s + (r.profit_bps ?? 0), 0) / rows.length;

    const avgWin = winners.length
      ? winners.reduce((s, r) => s + (r.profit_bps ?? 0), 0) / winners.length
      : 0;
    const avgLoss = losers.length
      ? losers.reduce((s, r) => s + (r.profit_bps ?? 0), 0) / losers.length
      : 0;
    const payoffRatio = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0;

    const largestWin = winners.length
      ? Math.max(...winners.map((r) => r.profit_bps ?? 0))
      : 0;
    const largestLoss = losers.length
      ? Math.min(...losers.map((r) => r.profit_bps ?? 0))
      : 0;

    const netAfterFees = rows.reduce((s, r) => s + (r.profit_usd ?? 0), 0);

    return {
      profitFactor: Math.round(profitFactor * 100) / 100,
      expectancy: Math.round(expectancy * 10) / 10,
      payoffRatio: Math.round(payoffRatio * 100) / 100,
      avgWin: Math.round(avgWin * 10) / 10,
      avgLoss: Math.round(avgLoss * 10) / 10,
      largestWin: Math.round(largestWin * 10) / 10,
      largestLoss: Math.round(largestLoss * 10) / 10,
      avgSlippage: 0,
      totalFees: 0,
      netAfterFees: Math.round(netAfterFees * 100) / 100,
      totalTrades: rows.length,
    };
  } catch {
    return empty;
  }
}

/* ─── Tier-2 fetchers + ModelVotes + resolution helper ─── */

/**
 * Resolution shifting a la TradingView: ≤24h queries the raw paper
 * prediction view; 24h–7d queries the hourly rollup; >7d queries the
 * daily rollup. Returns the table name + the column where the bucket
 * timestamp lives (base table uses `timestamp`, rollups use `bucket_ts`).
 * Rollups are maintained by pg_cron (see migration 20260419010000).
 */
export type Resolution =
  | { table: "kronos_paper_predictions"; bucketField: "timestamp" }
  | { table: "kronos_paper_predictions_hourly"; bucketField: "bucket_ts" }
  | { table: "kronos_paper_predictions_daily"; bucketField: "bucket_ts" };

export function selectResolution(lookbackHours: number): Resolution {
  if (lookbackHours <= 24) {
    return { table: "kronos_paper_predictions", bucketField: "timestamp" };
  }
  if (lookbackHours <= 7 * 24) {
    return {
      table: "kronos_paper_predictions_hourly",
      bucketField: "bucket_ts",
    };
  }
  return {
    table: "kronos_paper_predictions_daily",
    bucketField: "bucket_ts",
  };
}

/* ── Types for the new card fetchers. ── */

export interface HoldReasonCount {
  reason: string;
  count: number;
}

export interface RangeWidthBucket {
  bucket: string;
  count: number;
}

export interface DirectionBiasCount {
  bias: string;
  count: number;
}

export interface HeatmapCell {
  session?: string;
  regime?: string;
  action: string;
  count: number;
}

export interface SessionDecisionCell {
  session: string;
  action: string;
  count: number;
}

export interface RegimeDecisionCell {
  regime: string;
  action: string;
  count: number;
}

export interface PredictedVsActualPoint {
  t: string;
  predicted_high: number;
  predicted_low: number;
  current_price: number;
  observed_high: number | null;
  observed_low: number | null;
}

export interface ConfidencePoint {
  t: string;
  avg_confidence: number;
}

export interface AccuracyScatterPoint {
  confidence: number;
  range_error_bps: number;
  high_hit: boolean | null;
}

export interface AccuracyByRegime {
  regime: string;
  avg_range_error: number;
  hit_rate: number;
  sample_count: number;
}

export interface HighLowHitPoint {
  t: string;
  high_hit: boolean | null;
  low_hit: boolean | null;
}

export interface VolatilityPoint {
  t: string;
  vol_10s: number;
  vol_60s: number;
}

export interface SpreadEvent {
  t: string;
  spread_bps: number;
  price: number;
}

export interface ExitReasonBucket {
  reason: string;
  count: number;
  total_pnl_usd: number;
}

export interface SignalOutcomeRow {
  trade_id: string;
  signal_time: string;
  signal_confidence: number;
  exit_reason: string | null;
  profit_usd: number | null;
  profit_bps: number | null;
}

export interface LatestModelVotes {
  timestamp: string;
  model_votes: ModelVotes | null;
  decision_action: string;
  decision_reason: string;
}

/** 1. Hold-reason donut: top reasons the bot stayed in hold. */
export async function fetchHoldReasonBreakdown(): Promise<HoldReasonCount[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_predictions")
      .select("decision_reason, decision_action")
      .eq("decision_action", "hold")
      .order("timestamp", { ascending: false })
      .limit(1000);

    const rows = (data ?? []) as {
      decision_reason: string | null;
      decision_action: string | null;
    }[];
    if (rows.length === 0) return [];

    const counts = new Map<string, number>();
    for (const r of rows) {
      const reason = r.decision_reason ?? "unknown";
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

/**
 * 2. Range-width histogram: bucket `predicted_range_bps` into 5 bands.
 * The bands are calibrated to typical BTC 5-min ranges (tight <20bps,
 * very wide >200bps).
 */
export async function fetchRangeWidthHistogram(): Promise<RangeWidthBucket[]> {
  const buckets: RangeWidthBucket[] = [
    { bucket: "<20", count: 0 },
    { bucket: "20-50", count: 0 },
    { bucket: "50-100", count: 0 },
    { bucket: "100-200", count: 0 },
    { bucket: ">200", count: 0 },
  ];
  if (!supabaseConfigured) return buckets;
  try {
    const { data } = await supabase
      .from("kronos_paper_predictions")
      .select("predicted_range_bps")
      .not("predicted_range_bps", "is", null)
      .order("timestamp", { ascending: false })
      .limit(1000);

    const rows = (data ?? []) as { predicted_range_bps: number | null }[];
    if (rows.length === 0) return buckets;

    for (const r of rows) {
      const v = r.predicted_range_bps ?? 0;
      if (v < 20) buckets[0].count += 1;
      else if (v < 50) buckets[1].count += 1;
      else if (v < 100) buckets[2].count += 1;
      else if (v < 200) buckets[3].count += 1;
      else buckets[4].count += 1;
    }
    return buckets;
  } catch {
    return buckets;
  }
}

/** 3. Direction-bias counts: how often Chronos predicts up/down/null. */
export async function fetchDirectionBiasCounts(): Promise<DirectionBiasCount[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_predictions")
      .select("direction_bias")
      .order("timestamp", { ascending: false })
      .limit(1000);

    const rows = (data ?? []) as { direction_bias: string | null }[];
    if (rows.length === 0) return [];

    const counts = new Map<string, number>();
    for (const r of rows) {
      const bias = r.direction_bias ?? "null";
      counts.set(bias, (counts.get(bias) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([bias, count]) => ({ bias, count }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

/** 4. Session × decision cross-tab — which sessions the bot acts in. */
export async function fetchSessionDecisionHeatmap(): Promise<
  SessionDecisionCell[]
> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_predictions")
      .select("session, decision_action")
      .order("timestamp", { ascending: false })
      .limit(2000);

    const rows = (data ?? []) as {
      session: string | null;
      decision_action: string | null;
    }[];
    if (rows.length === 0) return [];

    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = `${r.session ?? "unknown"}||${r.decision_action ?? "unknown"}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([key, count]) => {
      const [session, action] = key.split("||");
      return { session, action, count };
    });
  } catch {
    return [];
  }
}

/** 5. Regime × decision cross-tab — which regimes the bot trades in. */
export async function fetchRegimeDecisionHeatmap(): Promise<
  RegimeDecisionCell[]
> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_predictions")
      .select("regime, decision_action")
      .order("timestamp", { ascending: false })
      .limit(2000);

    const rows = (data ?? []) as {
      regime: string | null;
      decision_action: string | null;
    }[];
    if (rows.length === 0) return [];

    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = `${r.regime ?? "unknown"}||${r.decision_action ?? "unknown"}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([key, count]) => {
      const [regime, action] = key.split("||");
      return { regime, action, count };
    });
  } catch {
    return [];
  }
}

/**
 * 6. Predicted-vs-actual bands — pair each prediction with the observed
 * high/low so the chart can draw the predicted ribbon and the actual
 * extremes as overlay lines. Uses the accuracy view which already joins
 * observed data from market_pulse.
 */
export async function fetchPredictedVsActualBands(
  limit: number = 100,
): Promise<PredictedVsActualPoint[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_prediction_accuracy")
      .select(
        "timestamp, predicted_high, predicted_low, current_price, observed_high, observed_low",
      )
      .order("timestamp", { ascending: false })
      .limit(limit);

    const rows = (data ?? []) as {
      timestamp: string;
      predicted_high: number | null;
      predicted_low: number | null;
      current_price: number | null;
      observed_high: number | null;
      observed_low: number | null;
    }[];
    if (rows.length === 0) return [];

    return rows
      .slice()
      .reverse()
      .map((r) => ({
        t: r.timestamp,
        predicted_high: r.predicted_high ?? 0,
        predicted_low: r.predicted_low ?? 0,
        current_price: r.current_price ?? 0,
        observed_high: r.observed_high,
        observed_low: r.observed_low,
      }));
  } catch {
    return [];
  }
}

/**
 * 7. Confidence over time. Uses `selectResolution` — raw table for ≤24h,
 * hourly rollup for ≤7d, daily rollup thereafter. The rollup tables
 * already hold an avg_confidence column (see pg_cron migration). The
 * raw table falls back to client-side hourly bucketing.
 */
export async function fetchConfidenceOverTime(
  lookbackHours: number = 168,
): Promise<ConfidencePoint[]> {
  if (!supabaseConfigured) return [];
  try {
    const res = selectResolution(lookbackHours);
    const since = new Date(Date.now() - lookbackHours * 3600 * 1000).toISOString();

    if (res.table === "kronos_paper_predictions") {
      const { data } = await supabase
        .from(res.table)
        .select("timestamp, confidence")
        .not("confidence", "is", null)
        .gte("timestamp", since)
        .order("timestamp", { ascending: true })
        .limit(5000);

      const rows = (data ?? []) as {
        timestamp: string;
        confidence: number | null;
      }[];
      if (rows.length === 0) return [];

      // Bucket into hours client-side.
      const byHour = new Map<string, { sum: number; count: number }>();
      for (const r of rows) {
        const hourKey = r.timestamp.slice(0, 13); // YYYY-MM-DDTHH
        const entry = byHour.get(hourKey) ?? { sum: 0, count: 0 };
        entry.sum += r.confidence ?? 0;
        entry.count += 1;
        byHour.set(hourKey, entry);
      }
      return Array.from(byHour.entries()).map(([hourKey, v]) => ({
        t: `${hourKey}:00:00Z`,
        avg_confidence: v.count > 0 ? v.sum / v.count : 0,
      }));
    }

    // Rollup tables — already pre-aggregated.
    const { data } = await supabase
      .from(res.table)
      .select(`${res.bucketField}, avg_confidence`)
      .gte(res.bucketField, since)
      .order(res.bucketField, { ascending: true })
      .limit(5000);

    const rows = (data ?? []) as Record<string, unknown>[];
    if (rows.length === 0) return [];

    return rows.map((r) => ({
      t: String(r[res.bucketField] ?? ""),
      avg_confidence:
        typeof r.avg_confidence === "number" ? r.avg_confidence : 0,
    }));
  } catch {
    return [];
  }
}

/** 8. Accuracy scatter — confidence vs range_error_bps, colored by high_hit. */
export async function fetchAccuracyScatter(): Promise<AccuracyScatterPoint[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_prediction_accuracy")
      .select("confidence, range_error_bps, high_hit")
      .not("range_error_bps", "is", null)
      .not("confidence", "is", null)
      .order("timestamp", { ascending: false })
      .limit(1000);

    const rows = (data ?? []) as {
      confidence: number | null;
      range_error_bps: number | null;
      high_hit: boolean | null;
    }[];
    if (rows.length === 0) return [];

    return rows.map((r) => ({
      confidence: r.confidence ?? 0,
      range_error_bps: r.range_error_bps ?? 0,
      high_hit: r.high_hit,
    }));
  } catch {
    return [];
  }
}

/** 9. Accuracy aggregated by regime — "how does Chronos do per regime". */
export async function fetchAccuracyByRegime(): Promise<AccuracyByRegime[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_prediction_accuracy")
      .select("regime, range_error_bps, high_hit, low_hit")
      .not("range_error_bps", "is", null)
      .order("timestamp", { ascending: false })
      .limit(2000);

    const rows = (data ?? []) as {
      regime: string | null;
      range_error_bps: number | null;
      high_hit: boolean | null;
      low_hit: boolean | null;
    }[];
    if (rows.length === 0) return [];

    const agg = new Map<
      string,
      { errSum: number; hits: number; evaluable: number; n: number }
    >();
    for (const r of rows) {
      const key = r.regime ?? "unknown";
      const entry = agg.get(key) ?? {
        errSum: 0,
        hits: 0,
        evaluable: 0,
        n: 0,
      };
      entry.errSum += r.range_error_bps ?? 0;
      entry.n += 1;
      // A "hit" = either high_hit OR low_hit was true. Evaluable = either
      // was not null.
      if (r.high_hit !== null || r.low_hit !== null) {
        entry.evaluable += 1;
        if (r.high_hit === true || r.low_hit === true) entry.hits += 1;
      }
      agg.set(key, entry);
    }

    return Array.from(agg.entries())
      .map(([regime, v]) => ({
        regime,
        avg_range_error:
          v.n > 0 ? Math.round((v.errSum / v.n) * 10) / 10 : 0,
        hit_rate:
          v.evaluable > 0
            ? Math.round((v.hits / v.evaluable) * 1000) / 10
            : 0,
        sample_count: v.n,
      }))
      .sort((a, b) => b.sample_count - a.sample_count);
  } catch {
    return [];
  }
}

/** 10. High/low hit timeline — recent cycles' hit/miss status per side. */
export async function fetchHighLowHitTimeline(
  limit: number = 100,
): Promise<HighLowHitPoint[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_prediction_accuracy")
      .select("timestamp, high_hit, low_hit")
      .order("timestamp", { ascending: false })
      .limit(limit);

    const rows = (data ?? []) as {
      timestamp: string;
      high_hit: boolean | null;
      low_hit: boolean | null;
    }[];
    if (rows.length === 0) return [];

    return rows
      .slice()
      .reverse()
      .map((r) => ({
        t: r.timestamp,
        high_hit: r.high_hit,
        low_hit: r.low_hit,
      }));
  } catch {
    return [];
  }
}

/**
 * 11. Volatility timeline — realized_vol_10s + realized_vol_60s from
 * market_pulse, ascending for chart display.
 */
export async function fetchVolatilityTimeline(
  limit: number = 300,
): Promise<VolatilityPoint[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("market_pulse")
      .select("timestamp, realized_vol_10s, realized_vol_60s")
      .order("timestamp", { ascending: false })
      .limit(limit);

    const rows = (data ?? []) as {
      timestamp: string;
      realized_vol_10s: number | null;
      realized_vol_60s: number | null;
    }[];
    if (rows.length === 0) return [];

    return rows
      .slice()
      .reverse()
      .map((r) => ({
        t: r.timestamp,
        vol_10s: r.realized_vol_10s ?? 0,
        vol_60s: r.realized_vol_60s ?? 0,
      }));
  } catch {
    return [];
  }
}

/**
 * 12. Spread-widening events — rows from market_pulse where the
 * bid/ask spread (bps) exceeded a configurable threshold. Useful for
 * flagging liquidity gaps that may have invalidated entry decisions.
 */
export async function fetchSpreadEvents(
  thresholdBps: number = 5,
): Promise<SpreadEvent[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("market_pulse")
      .select("timestamp, spread_bps, price")
      .not("spread_bps", "is", null)
      .gte("spread_bps", thresholdBps)
      .order("timestamp", { ascending: false })
      .limit(200);

    const rows = (data ?? []) as {
      timestamp: string;
      spread_bps: number | null;
      price: number | null;
    }[];
    if (rows.length === 0) return [];

    return rows.map((r) => ({
      t: r.timestamp,
      spread_bps: r.spread_bps ?? 0,
      price: r.price ?? 0,
    }));
  } catch {
    return [];
  }
}

/** 13. Exit-reason breakdown — count + summed PnL per exit reason. */
export async function fetchExitReasonBreakdown(): Promise<ExitReasonBucket[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from("kronos_paper_trades")
      .select("exit_reason, profit_usd")
      .not("exit_time", "is", null)
      .limit(5000);

    const rows = (data ?? []) as {
      exit_reason: string | null;
      profit_usd: number | null;
    }[];
    if (rows.length === 0) return [];

    const agg = new Map<string, { count: number; pnl: number }>();
    for (const r of rows) {
      const key = r.exit_reason ?? "unknown";
      const entry = agg.get(key) ?? { count: 0, pnl: 0 };
      entry.count += 1;
      entry.pnl += r.profit_usd ?? 0;
      agg.set(key, entry);
    }
    return Array.from(agg.entries())
      .map(([reason, v]) => ({
        reason,
        count: v.count,
        total_pnl_usd: Math.round(v.pnl * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

/**
 * 14. Signal-outcome audit — joins kronos_paper_signals → kronos_paper_trades
 * by trade_id. For each recent signal, show the eventual outcome.
 * Supabase doesn't support server-side joins across base tables via the
 * JS client without an RPC or view, so we do it client-side by pulling
 * signals and their matching trades in two queries.
 */
export async function fetchSignalOutcomeAudit(
  limit: number = 50,
): Promise<SignalOutcomeRow[]> {
  if (!supabaseConfigured) return [];
  try {
    const { data: sigData } = await supabase
      .from("kronos_paper_signals")
      .select("trade_id, timestamp, confidence")
      .order("timestamp", { ascending: false })
      .limit(limit);

    const signals = (sigData ?? []) as {
      trade_id: string | null;
      timestamp: string;
      confidence: number | null;
    }[];
    if (signals.length === 0) return [];

    const tradeIds = signals
      .map((s) => s.trade_id)
      .filter((id): id is string => id !== null && id !== undefined);

    let trades: {
      id: string;
      exit_reason: string | null;
      profit_usd: number | null;
      profit_bps: number | null;
    }[] = [];

    if (tradeIds.length > 0) {
      const { data: tradeData } = await supabase
        .from("kronos_paper_trades")
        .select("id, exit_reason, profit_usd, profit_bps")
        .in("id", tradeIds);
      trades = (tradeData ?? []) as typeof trades;
    }

    const byId = new Map<
      string,
      {
        exit_reason: string | null;
        profit_usd: number | null;
        profit_bps: number | null;
      }
    >();
    for (const t of trades) {
      byId.set(t.id, {
        exit_reason: t.exit_reason,
        profit_usd: t.profit_usd,
        profit_bps: t.profit_bps,
      });
    }

    return signals.map((s) => {
      const match = s.trade_id ? byId.get(s.trade_id) : undefined;
      return {
        trade_id: s.trade_id ?? "",
        signal_time: s.timestamp,
        signal_confidence: s.confidence ?? 0,
        exit_reason: match?.exit_reason ?? null,
        profit_usd: match?.profit_usd ?? null,
        profit_bps: match?.profit_bps ?? null,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Most-recent cycle with full model_votes jsonb + decision trace —
 * feeds the Model Chorus card on /. Null-safe: if the row's
 * model_votes is null (pre-Track B backfill rows), the card renders
 * a "waiting for next cycle" empty state.
 */
export async function fetchLatestModelVotes(): Promise<LatestModelVotes> {
  const empty: LatestModelVotes = {
    timestamp: "",
    model_votes: null,
    decision_action: "",
    decision_reason: "",
  };
  if (!supabaseConfigured) return empty;

  try {
    const { data } = await supabase
      .from("kronos_paper_predictions")
      .select("timestamp, model_votes, decision_action, decision_reason")
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return empty;
    const row = data as {
      timestamp: string;
      model_votes: ModelVotes | null;
      decision_action: string | null;
      decision_reason: string | null;
    };
    return {
      timestamp: row.timestamp,
      model_votes: row.model_votes ?? null,
      decision_action: row.decision_action ?? "",
      decision_reason: row.decision_reason ?? "",
    };
  } catch {
    return empty;
  }
}

export async function fetchDataFreshness(): Promise<DataFreshness[]> {
  if (!supabaseConfigured) return [];

  try {
    // Best-effort aliveness check against the current raw tables.
    // Each source: row count + newest timestamp.
    const sources: { table: string; tsCol: string }[] = [
      { table: "kronos_bot_status", tsCol: "timestamp" },
      { table: "kronos_trades", tsCol: "entry_time" },
      { table: "kronos_signals", tsCol: "timestamp" },
      { table: "kronos_predictions", tsCol: "timestamp" },
      { table: "market_pulse", tsCol: "timestamp" },
    ];

    const results = await Promise.all(
      sources.map(async ({ table, tsCol }) => {
        const { data, count } = await supabase
          .from(table)
          .select(tsCol, { count: "exact", head: false })
          .order(tsCol, { ascending: false })
          .limit(1);
        const rows = (data ?? []) as unknown as Record<string, unknown>[];
        const latest = (rows[0]?.[tsCol] as string | undefined) ?? null;
        const hoursStale = latest
          ? (Date.now() - new Date(latest).getTime()) / 3_600_000
          : 99999;
        return {
          source: table,
          total_rows: count ?? 0,
          latest_data: latest ?? "—",
          hours_stale: Math.round(hoursStale * 10) / 10,
        } satisfies DataFreshness;
      }),
    );
    return results;
  } catch {
    return [];
  }
}
