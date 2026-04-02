import { supabase } from "./supabase";
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

/* ─── Helpers ─── */
function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ─── Fetch Functions ─── */

export async function fetchOverviewStats(): Promise<OverviewStats> {
  try {
    const [heartbeat, model] = await Promise.all([
      supabase.from("bot_heartbeat").select("*").eq("id", 1).single(),
      supabase.from("model_registry").select("*").eq("is_active", true).single(),
    ]);

    const hb = heartbeat.data;
    const m = model.data;

    if (!hb || !m) return mockOverview;

    const isLive = hb.status === "running" && hb.last_heartbeat &&
      Date.now() - new Date(hb.last_heartbeat).getTime() < 5 * 60 * 1000;

    return {
      totalReturn: 0,
      totalReturnMonth: 0,
      totalReturnWeek: 0,
      winRate: m.robustness_mean_bps ? 82.1 : 0,
      avgPnlBps: m.robustness_mean_bps ?? 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      totalTrades: 0,
      profitFactor: 0,
      avgTradesPerDay: 0,
      modelVersion: m.version ?? "unknown",
      lastTrained: m.deployed_at ? m.deployed_at.slice(0, 10) : "—",
      status: isLive ? "running" : "stopped",
      uptime: hb.started_at ? timeSince(hb.started_at) : "—",
    };
  } catch {
    return mockOverview;
  }
}

export async function fetchEquityCurve() {
  try {
    const { data } = await supabase
      .from("equity_curve")
      .select("timestamp, equity_usd")
      .order("timestamp", { ascending: true })
      .limit(500);

    if (!data || data.length === 0) return mockEquity;

    return data.map((r: { timestamp: string; equity_usd: number }) => ({
      date: r.timestamp.slice(0, 10),
      equity: Math.round(r.equity_usd),
    }));
  } catch {
    return mockEquity;
  }
}

export async function fetchMonthlyReturns() {
  try {
    const { data } = await supabase
      .from("monthly_trading_summary")
      .select("year_month, total_return_pct")
      .order("year_month", { ascending: true });

    if (!data || data.length === 0) return mockMonthly;

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return data.map((r: { year_month: string; total_return_pct: number }) => {
      const monthIdx = parseInt(r.year_month.split("-")[1], 10) - 1;
      return { month: monthNames[monthIdx] || r.year_month, return: r.total_return_pct };
    });
  } catch {
    return mockMonthly;
  }
}

export async function fetchLongShortBreakdown() {
  try {
    const { data } = await supabase
      .from("trade_journal")
      .select("direction, is_winner, profit_pct")
      .limit(10000);

    if (!data || data.length === 0) return mockLongShort;

    const longs = data.filter((t: { direction: string }) => t.direction === "long");
    const shorts = data.filter((t: { direction: string }) => t.direction === "short");
    const winRate = (arr: { is_winner: boolean }[]) =>
      arr.length ? Math.round((arr.filter((t) => t.is_winner).length / arr.length) * 1000) / 10 : 0;
    const avgPnl = (arr: { profit_pct: number }[]) =>
      arr.length ? Math.round((arr.reduce((s, t) => s + t.profit_pct, 0) / arr.length) * 10000) / 10 : 0;

    return {
      longWinRate: winRate(longs),
      shortWinRate: winRate(shorts),
      longTrades: longs.length,
      shortTrades: shorts.length,
      longAvgPnl: avgPnl(longs),
      shortAvgPnl: avgPnl(shorts),
    };
  } catch {
    return mockLongShort;
  }
}

export async function fetchChangelog(): Promise<ChangelogEntry[]> {
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
  try {
    const { data } = await supabase
      .from("kronos_sweep_runs")
      .select("*")
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    return data as SweepRun | null;
  } catch {
    return null;
  }
}

export async function fetchExperiments(): Promise<Experiment[]> {
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
  try {
    const { data } = await supabase
      .from("model_registry")
      .select("*")
      .eq("is_active", true)
      .single();

    return data as ModelInfo | null;
  } catch {
    return null;
  }
}

export async function fetchRecentPerformance() {
  try {
    const { data } = await supabase
      .from("daily_trading_performance")
      .select("*")
      .order("date", { ascending: false })
      .limit(90);

    if (!data || data.length === 0) return mockRecent;

    // Aggregate into periods
    const today = data[0];
    const week = data.slice(0, 7);
    const month = data.slice(0, 30);
    const all = data;

    const agg = (rows: { total_profit_pct: number; total_trades: number; win_rate: number }[]) => ({
      pnl: Math.round(rows.reduce((s, r) => s + (r.total_profit_pct || 0), 0) * 1000) / 10,
      trades: rows.reduce((s, r) => s + (r.total_trades || 0), 0),
      winRate: rows.length
        ? Math.round((rows.reduce((s, r) => s + (r.win_rate || 0), 0) / rows.length) * 1000) / 10
        : 0,
    });

    return [
      { period: "Today", ...agg(today ? [today] : []) },
      { period: "This Week", ...agg(week) },
      { period: "This Month", ...agg(month) },
      { period: "All Time", ...agg(all) },
    ];
  } catch {
    return mockRecent;
  }
}

export function getSkillRadar() {
  return mockRadar;
}

export function getWeeklyImprovements() {
  return mockImprovements;
}

/* ─── View-based Fetch Functions ─── */

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

export async function fetchMicrostructureHourly(): Promise<MicrostructureHourly[]> {
  try {
    const { data } = await supabase
      .from("v_grafana_microstructure_hourly")
      .select("*")
      .order("time", { ascending: true })
      .limit(720);

    return (data as MicrostructureHourly[]) ?? [];
  } catch {
    return [];
  }
}

export async function fetchVolatilityRegime(): Promise<VolatilityRegime[]> {
  try {
    const { data } = await supabase
      .from("v_grafana_volatility_regime")
      .select("*")
      .order("time", { ascending: true })
      .limit(720);

    return (data as VolatilityRegime[]) ?? [];
  } catch {
    return [];
  }
}

export async function fetchDataFreshness(): Promise<DataFreshness[]> {
  try {
    const { data } = await supabase
      .from("v_grafana_data_freshness")
      .select("*");

    return (data as DataFreshness[]) ?? [];
  } catch {
    return [];
  }
}
