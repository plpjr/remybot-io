// POST /api/store-math
// Inserts computed math features into Supabase live_math_features table.
// This endpoint is called from the browser (LiveMathDashboard), so it can't
// use a shared-secret bearer token. Defenses instead:
//   1. Same-origin Origin header check (blocks cross-site abuse)
//   2. Numeric bounds on all fields (reject NaN/Infinity/junk shapes)
//   3. SUPABASE_ANON_KEY must come from env (no hardcoded fallback)
// Rate limiting is expected at the Cloudflare WAF layer (configure per-IP
// rule on /api/store-math in the Cloudflare dashboard).

interface Env {
  SUPABASE_ANON_KEY?: string;
}

const SUPABASE_URL = "https://szxdrpllzngbpiyktipe.supabase.co";

const ALLOWED_ORIGINS = new Set([
  "https://remybot.io",
  "https://www.remybot.io",
  "http://localhost:3000",
]);

const NUMERIC_FIELDS = [
  "price", "volatility_ann", "mean_return", "std_dev", "skewness", "kurtosis",
  "z_score", "autocorr_1", "rate_of_change", "acceleration", "cumulative_return",
  "shannon_entropy", "predictability", "hurst_exponent", "fractal_dimension",
  "dominant_cycle", "spectral_entropy", "noise_ratio", "gbm_drift", "gbm_vol",
  "ito_correction", "pc1_score", "pc2_score", "variance_explained",
  "sma_20", "sma_50", "ema_20", "tick_count", "window_size",
] as const;

function finiteOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // 1. Same-origin enforcement.
    const origin = context.request.headers.get("Origin") ?? "";
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response(JSON.stringify({ error: "forbidden origin" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = (await context.request.json()) as Record<string, unknown>;

    // 2. Validate price — must be a finite positive number.
    if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price <= 0) {
      return new Response(JSON.stringify({ error: "price must be a finite positive number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Env-only anon key (no hardcoded fallback).
    const anonKey = context.env.SUPABASE_ANON_KEY;
    if (!anonKey) {
      return new Response(JSON.stringify({ error: "server misconfigured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Whitelist + scrub numeric fields (rejects NaN/Infinity/non-numbers).
    const payload: Record<string, unknown> = {
      price: body.price,
      source: typeof body.source === "string" ? body.source.slice(0, 32) : "spot",
    };
    for (const field of NUMERIC_FIELDS) {
      if (field === "price") continue;
      payload[field] = finiteOrNull(body[field]);
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/live_math_features`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: "Insert failed", detail: text }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
