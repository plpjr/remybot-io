"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shape returned by `/api/healthz` (Cloudflare Pages Function that
 * proxies the bot's HTTP /healthz endpoint). Matches the bot's response
 * shape from `trading/health_server.py` + `live_monitor._healthz_status_provider`.
 */
export interface BotHealthPosition {
  trade_id: string;
  side: "long" | "short";
  entry_price: number;
  size_quote_usd: number;
  stop_price: number;
  take_profit_price: number;
  opened_at: string;
}

export type BotHealthStatus = "ok" | "degraded" | "error" | "unreachable";

export interface BotHealthResponse {
  status: BotHealthStatus;
  uptime_s?: number;
  cycle_count?: number;
  error_count?: number;
  last_cycle_ts?: number | null;
  seconds_since_last_cycle?: number | null;
  circuit_breakers?: Record<string, unknown>;
  position_open?: boolean;
  balance_usd?: number;
  tick_feed_crashed?: boolean;
  last_tick_age_seconds?: number | null;
  position?: BotHealthPosition | null;
  // Trading instrument the bot is currently tracking. `symbol` is the
  // Coinbase-native product id (e.g. "BIP-20DEC30-CDE") — matches
  // kronos_trades.symbol column. `ccxt_symbol` is the CCXT market id
  // (e.g. "BTC/USD:USD-301220") — exposed mainly for debugging.
  symbol?: string;
  ccxt_symbol?: string;
  // Execution mode: "paper" (simulated fills) or "live" (real orders).
  // Also stamped on every kronos_trades / kronos_signals /
  // kronos_predictions row — filter those via the kronos_paper_* and
  // kronos_live_* views.
  mode?: "paper" | "live";
  fetched_at: string;
  upstream_status?: number;
  error?: string;
}

const POLL_INTERVAL_MS = 15_000; // matches Cache-Control headroom on the function

/**
 * Poll `/api/healthz` on a steady cadence. Returns the most recent
 * response plus a `loading` flag for the initial fetch. Intentionally
 * simple — no retry logic: the function itself synthesizes an
 * `unreachable` response on failure, which is exactly what we render.
 */
export function useBotHealth(): {
  health: BotHealthResponse | null;
  loading: boolean;
} {
  const [health, setHealth] = useState<BotHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/healthz", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const body = (await res.json()) as BotHealthResponse;
        if (!cancelled) {
          setHealth(body);
          setLoading(false);
        }
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) return;
        // Network/parse failure — synthesize an unreachable-locally state
        // so the UI distinguishes "can't even reach our own function" from
        // "function replied but bot is down."
        setHealth({
          status: "unreachable",
          fetched_at: new Date().toISOString(),
          error:
            err instanceof Error ? err.message : "failed to reach /api/healthz",
        });
        setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      clearInterval(interval);
    };
  }, []);

  return { health, loading };
}
