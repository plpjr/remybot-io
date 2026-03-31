"use client";

import { useState, useEffect, useCallback } from "react";
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
  getSkillRadar,
  getWeeklyImprovements,
  type OverviewStats,
  type SweepRun,
  type Experiment,
  type ModelInfo,
  type ChangelogEntry,
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading, error, refresh };
}
