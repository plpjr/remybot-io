"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import {
  fetchOverviewStats,
  fetchEquityCurve,
  fetchMonthlyReturns,
  fetchLongShortBreakdown,
  fetchChangelog,
  fetchActiveSweep,
  fetchExperiments,
  fetchActiveModel,
  fetchRecentPerformance,
  fetchMicrostructureHourly,
  fetchVolatilityRegime,
  fetchDataFreshness,
  getSkillRadar,
  getWeeklyImprovements,
  type OverviewStats,
  type SweepRun,
  type Experiment,
  type ModelInfo,
  type ChangelogEntry,
  type MicrostructureHourly,
  type VolatilityRegime,
  type DataFreshness,
} from "./data";
import {
  overviewStats as mockOverview,
  equityCurve as mockEquity,
  monthlyReturns as mockMonthly,
  longShortBreakdown as mockLongShort,
  recentPerformance as mockRecent,
} from "./mock-data";

export interface KronosData {
  overview: OverviewStats;
  equityCurve: { date: string; equity: number }[];
  monthlyReturns: { month: string; return: number }[];
  longShortBreakdown: {
    longWinRate: number;
    shortWinRate: number;
    longTrades: number;
    shortTrades: number;
    longAvgPnl: number;
    shortAvgPnl: number;
  };
  recentPerformance: { period: string; pnl: number; trades: number; winRate: number }[];
  skillRadar: { skill: string; current: number; previous: number }[];
  weeklyImprovements: {
    week: number;
    date: string;
    summary: string;
    details: string[];
    metrics: Record<string, string>;
  }[];
  activeSweep: SweepRun | null;
  experiments: Experiment[];
  activeModel: ModelInfo | null;
  changelog: ChangelogEntry[];
  microstructureHourly: MicrostructureHourly[];
  volatilityRegime: VolatilityRegime[];
  dataFreshness: DataFreshness[];
}

export function useKronosData() {
  const [data, setData] = useState<KronosData>({
    overview: mockOverview,
    equityCurve: mockEquity,
    monthlyReturns: mockMonthly,
    longShortBreakdown: mockLongShort,
    recentPerformance: mockRecent,
    skillRadar: getSkillRadar(),
    weeklyImprovements: getWeeklyImprovements(),
    activeSweep: null,
    experiments: [],
    activeModel: null,
    changelog: [],
    microstructureHourly: [],
    volatilityRegime: [],
    dataFreshness: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [
        overview,
        equityCurve,
        monthlyReturns,
        longShortBreakdown,
        recentPerformance,
        activeSweep,
        experiments,
        activeModel,
        changelog,
        microstructureHourly,
        volatilityRegime,
        dataFreshness,
      ] = await Promise.all([
        fetchOverviewStats(),
        fetchEquityCurve(),
        fetchMonthlyReturns(),
        fetchLongShortBreakdown(),
        fetchRecentPerformance(),
        fetchActiveSweep(),
        fetchExperiments(),
        fetchActiveModel(),
        fetchChangelog(),
        fetchMicrostructureHourly(),
        fetchVolatilityRegime(),
        fetchDataFreshness(),
      ]);

      setData({
        overview,
        equityCurve,
        monthlyReturns,
        longShortBreakdown,
        recentPerformance,
        skillRadar: getSkillRadar(),
        weeklyImprovements: getWeeklyImprovements(),
        activeSweep,
        experiments,
        activeModel,
        changelog,
        microstructureHourly,
        volatilityRegime,
        dataFreshness,
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // 60s polling fallback
    const interval = setInterval(refresh, 60_000);

    // Supabase Realtime subscriptions against the current bot schema.
    // See freqtrade-bot/trading/trade_logger.py for the writer side.
    const channel = supabase
      .channel("kronos-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kronos_trades" },
        () => { refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kronos_signals" },
        () => { refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kronos_predictions" },
        () => { refresh(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kronos_bot_status" },
        () => { refresh(); }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      clearInterval(interval);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
