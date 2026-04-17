import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// At build time for static export these are inlined; at dev runtime they're
// read from .env.local. Missing either one is a deploy error — we log once
// and let every fetch call's try/catch fall back to mock data. We do NOT
// ship a hardcoded fallback key in source (historical footgun: even when
// the anon key is "public" by Supabase design, committing it means a key
// rotation requires a source edit + redeploy).
const envOk = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!envOk && typeof window !== "undefined") {
  // Client-side only; SSR build time prints the same warning from Node.
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set; " +
      "dashboard will render from mock-data fallbacks only.",
  );
}

/**
 * When env vars are missing, we export a "null-object" client whose
 * `from().select()/insert()/etc.` chain resolves with `{ data: null, error }`.
 * Every fetch function in `src/lib/data.ts` already treats that as a
 * signal to fall back to mock data, so the UI stays honest without
 * throwing at module load.
 */
function createNullClient(): SupabaseClient {
  const chain: Record<string, (...args: unknown[]) => unknown> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "order",
    "limit",
    "single",
    "maybeSingle",
    "range",
    "in",
    "match",
  ];
  const result = { data: null, error: new Error("supabase env not configured") };
  for (const m of methods) {
    chain[m] = () => {
      const proxy = new Proxy(chain, {
        get: (target, prop: string) => {
          if (prop === "then") {
            return (resolve: (v: typeof result) => unknown) => resolve(result);
          }
          return target[prop];
        },
      });
      return proxy;
    };
  }
  return {
    // Enough surface for src/lib/data.ts usage: .from(name).select(...).order(...).limit(...).single()
    // and src/lib/use-data.ts realtime: .channel(name).on(...).subscribe()
    from: () => chain as unknown,
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => undefined }) }),
      subscribe: () => ({ unsubscribe: () => undefined }),
    }),
    removeChannel: () => undefined,
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = envOk
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createNullClient();

/** True when env vars are present. UI can show a "backend not configured" hint. */
export const supabaseConfigured = envOk;
