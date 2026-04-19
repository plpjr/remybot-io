"use client";

import { Activity } from "lucide-react";
import type { LatestModelVotes, ModelVotes } from "@/lib/data";

interface ModelChorusCardProps {
  latest: LatestModelVotes;
}

function fmtConf(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const pct = v > 1 ? v : v * 100;
  return `${pct.toFixed(0)}%`;
}

function fmtNum(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toFixed(digits);
}

function directionIcon(side: string | null | undefined): string {
  if (side === "long" || side === "up") return "▲";
  if (side === "short" || side === "down") return "▼";
  return "—";
}

function ChorusRow({
  name,
  vote,
  detail,
  accent,
}: {
  name: string;
  vote: string;
  detail?: string;
  accent?: "long" | "short" | "hold" | "accepted" | "rejected" | "neutral";
}) {
  const accentCls =
    accent === "long" || accent === "accepted"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "short" || accent === "rejected"
        ? "text-red-600 dark:text-red-400"
        : accent === "hold"
          ? "text-amber-600 dark:text-amber-400"
          : "text-[var(--text)]";
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide min-w-[120px]">
        {name}
      </span>
      <div className="text-right flex-1">
        <p className={`text-sm font-semibold ${accentCls}`}>{vote}</p>
        {detail && (
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{detail}</p>
        )}
      </div>
    </div>
  );
}

function renderChronos(v: ModelVotes["chronos"]): {
  vote: string;
  detail: string;
  accent: "long" | "short" | "neutral";
} {
  if (!v) return { vote: "no prediction", detail: "", accent: "neutral" };
  const bias = v.direction_bias;
  const accent = bias === "up" ? "long" : bias === "down" ? "short" : "neutral";
  return {
    vote: `range ${fmtNum(v.range_bps, 0)} bps · ${bias ?? "—"} ${directionIcon(bias)}`,
    detail: `${fmtConf(v.confidence)} conf · close $${fmtNum(v.predicted_close, 0)}`,
    accent,
  };
}

function renderKronos(v: ModelVotes["kronos_5m"]): {
  vote: string;
  detail: string;
  accent: "long" | "short" | "neutral";
} {
  if (!v) return { vote: "no vote", detail: "", accent: "neutral" };
  const accent =
    v.entry_side === "long"
      ? "long"
      : v.entry_side === "short"
        ? "short"
        : "neutral";
  return {
    vote: `${v.pattern} → ${v.entry_side} ${directionIcon(v.entry_side)}`,
    detail: `${fmtConf(v.confidence)} conf`,
    accent,
  };
}

function renderTA(ta: ModelVotes["ta"]): string {
  const parts: string[] = [];
  if (ta?.rsi !== undefined) {
    parts.push(
      `RSI ${fmtNum(ta.rsi, 1)}${
        ta.rsi < 30 ? " ▼" : ta.rsi > 70 ? " ▲" : ""
      }`,
    );
  }
  if (ta?.macd_hist !== undefined) {
    parts.push(
      `MACD-H ${fmtNum(ta.macd_hist, 2)}${ta.macd_hist < 0 ? " ▼" : " ▲"}`,
    );
  }
  if (ta?.atr_pct !== undefined) parts.push(`ATR ${fmtNum(ta.atr_pct, 1)}`);
  return parts.join(" · ") || "no TA data";
}

/**
 * Model Chorus — the flagship "how the bot is performing" card on /.
 * One row per signal source + final decision, using the most recent
 * `kronos_paper_predictions.model_votes` jsonb.
 */
