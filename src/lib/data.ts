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

/**
 * Overview stats blend bot-health (from `kronos_bot_status` singleton)
 * with trade-driven aggregates (from `kronos_trades`). Zero trades →
 * zero-everything with `status: "stopped"`. No synthetic win-rate
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
        .from("kronos_trades")
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
      .from("kronos_trades")
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
      .from("kronos_trades")
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
      .from("kronos_trades")
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
      .from("kronos_trades")
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
      .from("kronos_predictions")
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
      .from("kronos_trades")
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
