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
