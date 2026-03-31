"use client";

import { Brain } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PlaceholderCard from "@/components/PlaceholderCard";

export default function ModelPage() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Model"
        description="Training performance and model diagnostics"
        icon={Brain}
      />

      <PlaceholderCard
        title="Training Reward Curve"
        description="Episode reward over training epochs for the latest model"
        className="col-span-full"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <PlaceholderCard
          title="In-Sample vs Out-of-Sample"
          description="Performance comparison between training and holdout data"
        />
        <PlaceholderCard
          title="Action Distribution"
          description="Breakdown of long / short / neutral actions over time"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlaceholderCard
          title="Confidence Distribution"
          description="Model prediction confidence histogram and calibration"
        />
        <PlaceholderCard
          title="Feature Importance"
          description="Which inputs the model relies on most for decisions"
        />
        <PlaceholderCard
          title="Weekly Retraining"
          description="Performance delta after each Friday retraining cycle"
        />
      </div>
    </div>
  );
}
