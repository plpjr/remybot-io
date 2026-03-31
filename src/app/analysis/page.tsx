"use client";

import { BarChart3 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PlaceholderCard from "@/components/PlaceholderCard";

export default function AnalysisPage() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Analysis"
        description="Market regime analysis and conditional performance"
        icon={BarChart3}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <PlaceholderCard
          title="Performance by Volatility Regime"
          description="How the bot performs in low, medium, and high volatility environments"
        />
        <PlaceholderCard
          title="Trend vs Range"
          description="Performance when BTC is trending vs consolidating"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PlaceholderCard
          title="BTC Correlation"
          description="Bot returns vs BTC price movement — alpha generation analysis"
        />
        <PlaceholderCard
          title="Volume Regime Performance"
          description="How trade volume conditions affect bot profitability"
        />
      </div>
    </div>
  );
}
