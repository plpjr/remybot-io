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
  fetchDailyPnl,
  fetchWeeklyPnl,
  fetchHourlyPerformance,
  fetchTradeDurations,
  fetchTradeStreaks,
  fetchPredictionAccuracy,
  fetchConfidenceDistribution,
  fetchRegimeBreakdown,
  fetchDecisionTrace,
  fetchDrawdownCurve,
  fetchBtcPriceChart,
  fetchCircuitBreakers,
  fetchTradeMetrics,
  fetchHoldReasonBreakdown,
  fetchRangeWidthHistogram,
  fetchDirectionBiasCounts,
  fetchSessionDecisionHeatmap,
  fetchRegimeDecisionHeatmap,
  fetchPredictedVsActualBands,
  fetchConfidenceOverTime,
  fetchAccuracyScatter,
  fetchAccuracyByRegime,
  fetchHighLowHitTimeline,
  fetchVolatilityTimeline,
  fetchSpreadEvents,
  fetchExitReasonBreakdown,
  fetchSignalOutcomeAudit,
  fetchLatestModelVotes,
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
  type DailyPnlPoint,
  type WeeklyPnlPoint,
  type HourlyPerformance,
  type TradeDurationBucket,
  type StreakSummary,
  type PredictionAccuracyRow,
  type PredictionAccuracySummary,
  type ConfidenceBucket,
  type RegimeBreakdown,
  type DecisionTraceRow,
  type DrawdownPoint,
  type BtcPricePoint,
  type CircuitBreakerState,
  type TradeMetrics,
  type HoldReasonCount,
  type RangeWidthBucket,
  type DirectionBiasCount,
  type SessionDecisionCell,
  type RegimeDecisionCell,
  type PredictedVsActualPoint,
  type ConfidencePoint,
  type AccuracyScatterPoint,
  type AccuracyByRegime,
  type HighLowHitPoint,
  type VolatilityPoint,
  type SpreadEvent,
  type ExitReasonBucket,
  type SignalOutcomeRow,
  type LatestModelVotes,
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

  // Paper-mode fetchers wired for /trading /risk /model /analysis.
  dailyPnl: DailyPnlPoint[];
  weeklyPnl: WeeklyPnlPoint[];
  hourlyPerformance: HourlyPerformance[];
  tradeDurations: TradeDurationBucket[];
  streaks: StreakSummary;
  predictionAccuracy: {
    rows: PredictionAccuracyRow[];
    summary: PredictionAccuracySummary;
  };
  confidenceDistribution: ConfidenceBucket[];
  regimeBreakdown: RegimeBreakdown[];
  decisionTrace: DecisionTraceRow[];
  drawdownCurve: DrawdownPoint[];
  btcPriceChart: BtcPricePoint[];
  circuitBreakers: Record<string, CircuitBreakerState>;
  tradeMetrics: TradeMetrics;

  // Tier-2 per-cycle telemetry, feeds /model /analysis /trading /risk cards.
  holdReasonBreakdown: HoldReasonCount[];
  rangeWidthHistogram: RangeWidthBucket[];
  directionBiasCounts: DirectionBiasCount[];
  sessionDecisionHeatmap: SessionDecisionCell[];
  regimeDecisionHeatmap: RegimeDecisionCell[];
  predictedVsActualBands: PredictedVsActualPoint[];
  confidenceOverTime: ConfidencePoint[];
  accuracyScatter: AccuracyScatterPoint[];
  accuracyByRegime: AccuracyByRegime[];
  highLowHitTimeline: HighLowHitPoint[];
  volatilityTimeline: VolatilityPoint[];
  spreadEvents: SpreadEvent[];
  exitReasonBreakdown: ExitReasonBucket[];
  signalOutcomeAudit: SignalOutcomeRow[];
  latestModelVotes: LatestModelVotes;
}

const emptyStreaks: StreakSummary = {
  currentStreak: { type: "none", length: 0 },
  longestWinStreak: 0,
  longestLossStreak: 0,
  streakHistory: [],
};

const emptyTradeMetrics: TradeMetrics = {
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

const emptyHourly: HourlyPerformance[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  avgPnlBps: 0,
  trades: 0,
}));

const emptyDurations: TradeDurationBucket[] = [
  { range: "<5m", count: 0, avgPnlBps: 0 },
  { range: "5-15m", count: 0, avgPnlBps: 0 },
  { range: "15-30m", count: 0, avgPnlBps: 0 },
  { range: "30-60m", count: 0, avgPnlBps: 0 },
  { range: "1-4h", count: 0, avgPnlBps: 0 },
  { range: ">4h", count: 0, avgPnlBps: 0 },
];

