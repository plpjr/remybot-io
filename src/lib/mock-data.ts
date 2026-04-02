// Mock data for the dashboard -- will be replaced with Supabase queries

export const overviewStats = {
  totalReturn: -2.1,
  totalReturnMonth: -0.4,
  totalReturnWeek: 0.1,
  winRate: 40.3,
  avgPnlBps: -1.8,
  sharpeRatio: 0.42,
  maxDrawdown: -8.7,
  totalTrades: 312,
  profitFactor: 0.91,
  avgTradesPerDay: 3.4,
  modelVersion: "v8-PPO",
  lastTrained: "2026-03-28",
  status: "stopped" as "running" | "stopped" | "error",
  uptime: "—",
};

export const equityCurve = Array.from({ length: 90 }, (_, i) => {
  const base = 10000;
  // Use stable deterministic noise instead of Math.random()
  const noise = Math.sin(i * 0.3) * 150 + Math.sin(i * 0.7) * 50;
  const trend = -i * 2.5;
  return {
    date: new Date(2026, 0, 1 + i).toISOString().slice(0, 10),
    equity: Math.round(base + trend + noise),
  };
});

export const monthlyReturns = [
  { month: "Jan", return: -1.2 },
  { month: "Feb", return: -0.5 },
  { month: "Mar", return: -0.4 },
  { month: "Apr", return: 0 },
  { month: "May", return: 0 },
  { month: "Jun", return: 0 },
  { month: "Jul", return: 0 },
  { month: "Aug", return: 0 },
  { month: "Sep", return: 0 },
  { month: "Oct", return: 0 },
  { month: "Nov", return: 0 },
  { month: "Dec", return: 0 },
];

export const longShortBreakdown = {
  longWinRate: 42.1,
  shortWinRate: 38.0,
  longTrades: 178,
  shortTrades: 134,
  longAvgPnl: -1.2,
  shortAvgPnl: -2.6,
};

export const weeklyImprovements = [
  {
    week: 13,
    date: "Mar 28, 2026",
    summary: "V8 campaign: selective-entries + signal inversion fix",
    details: [
      "Fixed long/short signal inversion bug (actions were swapped)",
      "Selective-entries variant won 8-candidate sweep (WR 38.7%)",
      "OOS performance still marginal — PPO policy quality is bottleneck",
    ],
    metrics: { winRate: "40.3%", avgPnl: "-1.8 bps", trades: "3.4/day" },
  },
  {
    week: 12,
    date: "Mar 21, 2026",
    summary: "Exit timing redesign (v3 reward fix)",
    details: [
      "Root cause of 0% WR identified: fee bug + episode death loop",
      "Rebuilt reward function with correct fee accounting",
      "Win rate recovered from 0% to ~36% baseline",
    ],
    metrics: { winRate: "36%", avgPnl: "-3.2 bps", trades: "3.1/day" },
  },
  {
    week: 11,
    date: "Mar 14, 2026",
    summary: "130+ autoresearch experiments completed",
    details: [
      "Exhaustive reward-shaping sweep across entry cost, neutral penalty, win bonus",
      "Best candidate: entry_cost_1.0 (29.13 bps in-sample)",
      "Ceiling identified — shifting focus to architecture changes",
    ],
    metrics: { winRate: "~38%", avgPnl: "+2.1 bps IS", trades: "~3/day" },
  },
];

export const skillRadar = [
  { skill: "Entry Timing", current: 38, previous: 32 },
  { skill: "Exit Timing", current: 35, previous: 10 },
  { skill: "Risk Mgmt", current: 52, previous: 45 },
  { skill: "Trend Detection", current: 41, previous: 39 },
  { skill: "Volatility", current: 33, previous: 28 },
  { skill: "Position Sizing", current: 45, previous: 40 },
];

export const recentPerformance = [
  { period: "Today", pnl: 0.0, trades: 0, winRate: 0 },
  { period: "This Week", pnl: 0.1, trades: 8, winRate: 37.5 },
  { period: "This Month", pnl: -0.4, trades: 94, winRate: 39.4 },
  { period: "All Time", pnl: -2.1, trades: 312, winRate: 40.3 },
];

// ===== TRADING PAGE DATA =====

