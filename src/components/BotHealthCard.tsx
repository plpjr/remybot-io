"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useBotHealth, type BotHealthStatus } from "@/lib/useBotHealth";

const STATUS_CONFIG: Record<
  BotHealthStatus,
  { icon: React.ElementType; label: string; tone: "ok" | "warn" | "bad" | "neutral" }
> = {
  ok: { icon: CheckCircle2, label: "Running", tone: "ok" },
  degraded: { icon: AlertTriangle, label: "Degraded", tone: "warn" },
  error: { icon: XCircle, label: "Error", tone: "bad" },
  unreachable: { icon: WifiOff, label: "Unreachable", tone: "neutral" },
};

const TONE_STYLES: Record<"ok" | "warn" | "bad" | "neutral", string> = {
  // Semantic color lockdown: emerald = ok, amber = warn, red = bad.
  // Neutral (unreachable) uses the standard muted card — don't steal
  // red/emerald for "we don't know."
  ok: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300",
  warn: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300",
  bad: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300",
  neutral: "border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)]",
};

function formatUptime(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTickAge(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  if (seconds < 1) return "<1s";
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const m = Math.floor(seconds / 60);
  return `${m}m`;
}

function TickFreshnessPill({ ageS }: { ageS: number | null | undefined }) {
  if (ageS === null || ageS === undefined) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg)] text-[var(--text-muted)]">
        no ticks yet
      </span>
    );
  }
  // >60s stale → amber; >120s very stale → red. Matches the bot-side
  // STALE_TICK_SECONDS = 60 default on executor_runner.
  const tone = ageS > 120 ? "bad" : ageS > 60 ? "warn" : "ok";
  const toneClass: Record<"ok" | "warn" | "bad", string> = {
    ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warn: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    bad: "bg-red-500/10 text-red-700 dark:text-red-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${toneClass[tone]}`}
    >
      tick {formatTickAge(ageS)}
    </span>
  );
}

/**
 * Live bot-health card. Reads `/api/healthz` via the CF Pages proxy
 * every 15s. Shows:
 *   - Overall status (ok / degraded / error / unreachable) with icon
 *   - Uptime + error count
 *   - Tick-feed freshness (via `last_tick_age_seconds`)
 *   - Tick-feed crash banner (from Phase 1.C)
 *   - Current position summary (when one is open)
 *
 * All fields are optional in the health response; the card degrades
 * gracefully as the bot exposes more data over time.
 */
export default function BotHealthCard() {
  const { health, loading } = useBotHealth();

  if (loading || !health) {
    return (
      <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-5 h-5 rounded-full bg-[var(--bg)]" />
          <div className="h-4 w-32 bg-[var(--bg)] rounded" />
        </div>
        <div className="h-3 w-48 bg-[var(--bg)] rounded" />
      </div>
    );
  }

  const cfg = STATUS_CONFIG[health.status];
  const Icon = cfg.icon;
  const tone = TONE_STYLES[cfg.tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-2xl p-6 border shadow-sm ${tone}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold">{cfg.label}</span>
        </div>
        {health.status !== "unreachable" && (
          <TickFreshnessPill ageS={health.last_tick_age_seconds} />
        )}
      </div>

      {health.status === "unreachable" ? (
        <p className="text-xs opacity-80 mt-1">
          {health.error ?? "Bot /healthz endpoint is not reachable from the dashboard."}
        </p>
      ) : health.tick_feed_crashed ? (
        <p className="text-xs font-medium mb-2">
          Tick feed crashed — stop-loss is blind until service restart.
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-y-1 text-xs">
        {health.uptime_s !== undefined && (
          <>
            <dt className="opacity-70">Uptime</dt>
            <dd className="text-right tabular-nums">{formatUptime(health.uptime_s)}</dd>
          </>
        )}
        {health.cycle_count !== undefined && (
          <>
            <dt className="opacity-70">Cycles</dt>
            <dd className="text-right tabular-nums">{health.cycle_count}</dd>
          </>
        )}
        {health.error_count !== undefined && health.error_count > 0 && (
          <>
            <dt className="opacity-70">Errors</dt>
            <dd className="text-right tabular-nums">{health.error_count}</dd>
          </>
        )}
        {typeof health.balance_usd === "number" && (
          <>
            <dt className="opacity-70">Balance</dt>
            <dd className="text-right tabular-nums">
              ${health.balance_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </dd>
          </>
        )}
      </dl>

      {health.position_open && health.position && (
        <div className="mt-4 pt-3 border-t border-current/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-semibold">
              Open {health.position.side.toUpperCase()} · {health.position.trade_id}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-y-1 text-xs">
            <dt className="opacity-70">Entry</dt>
            <dd className="text-right tabular-nums">
              ${health.position.entry_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </dd>
            <dt className="opacity-70">Stop</dt>
            <dd className="text-right tabular-nums">
              ${health.position.stop_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </dd>
            <dt className="opacity-70">Take profit</dt>
            <dd className="text-right tabular-nums">
              ${health.position.take_profit_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </dd>
            <dt className="opacity-70">Size</dt>
            <dd className="text-right tabular-nums">
              ${health.position.size_quote_usd.toLocaleString()}
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}
