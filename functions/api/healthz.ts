/**
 * Cloudflare Pages Function: /api/healthz
 *
 * Proxies the bot's /healthz endpoint (bound to localhost on the VPS —
 * not exposed publicly) so the dashboard can display real-time health
 * without the bot being internet-reachable. Reached via Tailscale or
 * Cloudflare Access at the network layer; this function holds the
 * credential / tunnel URL.
 *
 * Passes through the bot's HTTP status:
 *   - 200 {"status":"ok"|"degraded", ...}      → healthy or cycles stale
 *   - 503 {"status":"error", "tick_feed_crashed":true, ...}  → pages uptime monitor
 *
 * When the upstream is unreachable or times out, we synthesize an
 * error response so the dashboard can distinguish "bot is down" from
 * "bot says it's broken" — the latter is more informative but both
 * require operator attention.
 */

interface Env {
  KRONOS_HEALTHZ_URL?: string;
}

interface BotPosition {
  trade_id: string;
  side: "long" | "short";
  entry_price: number;
  size_quote_usd: number;
  stop_price: number;
  take_profit_price: number;
  opened_at: string;
}

interface BotHealth {
  status: "ok" | "degraded" | "error" | "unreachable";
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
  position?: BotPosition | null;
  fetched_at: string;
  upstream_status?: number;
  error?: string;
}

const ALLOWED_ORIGINS = new Set([
  "https://remybot.io",
  "https://www.remybot.io",
  "http://localhost:3000",
]);

const FETCH_TIMEOUT_MS = 5_000;

function buildHeaders(reqOrigin: string, status: "ok" | "degraded" | "error" | "unreachable") {
  const allowedOrigin = ALLOWED_ORIGINS.has(reqOrigin) ? reqOrigin : "https://remybot.io";
  return {
    "Content-Type": "application/json",
    // Short TTL — health must be near-real-time. 5s avoids stampede
    // while keeping the dashboard under 15s staleness in the worst case.
    "Cache-Control": status === "ok" ? "public, max-age=5" : "no-cache",
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const reqOrigin = context.request.headers.get("Origin") ?? "";
  const upstream = context.env.KRONOS_HEALTHZ_URL;

  if (!upstream) {
    // Not configured — dashboard should render a "health unknown" state
    // rather than a fake "healthy" one. 503 lets uptime monitors page.
    const body: BotHealth = {
      status: "unreachable",
      fetched_at: new Date().toISOString(),
      error: "KRONOS_HEALTHZ_URL not configured on Pages",
    };
    return new Response(JSON.stringify(body), {
      status: 503,
      headers: buildHeaders(reqOrigin, "unreachable"),
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(upstream, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);

    // Pass through regardless of HTTP status — bot intentionally returns
    // 503 when tick_feed_crashed (uptime monitors depend on it).
    const text = await res.text();
    let parsed: Partial<BotHealth> = {};
    try {
      parsed = JSON.parse(text) as Partial<BotHealth>;
    } catch {
      // Malformed response — flag as error but keep the raw text for
      // operator debugging.
      parsed = {
        status: "error",
        error: `upstream returned non-JSON (first 200 chars): ${text.slice(0, 200)}`,
      };
    }

    const augmented: BotHealth = {
      ...parsed,
      status:
        (parsed.status as BotHealth["status"]) ??
        (res.ok ? "ok" : "error"),
      fetched_at: new Date().toISOString(),
      upstream_status: res.status,
    };

    return new Response(JSON.stringify(augmented), {
      status: res.status,
      headers: buildHeaders(reqOrigin, augmented.status),
    });
  } catch (err) {
    clearTimeout(timer);
    const errorMsg = err instanceof Error ? err.message : String(err);
    const aborted = err instanceof Error && err.name === "AbortError";
    const body: BotHealth = {
      status: "unreachable",
      fetched_at: new Date().toISOString(),
      error: aborted
        ? `upstream did not respond within ${FETCH_TIMEOUT_MS}ms`
        : errorMsg,
    };
    return new Response(JSON.stringify(body), {
      status: 503,
      headers: buildHeaders(reqOrigin, "unreachable"),
    });
  }
};
