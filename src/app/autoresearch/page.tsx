"use client";

import { FlaskConical } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PlaceholderCard from "@/components/PlaceholderCard";

export default function AutoresearchPage() {
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Autoresearch"
        description="Automated experiment results and hyperparameter exploration"
        icon={FlaskConical}
      />

      <PlaceholderCard
        title="Experiment Leaderboard"
        description="Ranked results from the latest autoresearch sweep — mean bps, std, and per-seed breakdown"
        className="col-span-full"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <PlaceholderCard
          title="Reward Shaping Comparisons"
          description="Side-by-side comparison of different reward function configurations"
        />
        <PlaceholderCard
          title="Hyperparameter Sensitivity"
          description="How changes to learning rate, clip range, and other hyperparams affect performance"
        />
      </div>

      <PlaceholderCard
        title="Seed Variance Analysis"
        description="Distribution of results across random seeds — identify stable vs lucky configurations"
        className="col-span-full"
      />
    </div>
  );
}
