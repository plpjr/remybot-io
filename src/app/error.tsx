"use client";

/**
 * Segment-level error boundary.
 *
 * The Next 16.2 API changed: `unstable_retry` is the new primary
 * recovery prop (per node_modules/next/dist/docs/01-app/03-api-reference/
 * 03-file-conventions/error.md). `reset` still exists but is for
 * "clear state without re-fetching" — we want the retry semantics.
 *
 * This catches render + data errors in any route segment. A root-layout
 * error (rare, but possible if ThemeProvider throws) is caught by
 * `global-error.tsx` instead.
 */
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    // Surface to whatever console/logging the browser has. Don't leak
    // the stack via any user-facing UI — it might include internal
    // table names from Supabase error messages.
    console.error("[segment-error]", error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <div className="px-6 py-16 max-w-xl mx-auto">
      <div className="bg-[var(--card)] border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center shadow-sm">
        <AlertTriangle
          className="w-10 h-10 text-red-500 dark:text-red-400 mx-auto mb-4"
          aria-hidden="true"
        />
        <h1 className="text-lg font-semibold text-[var(--text)] mb-1">
          Something went wrong loading this page.
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          The dashboard caught an error in a section of this page. Your
          data is safe — this is a rendering issue.
        </p>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Retry
        </button>
        {error.digest && (
          <p className="text-[10px] text-[var(--text-muted)] opacity-60 mt-6 font-mono">
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
