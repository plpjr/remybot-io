import { AlertTriangle } from "lucide-react";

/**
 * Banner shown on pages whose data-layer path still reads from
 * `src/lib/mock-data.ts` rather than live Supabase queries. Keep this
 * visible — it's a defense against the old inflated-stats-look-real
 * failure mode, and a prompt to finish the live wiring per page.
 */
export default function MockDataBanner() {
  return (
    <div
      role="status"
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-sm animate-in"
    >
      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>
        Paper-trade data not flowing yet. This page shows reference
        values from the pre-pivot research era.
      </span>
    </div>
  );
}