const emptyLatestVotes: LatestModelVotes = {
  timestamp: "",
  model_votes: null,
  decision_action: "",
  decision_reason: "",
};

const emptyRangeWidth: RangeWidthBucket[] = [
  { bucket: "<20", count: 0 },
  { bucket: "20-50", count: 0 },
  { bucket: "50-100", count: 0 },
  { bucket: "100-200", count: 0 },
  { bucket: ">200", count: 0 },
];

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
    dailyPnl: [],
    weeklyPnl: [],
    hourlyPerformance: emptyHourly,
    tradeDurations: emptyDurations,
    streaks: emptyStreaks,
    predictionAccuracy: {
      rows: [],
      summary: {
        avgRangeErrorBps: 0,
        highHitRate: 0,
        lowHitRate: 0,
        directionAccuracy: 0,
        n: 0,
      },
    },
    confidenceDistribution: [],
    regimeBreakdown: [],
    decisionTrace: [],
    drawdownCurve: [],
    btcPriceChart: [],
    circuitBreakers: {},
    tradeMetrics: emptyTradeMetrics,
    holdReasonBreakdown: [],
    rangeWidthHistogram: emptyRangeWidth,
    directionBiasCounts: [],
    sessionDecisionHeatmap: [],
    regimeDecisionHeatmap: [],
    predictedVsActualBands: [],
    confidenceOverTime: [],
    accuracyScatter: [],
    accuracyByRegime: [],
    highLowHitTimeline: [],
    volatilityTimeline: [],
    spreadEvents: [],
    exitReasonBreakdown: [],
    signalOutcomeAudit: [],
    latestModelVotes: emptyLatestVotes,
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
        dailyPnl,
        weeklyPnl,
        hourlyPerformance,
        tradeDurations,
        streaks,
        predictionAccuracy,
        confidenceDistribution,
        regimeBreakdown,
        decisionTrace,
        drawdownCurve,
        btcPriceChart,
        circuitBreakers,
        tradeMetrics,
        holdReasonBreakdown,
        rangeWidthHistogram,
        directionBiasCounts,
        sessionDecisionHeatmap,
        regimeDecisionHeatmap,
        predictedVsActualBands,
        confidenceOverTime,
        accuracyScatter,
        accuracyByRegime,
        highLowHitTimeline,
        volatilityTimeline,
        spreadEvents,
        exitReasonBreakdown,
        signalOutcomeAudit,
        latestModelVotes,
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
        fetchDailyPnl(),
        fetchWeeklyPnl(),
        fetchHourlyPerformance(),
        fetchTradeDurations(),
        fetchTradeStreaks(),
        fetchPredictionAccuracy(),
        fetchConfidenceDistribution(),
        fetchRegimeBreakdown(),
        fetchDecisionTrace(),
        fetchDrawdownCurve(),
        fetchBtcPriceChart(),
        fetchCircuitBreakers(),
        fetchTradeMetrics(),
        fetchHoldReasonBreakdown(),
        fetchRangeWidthHistogram(),
        fetchDirectionBiasCounts(),
        fetchSessionDecisionHeatmap(),
        fetchRegimeDecisionHeatmap(),
        fetchPredictedVsActualBands(),
        fetchConfidenceOverTime(),
        fetchAccuracyScatter(),
        fetchAccuracyByRegime(),
        fetchHighLowHitTimeline(),
        fetchVolatilityTimeline(),
        fetchSpreadEvents(),
        fetchExitReasonBreakdown(),
        fetchSignalOutcomeAudit(),
        fetchLatestModelVotes(),
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
        dailyPnl,
        weeklyPnl,
        hourlyPerformance,
        tradeDurations,
        streaks,
        predictionAccuracy,
        confidenceDistribution,
        regimeBreakdown,
        decisionTrace,
        drawdownCurve,
        btcPriceChart,
        circuitBreakers,
        tradeMetrics,
        holdReasonBreakdown,
        rangeWidthHistogram,
        directionBiasCounts,
        sessionDecisionHeatmap,
        regimeDecisionHeatmap,
        predictedVsActualBands,
        confidenceOverTime,
        accuracyScatter,
        accuracyByRegime,
        highLowHitTimeline,
        volatilityTimeline,
        spreadEvents,
        exitReasonBreakdown,
        signalOutcomeAudit,
        latestModelVotes,
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
