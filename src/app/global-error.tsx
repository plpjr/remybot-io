"use client";

/**
 * Root-layout error boundary.
 *
 * `global-error.tsx` replaces the *entire* root layout (including
 * `<html>` and `<body>`) when an error bubbles past every segment
 * boundary — typically thrown from ThemeProvider / Sidebar / layout
 * effects. Because it owns the whole document, we can't rely on any
 * of our CSS variables or the font loader; inline everything.
 *
 * Next 16.2 prop contract: `unstable_retry` is the new retry prop.
 */
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          backgroundColor: "#0F172A",
          color: "#F1F5F9",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            textAlign: "center",
            padding: "2rem",
            borderRadius: "1rem",
            backgroundColor: "#1E293B",
            border: "1px solid #334155",
          }}
        >
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Kronos dashboard unavailable
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#94A3B8", marginBottom: "1.5rem" }}>
            A root-level error took down the dashboard shell. Try
            reloading; if it recurs, check the browser console for
            details.
          </p>
          <button
            type="button"
            onClick={retry}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#2563EB",
              color: "white",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p style={{ fontSize: "0.625rem", color: "#64748B", marginTop: "1rem", fontFamily: "monospace" }}>
              ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