export const dailyPnl = Array.from({ length: 31 }, (_, i) => {
  const pnl = (Math.random() - 0.55) * 0.8;
  return {
    date: `Mar ${i + 1}`,
    pnl: Math.round(pnl * 100) / 100,
    trades: Math.floor(Math.random() * 5) + 1,
  };
});

export const weeklyPnl = [
  { week: "W1", pnl: 0.9, trades: 12 },
  { week: "W2", pnl: 1.4, trades: 15 },
  { week: "W3", pnl: -0.3, trades: 18 },
  { week: "W4", pnl: 0.8, trades: 14 },
  { week: "W5", pnl: 1.1, trades: 16 },
  { week: "W6", pnl: 0.6, trades: 11 },
  { week: "W7", pnl: -0.1, trades: 13 },
  { week: "W8", pnl: 1.8, trades: 17 },
  { week: "W9", pnl: 0.4, trades: 10 },
  { week: "W10", pnl: 0.9, trades: 14 },
  { week: "W11", pnl: 1.2, trades: 16 },
  { week: "W12", pnl: 0.7, trades: 12 },
];

export const tradeDurations = [
  { range: "< 15m", count: 42, avgPnl: -5.1 },
  { range: "15-30m", count: 78, avgPnl: -1.8 },
  { range: "30m-1h", count: 94, avgPnl: 0.4 },
  { range: "1-2h", count: 56, avgPnl: -2.1 },
  { range: "2-4h", count: 28, avgPnl: -3.7 },
  { range: "> 4h", count: 14, avgPnl: -8.2 },
];

export const streaks = {
  currentStreak: { type: "loss" as "win" | "loss", length: 2 },
  longestWinStreak: 5,
  longestLossStreak: 7,
  avgWinStreak: 1.8,
  avgLossStreak: 2.6,
  streakHistory: [
    { type: "win", length: 5 },
    { type: "loss", length: 2 },
    { type: "win", length: 8 },
    { type: "loss", length: 1 },
    { type: "win", length: 12 },
    { type: "loss", length: 3 },
    { type: "win", length: 4 },
    { type: "loss", length: 4 },
    { type: "win", length: 6 },
    { type: "loss", length: 1 },
    { type: "win", length: 3 },
    { type: "loss", length: 2 },
    { type: "win", length: 4 },
  ],
};

export const hourlyPerformance = Array.from({ length: 24 }, (_, hour) => {
  const sessionBonus = hour >= 13 && hour <= 21 ? 3 : hour >= 0 && hour <= 8 ? -3 : 0;
  const avgPnl = Math.round((Math.random() * 12 - 7 + sessionBonus) * 10) / 10;
  const trades = Math.floor(Math.random() * 20) + 3;
  const winRate = Math.min(55, Math.max(25, 38 + sessionBonus + (Math.random() - 0.5) * 15));
  return {
    hour: `${hour.toString().padStart(2, "0")}:00`,
    avgPnl,
    trades,
    winRate: Math.round(winRate * 10) / 10,
  };
});

export const tradingMetrics = {
  profitFactor: 0.91,
  expectancy: -1.8,
  payoffRatio: 0.94,
  avgWin: 18.2,
  avgLoss: -19.4,
  largestWin: 67.3,
  largestLoss: -52.1,
  avgSlippage: -1.2,
  totalFees: -89.40,
  netAfterFees: -210.50,
};

// ===== RISK PAGE DATA =====

export const drawdownCurve = Array.from({ length: 90 }, (_, i) => {
  const peak = Math.sin(i * 0.15) * 1.5;
  const dd = -Math.abs(Math.sin(i * 0.08) * 2 + Math.random() * 0.5);
  return {
    date: new Date(2026, 0, 1 + i).toISOString().slice(0, 10),
    drawdown: Math.round(Math.min(0, dd + peak * 0.3) * 100) / 100,
  };
});

export const riskMetrics = {
  maxDrawdown: -8.7,
  maxDrawdownDate: "2026-02-22",
  maxDrawdownDuration: "11d 4h",
  currentDrawdown: -2.1,
  avgDrawdown: -4.3,
  var95: -2.14,
  var99: -3.87,
  cvar95: -2.91,
  sortinoRatio: 0.31,
  calmarRatio: -0.24,
  exposureTime: 48.5,
  avgExposurePerTrade: 38,
  maxConsecutiveLosses: 7,
  avgConsecutiveLosses: 2.6,
  recoveryFactor: -0.24,
  ulcerIndex: 3.42,
};

