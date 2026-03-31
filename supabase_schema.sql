-- Kronos Dashboard Schema
-- Run this in Supabase SQL Editor after restoring the project

-- Trades table: every bot trade
CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    trade_id TEXT UNIQUE,
    pair TEXT NOT NULL DEFAULT 'BTC/USD:USD',
    direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    entry_price DOUBLE PRECISION,
    exit_price DOUBLE PRECISION,
    pnl_bps DOUBLE PRECISION,
    pnl_usd DOUBLE PRECISION,
    duration_minutes DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    exit_reason TEXT,
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily aggregated stats
CREATE TABLE IF NOT EXISTS daily_stats (
    id BIGSERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    pnl_pct DOUBLE PRECISION,
    pnl_usd DOUBLE PRECISION,
    trade_count INTEGER,
    win_count INTEGER,
    loss_count INTEGER,
    win_rate DOUBLE PRECISION,
    avg_pnl_bps DOUBLE PRECISION,
    max_drawdown DOUBLE PRECISION,
    sharpe_ratio DOUBLE PRECISION,
    equity DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training runs: each model training session
CREATE TABLE IF NOT EXISTS training_runs (
    id BIGSERIAL PRIMARY KEY,
    run_id TEXT UNIQUE,
    model_version TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    epochs INTEGER,
    final_reward DOUBLE PRECISION,
    is_win_rate DOUBLE PRECISION,
    is_avg_pnl DOUBLE PRECISION,
    is_sharpe DOUBLE PRECISION,
    oos_win_rate DOUBLE PRECISION,
    oos_avg_pnl DOUBLE PRECISION,
    oos_sharpe DOUBLE PRECISION,
    config JSONB,
    reward_curve JSONB,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Autoresearch experiments
CREATE TABLE IF NOT EXISTS experiments (
    id BIGSERIAL PRIMARY KEY,
    sweep_name TEXT NOT NULL,
    experiment_name TEXT NOT NULL,
    mean_bps DOUBLE PRECISION,
    std_bps DOUBLE PRECISION,
    seed_results JSONB,
    fold_results JSONB,
    config JSONB,
    rank INTEGER,
    status TEXT DEFAULT 'completed',
    duration_seconds DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sweep_name, experiment_name)
);

-- Model snapshots: periodic health metrics
CREATE TABLE IF NOT EXISTS model_snapshots (
    id BIGSERIAL PRIMARY KEY,
    snapshot_time TIMESTAMPTZ DEFAULT NOW(),
    model_version TEXT,
    win_rate DOUBLE PRECISION,
    avg_pnl_bps DOUBLE PRECISION,
    sharpe_ratio DOUBLE PRECISION,
    max_drawdown DOUBLE PRECISION,
    profit_factor DOUBLE PRECISION,
    sortino_ratio DOUBLE PRECISION,
    exposure_pct DOUBLE PRECISION,
    action_distribution JSONB,
    feature_importance JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_direction ON trades(direction);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_experiments_sweep ON experiments(sweep_name);
CREATE INDEX IF NOT EXISTS idx_training_runs_version ON training_runs(model_version);

-- Enable RLS but allow public read for dashboard
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies: anon can read (for dashboard), service_role can do everything (for bot/scripts)
DO $$ BEGIN
  CREATE POLICY anon_read_trades ON trades FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_daily_stats ON daily_stats FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_training_runs ON training_runs FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_experiments ON experiments FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_model_snapshots ON model_snapshots FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
