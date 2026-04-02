# Kronos — AI-Powered BTC Trading Bot Dashboard

**Kronos** is a live performance dashboard for an autonomous Bitcoin trading bot trained with Proximal Policy Optimisation (PPO) reinforcement learning. The dashboard provides real-time visibility into trading performance, model diagnostics, risk metrics, and ongoing research experiments.

## Features

| Section | Description |
|---|---|
| **Overview** | Real-time equity curve, win rate, Sharpe ratio, and rolling returns |
| **Trading** | Microstructure analysis, daily/weekly PnL, trade duration, and hourly performance |
| **Risk** | Drawdown curve, consecutive loss distribution, Sortino/Calmar ratios, and VaR |
| **Model** | Training reward curve, IS vs OOS comparison, action/confidence distributions, and feature importance |
| **Analysis** | Volatility regime detection, BTC correlation, and volume regime charts |
| **Autoresearch** | Live hyperparameter sweep leaderboard and experiment comparison |

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

Create a `.env.local` file at the project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For the BTC futures price API (Cloudflare Pages Function), set these in your Cloudflare Pages environment:

```
COINBASE_API_KEY_ID=your_coinbase_api_key_id
COINBASE_API_PRIVATE_KEY=your_coinbase_ec_private_key
```

## Project Structure

```
src/
  app/          # Next.js App Router pages (overview, trading, risk, model, analysis, autoresearch)
  components/   # Shared UI components (Sidebar, StatCard, Chart, ThemeProvider, …)
  lib/          # Data fetching, Supabase client, hooks, mock data, ECharts themes
functions/
  api/          # Cloudflare Pages Functions (btc-price.ts)
```

## Deployment

The project is configured for static export (`output: 'export'`) and is deployed via Cloudflare Pages. The GitHub Actions workflow at `.github/workflows/deploy.yml` handles CI/CD.

## Disclaimer

Performance figures shown on the dashboard are derived from backtesting and paper trading. Past performance does not guarantee future results.