export const consecutiveLosses = [
  { streak: 1, frequency: 34, avgLoss: -14.8 },
  { streak: 2, frequency: 28, avgLoss: -31.2 },
  { streak: 3, frequency: 19, avgLoss: -48.6 },
  { streak: 4, frequency: 11, avgLoss: -62.1 },
  { streak: 5, frequency: 6, avgLoss: -78.4 },
];

// ===== MODEL PAGE DATA =====

export const trainingRewardCurve = Array.from({ length: 150 }, (_, epoch) => {
  const base = -50 + epoch * 0.8;
  const noise = Math.sin(epoch * 0.2) * 10 + Math.random() * 5;
  return {
    epoch: epoch + 1,
    reward: Math.round((base + noise) * 10) / 10,
    baseline: Math.round((base * 0.7) * 10) / 10,
  };
});

export const isVsOos = [
  { metric: "Win Rate", inSample: 40.3, outOfSample: 36.1 },
  { metric: "Avg PnL", inSample: 2.1, outOfSample: -3.8 },
  { metric: "Sharpe", inSample: 0.52, outOfSample: 0.18 },
  { metric: "Profit Factor", inSample: 1.02, outOfSample: 0.82 },
  { metric: "Max DD", inSample: -5.4, outOfSample: -8.7 },
  { metric: "Trades/Day", inSample: 3.4, outOfSample: 3.1 },
];

export const actionDistribution = [
  { action: "Long", percentage: 38, trades: 119, avgPnl: -1.2 },
  { action: "Short", percentage: 29, trades: 90, avgPnl: -2.6 },
  { action: "Neutral", percentage: 33, trades: 103, avgPnl: 0 },
];

export const confidenceDistribution = [
  { range: "0-20%", count: 28, avgPnl: -12.1 },
  { range: "20-40%", count: 67, avgPnl: -4.8 },
  { range: "40-60%", count: 112, avgPnl: -1.2 },
  { range: "60-80%", count: 78, avgPnl: 1.4 },
  { range: "80-100%", count: 27, avgPnl: 3.9 },
];

export const featureImportance = [
  { feature: "CVD 5m", importance: 0.18, delta: 0.03 },
  { feature: "Taker Buy Ratio", importance: 0.14, delta: 0.01 },
  { feature: "RSI (14)", importance: 0.11, delta: -0.01 },
  { feature: "OFI 5m", importance: 0.09, delta: 0.02 },
  { feature: "Volume Spike", importance: 0.08, delta: 0.0 },
  { feature: "Futures Premium", importance: 0.07, delta: -0.01 },
  { feature: "Trade Intensity", importance: 0.06, delta: 0.01 },
  { feature: "Large Trade Imbalance", importance: 0.05, delta: 0.0 },
  { feature: "Hurst Exponent", importance: 0.04, delta: 0.01 },
  { feature: "ATR (14)", importance: 0.03, delta: -0.01 },
];

export const retrainingHistory = [
  { week: "W11", winRateBefore: 36.0, winRateAfter: 38.7, pnlBefore: -3.2, pnlAfter: -1.4, status: "improved" as const },
  { week: "W12", winRateBefore: 38.7, winRateAfter: 39.1, pnlBefore: -1.4, pnlAfter: -1.1, status: "improved" as const },
  { week: "W13", winRateBefore: 39.1, winRateAfter: 40.3, pnlBefore: -1.1, pnlAfter: -1.8, status: "regressed" as const },
];

// ===== ANALYSIS PAGE DATA =====

export const volatilityRegimes = [
  { regime: "Low Vol", winRate: 42.8, avgPnl: 0.4, trades: 108, sharpe: 0.52 },
  { regime: "Med Vol", winRate: 39.5, avgPnl: -2.1, trades: 134, sharpe: 0.31 },
  { regime: "High Vol", winRate: 37.2, avgPnl: -4.3, trades: 70, sharpe: 0.12 },
];

