"use client";

export default function StatusBadge({ status }: { status: string }) {
  const isRunning = status === "running";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        isRunning
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
          : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isRunning ? "bg-emerald-500 animate-pulse" : "bg-red-500"
        }`}
      />
      {isRunning ? "Live" : "Offline"}
    </span>
  );
}
