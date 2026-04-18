/**
 * Health-status helper, pulled out of `mock-data.ts` so the risk page can
 * keep a pure helper without reaching into the mock module. The mock
 * module still re-exports `getHealthStatus` (and `HealthStatus`) for any
 * legacy callers; new code should import from here.
 */

export type HealthStatus = "healthy" | "caution" | "critical";

export function getHealthStatus(metric: string, value: number): HealthStatus {
  const thresholds: Record<
    string,
    { caution: number; critical: number; higherIsBetter: boolean }
  > = {
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
