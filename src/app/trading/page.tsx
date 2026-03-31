"use client";

import { TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PlaceholderCard from "@/components/PlaceholderCard";

export default function TradingPage() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Trading"
        description="Detailed trade analysis and PnL breakdown"
        icon={TrendingUp}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlaceholderCard
          title="Daily PnL"
          description="Profit and loss by day with calendar heatmap"
        />
        <PlaceholderCard
          title="Weekly PnL"
          description="Aggregated weekly performance over time"
        />
        <PlaceholderCard
          title="Monthly PnL"
          description="Month-over-month returns comparison"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PlaceholderCard
          title="Long vs Short Performance"
          description="Win rate, avg PnL, and trade count by direction"
        />
        <PlaceholderCard
          title="Trade Duration Analysis"
          description="Distribution of hold times and impact on PnL"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlaceholderCard
          title="Win/Loss Streaks"
          description="Longest winning and losing streaks over time"
        />
        <PlaceholderCard
          title="Profit Factor & Expectancy"
          description="Gross profit / gross loss ratio and expected value per trade"
        />
        <PlaceholderCard
          title="Slippage & Fees"
          description="Estimated execution costs and their impact on returns"
        />
      </div>

      <PlaceholderCard
        title="Hourly Heatmap"
        description="Performance broken down by hour of day and day of week — find the best and worst times to trade"
        className="col-span-full"
      />
    </div>
  );
}
