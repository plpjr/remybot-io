# Kronos Dashboard — CLAUDE.md

Orientation doc for AI agents working in this repo. Read in full before
touching code.

## What this is

`remybot.io` is the live-performance dashboard for the **Kronos** BTC
trading bot. The bot itself lives in a separate repo
(`freqtrade-bot`); this is read-only UI that renders the bot's
Supabase data plus a live `/healthz` proxy.

## Stack (current versions matter)

- **Next.js 16.2** static export → Cloudflare Pages
  - AGENTS.md warns this is NOT Next 13/14/15. Read
    `node_modules/next/dist/docs/` before writing any Next-specific
    code. Training-data APIs drift hard here.
  - Notable: `error.tsx` uses `unstable_retry` (not `reset`) as of 16.2.
- **React 19.2** — use `useSyncExternalStore` for DOM-class sync, not
  `useState` + useEffect. See `ThemeProvider.tsx` for the pattern.
- **Tailwind 4** — CSS variables in `globals.css`; dark mode via `.dark`
  class on `<html>` (pre-hydration inline script in `layout.tsx`).
- **echarts 6** via `echarts-for-react`. NOT recharts.
- **Supabase JS SDK** — client-side reads; RLS-protected.
- **Cloudflare Pages Functions** at `functions/api/` for
  server-side-at-edge work (BTC price proxy, `/healthz` proxy, math
  feature store).

## Core rules

1. **Never hardcode the Supabase anon key.** Env vars only
   (`.env.example` documents them). The null-client fallback in
   `src/lib/supabase.ts` keeps the dashboard from crashing if env is
   missing.
2. **No synthetic win-rate / inflated stats as fallback.** Zero trades
   means zero stats, honestly. The old `winRate: 82.1` fallback was a
   P0 bug — don't re-introduce.
3. **Query the current bot schema.** Bot v1.1.0 writes:
   `kronos_predictions`, `kronos_signals`, `kronos_trades`,
   `kronos_bot_status`, `market_pulse`. Do not add queries against the
   pre-pivot RL-era tables (`trade_journal`, `bot_heartbeat`,
   `equity_curve`, etc.) — they don't exist in the current DB.
4. **Semantic color lockdown.** red/green reserved for PnL, status,
   direction only. Brand accent is blue/teal. Never use red or green
   for decoration.
5. **No KPI value animations.** Never tween `$41 → $42` over 600ms —
   intermediate values are lies. Cross-fade below 120ms only.
6. **Mobile-first.** Operator checks on phone 80% of the time. Hero
   panel must read in <3 seconds on 4G.

## Architecture

```
src/
  app/          # Next.js App Router (7 pages + error/global-error/not-found)
  components/   # BotHealthCard, Sidebar, StatCard, Chart, etc.
  lib/          # data.ts (Supabase queries), useBotHealth.ts, mock-data.ts
functions/
  api/          # CF Pages Functions
    btc-price.ts   # BTC futures / spot price
    healthz.ts     # Proxies bot /healthz (Phase 3 integration)
    store-math.ts  # LiveMathDashboard write path
```

### Data flow

```
Bot VPS  ──/healthz──▶  CF Pages Fn /api/healthz  ──▶  useBotHealth  ──▶  BotHealthCard
Supabase ──REST────▶  src/lib/data.ts  ──▶  useKronosData  ──▶  pages
```

### Empty states are first-class

Every page must render gracefully when its data source returns zero
rows. Home page checks `recentPerformance.every(r => r.trades === 0)`
and shows a "No closed trades yet" empty state instead of "0% WR x4"
rows. Apply the same pattern to new pages.

## Where things live

| Topic | Path |
|---|---|
| Env vars | `.env.example` (shape); set in CF Pages or `.env.local` |
| Supabase client + null-fallback | `src/lib/supabase.ts` |
| Typed data queries | `src/lib/data.ts` |
| Polled bot health | `src/lib/useBotHealth.ts` + `components/BotHealthCard.tsx` |
| Theme handling | `src/components/ThemeProvider.tsx` (uses `useSyncExternalStore`) |
| Design tokens | `src/app/globals.css` (CSS vars) |
| Deploy runbook | `DEPLOY.md` |
| Technical audit | `docs/audit-2026-04-16.md` |
| Original improvement plan | `PLAN.md` (phases 1-4 shipped pre-2026-04-16) |

## Verification before any PR

```bash
npx tsc --noEmit   # must be clean
npm run lint       # LiveMathDashboard has 1 pre-existing error — ignore unless you touched it
npm run build      # all 7 routes must prerender
```

Don't wire PR auto-merge — Cloudflare Pages gives every branch a
preview URL; click through before merging.

## When you finish

1. Commit with Conventional Commits format
2. Push to master (repo is trunk-based for now)
3. Cloudflare rebuilds; verify preview URL manually before calling done

## The trading bot (freqtrade-bot) is separate

If you need to understand *why* this dashboard looks the way it does,
read `/Users/plpjr/Documents/freqtrade-bot/docs/adr/0001-rl-to-range-prediction-pivot.md`
first. The short version: MaskablePPO RL was abandoned at 40% WR;
replaced with Chronos (98% range prediction) + Kronos (entry timing) +
meta-learner. Every RL-era page / metric / copy string in this repo
is either gone or being phased out.
