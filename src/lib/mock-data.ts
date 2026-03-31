// Mock data for the dashboard -- will be replaced with Supabase queries

export const overviewStats = {
  totalReturn: 14.7,
  totalReturnMonth: 3.2,
  totalReturnWeek: 0.8,
  winRate: 82.1,
  avgPnlBps: 20.27,
  sharpeRatio: 2.14,
  maxDrawdown: -3.2,
  totalTrades: 847,
  profitFactor: 3.8,
  avgTradesPerDay: 2.1,
  modelVersion: "v6.1-PPO",
  lastTrained: "2026-03-28",
  status: "running" as const,
  uptime: "12d 7h 32m",
};

export const equityCurve = Array.from({ length: 90 }, (_, i) => {
  const base = 10000;
  const noise = Math.sin(i * 0.3) * 200 + Math.random() * 150;
  const trend = i * 18;
  return {
    date: new Date(2026, 0, 1 + i).toISOString().slice(0, 10),
    equity: Math.round(base + trend + noise),
  };
});

export const monthlyReturns = [
  { month: "Jan", return: 4.2 },
  { month: "Feb", return: 3.1 },
  { month: "Mar", return: 3.2 },
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
  longWinRate: 85.3,
  shortWinRate: 78.9,
  longTrades: 512,
  shortTrades: 335,
  longAvgPnl: 22.4,
  shortAvgPnl: 17.1,
};

export const weeklyImprovements = [
  {
    week: 13,
    date: "Mar 28, 2026",
    summary: "Improved exit timing on trend reversals",
    details: [
      "Reduced average holding time on losing trades by 18%",
      "Added volatility-adjusted stop loss logic",
      "Model now exits 2.3 candles earlier on mean-reversion setups",
    ],
    metrics: { winRate: "+1.2%", avgPnl: "+0.8 bps", trades: "106 avg" },
  },
  {
    week: 12,
    date: "Mar 21, 2026",
    summary: "Better entry filtering during low-volume hours",
    details: [
      "Filtered out 3 false entries per week during Asian session",
      "Kronos embeddings now weight volume features more heavily",
      "Night-time win rate improved from 68% to 79%",
    ],
    metrics: { winRate: "+2.1%", avgPnl: "+1.4 bps", trades: "98 avg" },
  },
  {
    week: 11,
    date: "Mar 14, 2026",
    summary: "Reward shaping tuned for faster profit-taking",
    details: [
      "Increased exit_pnl_multiplier from 100 to 200",
      "Reduced overtime penalty threshold",
      "Profit-taking speed improved without sacrificing win rate",
    ],
    metrics: { winRate: "+0.3%", avgPnl: "+2.1 bps", trades: "112 avg" },
  },
];

export const skillRadar = [
  { skill: "Entry Timing", current: 82, previous: 78 },
  { skill: "Exit Timing", current: 76, previous: 71 },
  { skill: "Risk Mgmt", current: 88, previous: 85 },
  { skill: "Trend Detection", current: 79, previous: 79 },
  { skill: "Volatility", current: 71, previous: 65 },
  { skill: "Position Sizing", current: 84, previous: 82 },
];

export const recentPerformance = [
  { period: "Today", pnl: 0.12, trades: 3, winRate: 66.7 },
  { period: "This Week", pnl: 0.8, trades: 14, winRate: 78.6 },
  { period: "This Month", pnl: 3.2, trades: 62, winRate: 82.3 },
  { period: "All Time", pnl: 14.7, trades: 847, winRate: 82.1 },
];

// ===== TRADING PAGE DATA =====

