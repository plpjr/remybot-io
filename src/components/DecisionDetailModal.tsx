"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ModelVotes } from "@/lib/data";

interface DecisionDetailModalProps {
  open: boolean;
  onClose: () => void;
  timestamp: string | null;
  votes: ModelVotes | null;
  decisionAction?: string;
  decisionReason?: string;
}

/** Format a confidence value that can be 0..1 or 0..100 as a clean pct. */
function fmtConf(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const pct = v > 1 ? v : v * 100;
  return `${pct.toFixed(1)}%`;
}

function fmtNum(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toFixed(digits);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide min-w-[140px]">
        {label}
      </span>
      <div className="text-sm text-[var(--text)] text-right flex-1">
        {children}
      </div>
    </div>
  );
}

/**
 * Renders the full `model_votes` jsonb for a single cycle. When
 * `votes` is null (cycle predates Track B migration), we show an
 * honest explanation rather than rendering an empty skeleton.
 */
export default function DecisionDetailModal({
  open,
  onClose,
  timestamp,
  votes,
  decisionAction,
  decisionReason,
}: DecisionDetailModalProps) {
  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const ts = timestamp ? timestamp.slice(0, 19).replace("T", " ") + " UTC" : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Decision detail"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[var(--card)] flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Decision Detail
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">{ts}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close decision detail"
            className="p-1.5 rounded-lg hover:bg-[var(--bg)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!votes ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--text)]">
              No model_votes for this cycle
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
              This cycle pre-dates the model_votes schema (older than
              2026-04-19). Newer cycles will show the full per-model
              breakdown here.
            </p>
            {(decisionAction || decisionReason) && (
              <div className="mt-6 inline-block text-left text-xs text-[var(--text-muted)] bg-[var(--bg)] rounded-lg px-4 py-3 border border-[var(--border)]">
                <div>
                  <span className="font-semibold">Action:</span>{" "}
                  {decisionAction || "—"}
                </div>
                <div>
                  <span className="font-semibold">Reason:</span>{" "}
                  {decisionReason || "—"}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-5 space-y-6">
            {/* Final decision — biggest callout */}
            <section
              className={`rounded-xl p-4 border ${
                votes.final.action === "long"
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
                  : votes.final.action === "short"
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800"
                    : votes.final.action === "close"
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800"
                      : "bg-[var(--bg)] border-[var(--border)]"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                Final Decision
              </p>
              <p className="text-xl font-bold capitalize text-[var(--text)] mt-0.5">
                {votes.final.action} · {fmtConf(votes.final.confidence)}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {votes.final.reason}
              </p>
            </section>

            {/* Chronos */}
            <section>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-2">
                Chronos (range predictor)
              </h3>
              {votes.chronos ? (
                <div className="rounded-lg border border-[var(--border)] px-4 py-1 bg-[var(--bg)]">
                  <Row label="Predicted High">
                    <span className="font-mono">
                      ${fmtNum(votes.chronos.predicted_high)}
                    </span>
                  </Row>
                  <Row label="Predicted Low">
                    <span className="font-mono">
                      ${fmtNum(votes.chronos.predicted_low)}
                    </span>
                  </Row>
                  <Row label="Predicted Close">
                    <span className="font-mono">
                      ${fmtNum(votes.chronos.predicted_close)}
                    </span>
                  </Row>
                  <Row label="Range (bps)">
                    <span className="font-mono">
                      {fmtNum(votes.chronos.range_bps, 1)}
                    </span>
                  </Row>
                  <Row label="Confidence">
                    {fmtConf(votes.chronos.confidence)}
                  </Row>
                  <Row label="Direction Bias">
                    <span className="capitalize">
                      {votes.chronos.direction_bias ?? "—"}
                    </span>
                  </Row>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic">
                  Chronos did not produce a vote this cycle.
                </p>
              )}
            </section>

            {/* Kronos timeframes + consensus */}
            <section>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-2">
                Kronos (entry timing)
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["5m", votes.kronos_5m],
                    ["1h", votes.kronos_1h],
                    ["1m", votes.kronos_1m],
                  ] as const
                ).map(([tf, vote]) => (
                  <div
                    key={tf}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"
                  >
                    <p className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                      {tf}
                    </p>
                    {vote ? (
                      <>
                        <p className="text-xs text-[var(--text)] font-mono mt-1">
                          {vote.pattern}
                        </p>
                        <p className="text-xs text-[var(--text)] capitalize mt-0.5">
                          → {vote.entry_side}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {fmtConf(vote.confidence)}
                        </p>
                      </>
                    ) : (
                      <p className="text-[10px] text-[var(--text-muted)] italic mt-1">
                        no vote
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {votes.kronos_consensus && (
                <div className="mt-2 text-xs text-[var(--text-muted)]">
                  Consensus:{" "}
                  <span className="font-semibold text-[var(--text)] capitalize">
                    {votes.kronos_consensus.direction ?? "disagreement"}
                  </span>{" "}
                  (strength {fmtConf(votes.kronos_consensus.strength)})
                </div>
              )}
            </section>

            {/* TA features */}
            <section>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-2">
                TA Features
              </h3>
              <div className="rounded-lg border border-[var(--border)] px-4 py-1 bg-[var(--bg)]">
                <Row label="RSI">{fmtNum(votes.ta?.rsi, 1)}</Row>
                <Row label="MACD Hist">{fmtNum(votes.ta?.macd_hist, 2)}</Row>
                <Row label="ATR %">{fmtNum(votes.ta?.atr_pct, 2)}</Row>
                <Row label="ADX">{fmtNum(votes.ta?.adx, 1)}</Row>
                <Row label="BB %B">{fmtNum(votes.ta?.bb_pct_b, 2)}</Row>
              </div>
            </section>

            {/* Funding / Regime / Liquidation in a compact grid */}
            <section>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-2">
                Context
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                  <p className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                    Funding
                  </p>
                  {votes.funding ? (
                    <>
                      <p className="text-xs text-[var(--text)] capitalize mt-1">
                        {votes.funding.signal}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        rate {fmtNum(votes.funding.rate_bps, 1)} bps
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        z {fmtNum(votes.funding.zscore, 2)}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-[var(--text-muted)] italic mt-1">
                      no data
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                  <p className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                    Regime
                  </p>
                  {votes.regime ? (
                    <>
                      <p className="text-xs text-[var(--text)] capitalize mt-1">
                        {votes.regime.name}
                      </p>
                      {votes.regime.adx !== undefined && (
                        <p className="text-[10px] text-[var(--text-muted)]">
                          ADX {fmtNum(votes.regime.adx, 1)}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-[var(--text-muted)] italic mt-1">
                      no data
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                  <p className="text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                    Liquidation
                  </p>
                  {votes.liquidation ? (
                    <>
                      <p className="text-xs text-[var(--text)] capitalize mt-1">
                        {votes.liquidation.signal}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        intensity {fmtNum(votes.liquidation.intensity, 2)}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-[var(--text-muted)] italic mt-1">
                      no data
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Adaptive weights */}
            <section>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-2">
                Adaptive Weights
              </h3>
              {Object.keys(votes.adaptive_weights ?? {}).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">
                  No adaptive weight snapshot.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(votes.adaptive_weights).map(([name, w]) => (
                    <div key={name} className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--text-muted)] min-w-[160px]">
                        {name}
                      </span>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, w * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[var(--text)] min-w-[50px] text-right">
                        {fmtNum(w, 2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
