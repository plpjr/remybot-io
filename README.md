# Kronos — BTC Range-Prediction Trading Dashboard

**Kronos** is the live performance dashboard for an autonomous Bitcoin
trading bot built around **Chronos** (zero-shot range prediction, ~98%
band-accuracy) and **Kronos** (fine-tuned entry-timing model), with a
meta-learner filtering weak signals before execution. The dashboard
provides real-time visibility into bot health, paper-trade performance,
model diagnostics, risk metrics, and ongoing research.

The previous RL (MaskablePPO) approach was abandoned at ~40% win rate;
some pre-pivot research pages retain historical context.

## Features

| Section | Description |
|---|---|
| **Overview** | Live bot health (/healthz proxy), equity curve, win rate, rolling returns |
| **Trading** | Daily/weekly PnL, trade duration, hourly performance |
| **Risk** | Drawdown curve, consecutive loss distribution, Sortino/Calmar/VaR |
| **Model** | IS vs OOS comparison, action/confidence distributions, feature importance |
| **Analysis** | Volatility regime detection, BTC correlation, volume regime charts |
| **Autoresearch** | Hyperparameter sweep leaderboard (retained from pre-pivot era) |

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (static export, deployed on Cloudflare Pages)
- **UI:** React 19, Tailwind CSS 4, [Lucide React](https://lucide.dev/) icons
- **Charts:** [Apache ECharts](https://echarts.apache.org/) via `echarts-for-react`
- **Database / Realtime:** [Supabase](https://supabase.com/) (PostgreSQL + Realtime subscriptions)
- **Live Pricing:** Coinbase WebSocket (spot) + Cloudflare Pages Function (futures via Coinbase Advanced Trade API)
- **Language:** TypeScript 5

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

See `.env.example` for the full list. At minimum:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For server-side Cloudflare Pages Functions (only in CF env, not in `.env.local`):

```
KRONOS_HEALTHZ_URL=https://bot.example.com/healthz   # via Tailscale / CF Access
COINBASE_API_KEY_ID=your_coinbase_api_key_id
COINBASE_API_PRIVATE_KEY=your_coinbase_ec_private_key
```

The dashboard degrades gracefully when env vars are missing: `supabase.ts`
exports a null-object client so pages render from mock fallback rather
than crashing, and `/api/healthz` returns an "unreachable" status so
`BotHealthCard` surfaces the misconfiguration clearly.

## Project Structure

```
src/
  app/          # Next.js App Router pages + error/global-error/not-found
  components/   # Sidebar, StatCard, Chart, ThemeProvider, BotHealthCard, …
  lib/          # data.ts (Supabase queries), useBotHealth.ts, supabase.ts, mock-data.ts, echarts-theme.ts
functions/
  api/          # Cloudflare Pages Functions
    btc-price.ts    # BTC futures (auth'd) with spot fallback
    healthz.ts      # Proxies the bot's /healthz through a Tailscale / CF Access tunnel
    store-math.ts   # LiveMathDashboard write path
docs/
  audit-2026-04-16.md   # Technical audit (Next 16 + WCAG 2.2 AA)
```

See `CLAUDE.md` for a deeper orientation doc.

## Deployment

The project is configured for static export (`output: 'export'`) and is deployed via Cloudflare Pages. The GitHub Actions workflow at `.github/workflows/deploy.yml` handles CI/CD.

## Disclaimer

Performance figures shown on the dashboard are derived from backtesting and paper trading. Past performance does not guarantee future results.