export default function ModelChorusCard({ latest }: ModelChorusCardProps) {
  const votes = latest.model_votes;

  if (!votes) {
    return (
      <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-[var(--text)]">
            Model Chorus
          </h2>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Per-model votes for the most recent 5-minute cycle
        </p>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] text-center px-4 py-10">
          <p className="text-sm font-medium text-[var(--text)]">
            Waiting for next cycle
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
            The bot is still populating <code>model_votes</code>. Chorus
            will appear automatically within ~5 minutes of the next
            decision cycle.
          </p>
        </div>
      </section>
    );
  }

  const chronos = renderChronos(votes.chronos);
  const k5m = renderKronos(votes.kronos_5m);
  const k1h = renderKronos(votes.kronos_1h);
  const k1m = renderKronos(votes.kronos_1m);

  const consensus = votes.kronos_consensus;
  const consensusVote = consensus
    ? consensus.direction
      ? `${consensus.direction} (${fmtConf(consensus.strength)} strength)`
      : "disagreement"
    : "—";
  const consensusAccent: "long" | "short" | "hold" | "neutral" = consensus?.direction === "up"
    ? "long"
    : consensus?.direction === "down"
      ? "short"
      : consensus?.direction === "flat"
        ? "hold"
        : "neutral";

  const funding = votes.funding;
  const fundingVote = funding
    ? `${funding.signal} · ${funding.rate_bps >= 0 ? "+" : ""}${fmtNum(funding.rate_bps, 2)} bps`
    : "no data";

  const regime = votes.regime;
  const ml = votes.meta_learner;

  const finalAccent: "long" | "short" | "hold" | "neutral" =
    votes.final.action === "long"
      ? "long"
      : votes.final.action === "short"
        ? "short"
        : votes.final.action === "hold"
          ? "hold"
          : "neutral";

  const ts = latest.timestamp
    ? new Date(latest.timestamp).toISOString().slice(0, 19).replace("T", " ")
    : "—";

  return (
    <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 animate-in">
      <div className="flex items-start justify-between mb-1 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Model Chorus
            </h2>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Per-model votes for the most recent cycle
          </p>
        </div>
        <p className="text-xs font-mono text-[var(--text-muted)] shrink-0">
          {ts} UTC
        </p>
      </div>

      <div className="mt-4 space-y-0">
        <ChorusRow
          name="Chronos"
          vote={chronos.vote}
          detail={chronos.detail}
          accent={chronos.accent}
        />
        <ChorusRow
          name="Kronos 5m"
          vote={k5m.vote}
          detail={k5m.detail}
          accent={k5m.accent}
        />
        <ChorusRow
          name="Kronos 1h"
          vote={k1h.vote}
          detail={k1h.detail}
          accent={k1h.accent}
        />
        <ChorusRow
          name="Kronos 1m"
          vote={k1m.vote}
          detail={k1m.detail}
          accent={k1m.accent}
        />
        <ChorusRow
          name="Consensus"
          vote={consensusVote}
          accent={consensusAccent}
        />
        <ChorusRow name="TA" vote={renderTA(votes.ta)} accent="neutral" />
        <ChorusRow
          name="Funding"
          vote={fundingVote}
          accent={
            funding?.signal === "long"
              ? "long"
              : funding?.signal === "short"
                ? "short"
                : "neutral"
          }
        />
        <ChorusRow
          name="Regime"
          vote={regime ? regime.name : "unknown"}
          detail={
            regime?.adx !== undefined ? `ADX ${fmtNum(regime.adx, 1)}` : undefined
          }
          accent="neutral"
        />
        <ChorusRow
          name="Meta-Learner"
          vote={
            ml
              ? `${fmtConf(ml.probability)} → ${ml.accepted ? "accepted" : "rejected"}`
              : "not available"
          }
          detail={ml ? `threshold ${fmtConf(ml.threshold)}` : undefined}
          accent={
            ml ? (ml.accepted ? "accepted" : "rejected") : "neutral"
          }
        />
      </div>

      {/* Final decision — emphasized */}
      <div
        className={`mt-4 rounded-xl p-4 border ${
          finalAccent === "long"
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
            : finalAccent === "short"
              ? "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800"
              : finalAccent === "hold"
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
      </div>
    </section>
  );
}