export const trendVsRange = [
  { regime: "Strong Trend", winRate: 43.1, avgPnl: 1.2, trades: 82, direction: "Both" },
  { regime: "Weak Trend", winRate: 39.8, avgPnl: -2.4, trades: 128, direction: "Both" },
  { regime: "Ranging", winRate: 37.9, avgPnl: -3.1, trades: 102, direction: "Both" },
];

export const btcCorrelation = Array.from({ length: 60 }, (_, i) => {
  const btcReturn = (Math.random() - 0.5) * 4;
  const botReturn = btcReturn * 0.3 + (Math.random() - 0.3) * 1.5;
  return {
    btcReturn: Math.round(btcReturn * 100) / 100,
    botReturn: Math.round(botReturn * 100) / 100,
  };
});

export const volumeRegimes = [
  { regime: "Low Volume", winRate: 36.4, avgPnl: -3.8, trades: 87 },
  { regime: "Normal Volume", winRate: 41.2, avgPnl: -0.9, trades: 152 },
  { regime: "High Volume", winRate: 40.8, avgPnl: -1.4, trades: 73 },
];

// ===== AUTORESEARCH PAGE DATA =====

export const experimentLeaderboard = [
  { name: "entry_cost_1.0", meanBps: 29.13, std: 9.48, seeds: [18.27, 41.37, 27.76], status: "leader" as const },
  { name: "entry_cost_0.5", meanBps: 26.68, std: 5.42, seeds: [19.02, 30.50, 30.53], status: "strong" as const },
  { name: "v2_baseline", meanBps: 23.63, std: 2.95, seeds: [19.59, 24.74, 26.55], status: "baseline" as const },
  { name: "entry_cost_0.1", meanBps: 23.30, std: 2.58, seeds: [19.74, 24.37, 25.79], status: "normal" as const },
  { name: "neutral_pen_0.10", meanBps: 22.93, std: 2.66, seeds: [19.17, 24.92, 24.71], status: "normal" as const },
  { name: "no_win_bonus", meanBps: 22.51, std: 3.69, seeds: [17.65, 23.31, 26.58], status: "normal" as const },
  { name: "neutral_pen_0.02", meanBps: 22.01, std: 2.80, seeds: [19.20, 20.99, 25.84], status: "normal" as const },
  { name: "neutral_pen_0.00", meanBps: 21.65, std: 2.93, seeds: [17.55, 23.22, 24.18], status: "normal" as const },
  { name: "big_win_bonus", meanBps: 21.14, std: 3.33, seeds: [16.49, 22.84, 24.09], status: "weak" as const },
];

export const sweepProgress = {
  total: 19,
  completed: 19,
  running: "—",
  championBps: 29.13,
  eta: "Complete",
};

// ===== HEALTH STATUS HELPERS =====

export type HealthStatus = "healthy" | "caution" | "critical";

export function getHealthStatus(metric: string, value: number): HealthStatus {
  const thresholds: Record<string, { caution: number; critical: number; higherIsBetter: boolean }> = {
    winRate: { caution: 70, critical: 55, higherIsBetter: true },
    sharpe: { caution: 1.5, critical: 1.0, higherIsBetter: true },
    maxDrawdown: { caution: -5, critical: -10, higherIsBetter: false },
    profitFactor: { caution: 2.0, critical: 1.2, higherIsBetter: true },
    avgPnl: { caution: 10, critical: 0, higherIsBetter: true },
    sortinoRatio: { caution: 2.0, critical: 1.0, higherIsBetter: true },
    exposureTime: { caution: 60, critical: 80, higherIsBetter: false },
    var95: { caution: -1.5, critical: -3.0, higherIsBetter: false },
    consecutiveLosses: { caution: 4, critical: 7, higherIsBetter: false },
    oosGap: { caution: 15, critical: 30, higherIsBetter: false },
  };
  const t = thresholds[metric];
  if (!t) return "healthy";
  if (t.higherIsBetter) {
    if (value >= t.caution) return "healthy";
    if (value >= t.critical) return "caution";
    return "critical";
  } else {
    if (value >= t.caution) return "healthy";
    if (value >= t.critical) return "caution";
    return "critical";
  }
}
