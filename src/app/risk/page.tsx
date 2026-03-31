"use client";

import { ShieldCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PlaceholderCard from "@/components/PlaceholderCard";

export default function RiskPage() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Risk"
        description="Drawdown analysis and risk-adjusted performance metrics"
        icon={ShieldCheck}
      />

      <PlaceholderCard
        title="Drawdown Chart"
        description="Maximum drawdown over time with underwater equity curve"
        className="col-span-full"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlaceholderCard
          title="Drawdown Duration"
          description="Time spent in drawdown and recovery periods"
        />
        <PlaceholderCard
          title="Value at Risk (VaR)"
          description="95th and 99th percentile daily loss estimates"
        />
        <PlaceholderCard
          title="Exposure Time"
          description="Percentage of time the bot has open positions"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PlaceholderCard
          title="Risk-Adjusted Returns"
          description="Sortino ratio, Calmar ratio, and risk/reward metrics"
        />
        <PlaceholderCard
          title="Consecutive Loss Analysis"
          description="Distribution and frequency of consecutive losing trades"
        />
      </div>
    </div>
  );
}
