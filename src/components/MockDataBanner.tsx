import { AlertTriangle } from "lucide-react";

export default function MockDataBanner() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-sm animate-in">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        Showing simulated data. Live Supabase integration coming soon.
      </span>
    </div>
  );
}