export const dailyPnl = Array.from({ length: 31 }, (_, i) => {
  const pnl = (Math.random() - 0.35) * 1.2;
  return {
    date: `Mar ${i + 1}`,
    pnl: Math.round(pnl * 100) / 100,
    trades: Math.floor(Math.random() * 4) + 1,
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
  { range: "< 15m", count: 89, avgPnl: 8.2 },
  { range: "15-30m", count: 214, avgPnl: 15.7 },
  { range: "30m-1h", count: 287, avgPnl: 24.1 },
  { range: "1-2h", count: 156, avgPnl: 22.8 },
  { range: "2-4h", count: 72, avgPnl: 18.3 },
  { range: "> 4h", count: 29, avgPnl: -4.6 },
];

export const streaks = {
  currentStreak: { type: "win" as const, length: 4 },
  longestWinStreak: 12,
  longestLossStreak: 4,
  avgWinStreak: 3.8,
  avgLossStreak: 1.4,
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
  // Asian session (0-8 UTC) weaker, London/NY (13-21 UTC) stronger
  const sessionBonus = hour >= 13 && hour <= 21 ? 8 : hour >= 0 && hour <= 8 ? -5 : 0;
  const avgPnl = Math.round((Math.random() * 20 - 5 + sessionBonus) * 10) / 10;
  const trades = Math.floor(Math.random() * 30) + 5;
  const winRate = Math.min(95, Math.max(45, 75 + sessionBonus + (Math.random() - 0.5) * 20));
  return {
    hour: `${hour.toString().padStart(2, "0")}:00`,
    avgPnl,
    trades,
    winRate: Math.round(winRate * 10) / 10,
  };
});

export const tradingMetrics = {
  profitFactor: 3.8,
  expectancy: 20.27,
  payoffRatio: 1.82,
  avgWin: 36.8,
  avgLoss: -20.2,
  largestWin: 142.5,
  largestLoss: -67.3,
  avgSlippage: -0.8,
  totalFees: -124.50,
  netAfterFees: 1247.30,
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
  maxDrawdown: -3.2,
  maxDrawdownDate: "2026-02-14",
  maxDrawdownDuration: "3d 7h",
  currentDrawdown: -0.4,
  avgDrawdown: -1.1,
  var95: -0.82,
  var99: -1.45,
  cvar95: -1.12,
  sortinoRatio: 3.41,
  calmarRatio: 4.59,
  exposureTime: 34.2,
  avgExposurePerTrade: 42,
  maxConsecutiveLosses: 4,
  avgConsecutiveLosses: 1.4,
  recoveryFactor: 4.6,
  ulcerIndex: 0.89,
};

export const consecutiveLosses = [
  { streak: 1, frequency: 67, avgLoss: -12.3 },
  { streak: 2, frequency: 23, avgLoss: -28.7 },
  { streak: 3, frequency: 8, avgLoss: -51.2 },
  { streak: 4, frequency: 2, avgLoss: -67.3 },
  { streak: 5, frequency: 0, avgLoss: 0 },
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
  { metric: "Win Rate", inSample: 84.2, outOfSample: 79.8 },
  { metric: "Avg PnL", inSample: 24.1, outOfSample: 18.3 },
  { metric: "Sharpe", inSample: 2.6, outOfSample: 1.9 },
  { metric: "Profit Factor", inSample: 4.2, outOfSample: 3.1 },
  { metric: "Max DD", inSample: -2.1, outOfSample: -3.8 },
  { metric: "Trades/Day", inSample: 2.3, outOfSample: 2.0 },
];

export const actionDistribution = [
  { action: "Long", percentage: 42, trades: 356, avgPnl: 22.4 },
  { action: "Short", percentage: 31, trades: 263, avgPnl: 17.1 },
  { action: "Neutral", percentage: 27, trades: 228, avgPnl: 0 },
];

export const confidenceDistribution = [
  { range: "0-20%", count: 12, avgPnl: -8.3 },
  { range: "20-40%", count: 45, avgPnl: 2.1 },
  { range: "40-60%", count: 178, avgPnl: 12.8 },
  { range: "60-80%", count: 389, avgPnl: 22.4 },
  { range: "80-100%", count: 223, avgPnl: 28.7 },
];

export const featureImportance = [
  { feature: "Kronos 5m Embedding", importance: 0.23, delta: 0.02 },
  { feature: "RSI (14)", importance: 0.14, delta: -0.01 },
  { feature: "Kronos 1h Embedding", importance: 0.12, delta: 0.03 },
  { feature: "MACD Signal", importance: 0.09, delta: 0.01 },
  { feature: "Bollinger %B", importance: 0.08, delta: 0.0 },
  { feature: "Volume SMA Ratio", importance: 0.07, delta: -0.02 },
  { feature: "Kronos Daily Embed", importance: 0.06, delta: 0.01 },
  { feature: "ATR (14)", importance: 0.05, delta: 0.0 },
  { feature: "OBV Slope", importance: 0.04, delta: 0.01 },
  { feature: "Stoch RSI", importance: 0.03, delta: -0.01 },
];

export const retrainingHistory = [
  { week: "W11", winRateBefore: 80.1, winRateAfter: 80.4, pnlBefore: 18.1, pnlAfter: 20.2, status: "improved" as const },
  { week: "W12", winRateBefore: 80.4, winRateAfter: 82.5, pnlBefore: 20.2, pnlAfter: 21.6, status: "improved" as const },
  { week: "W13", winRateBefore: 82.5, winRateAfter: 82.1, pnlBefore: 21.6, pnlAfter: 20.27, status: "regressed" as const },
];

// ===== ANALYSIS PAGE DATA =====

export const volatilityRegimes = [
  { regime: "Low Vol", winRate: 78.3, avgPnl: 14.2, trades: 312, sharpe: 1.8 },
  { regime: "Med Vol", winRate: 84.1, avgPnl: 22.8, trades: 389, sharpe: 2.4 },
  { regime: "High Vol", winRate: 76.5, avgPnl: 18.9, trades: 146, sharpe: 1.5 },
];

export const trendVsRange = [
  { regime: "Strong Trend", winRate: 86.2, avgPnl: 28.4, trades: 198, direction: "Both" },
  { regime: "Weak Trend", winRate: 81.3, avgPnl: 19.1, trades: 324, direction: "Both" },
  { regime: "Ranging", winRate: 74.8, avgPnl: 10.2, trades: 325, direction: "Both" },
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
  { regime: "Low Volume", winRate: 72.1, avgPnl: 8.4, trades: 187 },
  { regime: "Normal Volume", winRate: 83.6, avgPnl: 22.1, trades: 445 },
  { regime: "High Volume", winRate: 81.2, avgPnl: 19.8, trades: 215 },
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
  completed: 9,
  running: "huge_win_bonus",
  championBps: 20.27,
  eta: "Wed Apr 2",
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
