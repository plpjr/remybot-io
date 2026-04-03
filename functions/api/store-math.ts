// POST /api/store-math
// Inserts computed math features into Supabase live_math_features table

interface Env {
  SUPABASE_ANON_KEY?: string;
}

const SUPABASE_URL = "https://szxdrpllzngbpiyktipe.supabase.co";
const ANON_KEY_FALLBACK = "sb_publishable_wHuYODk9lkrZxphnjO-OnQ_8AmtwJYf";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();

    // Validate price
    if (typeof body.price !== "number" || isNaN(body.price)) {
      return new Response(JSON.stringify({ error: "price must be a number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const anonKey = context.env.SUPABASE_ANON_KEY || ANON_KEY_FALLBACK;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/live_math_features`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        price: body.price,
        source: body.source ?? "spot",
        volatility_ann: body.volatility_ann ?? null,
        mean_return: body.mean_return ?? null,
        std_dev: body.std_dev ?? null,
        skewness: body.skewness ?? null,
        kurtosis: body.kurtosis ?? null,
        z_score: body.z_score ?? null,
        autocorr_1: body.autocorr_1 ?? null,
        rate_of_change: body.rate_of_change ?? null,
        acceleration: body.acceleration ?? null,
        cumulative_return: body.cumulative_return ?? null,
        shannon_entropy: body.shannon_entropy ?? null,
        predictability: body.predictability ?? null,
        hurst_exponent: body.hurst_exponent ?? null,
        fractal_dimension: body.fractal_dimension ?? null,
        dominant_cycle: body.dominant_cycle ?? null,
        spectral_entropy: body.spectral_entropy ?? null,
        noise_ratio: body.noise_ratio ?? null,
        gbm_drift: body.gbm_drift ?? null,
        gbm_vol: body.gbm_vol ?? null,
        ito_correction: body.ito_correction ?? null,
        pc1_score: body.pc1_score ?? null,
        pc2_score: body.pc2_score ?? null,
        variance_explained: body.variance_explained ?? null,
        sma_20: body.sma_20 ?? null,
        sma_50: body.sma_50 ?? null,
        ema_20: body.ema_20 ?? null,
        tick_count: body.tick_count ?? null,
        window_size: body.window_size ?? null,
      }),
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
