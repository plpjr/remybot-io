"use client";

interface PlaceholderCardProps {
  title: string;
  description: string;
  className?: string;
}

export default function PlaceholderCard({ title, description, className = "" }: PlaceholderCardProps) {
  return (
    <div className={`bg-zinc-900 rounded-xl border border-zinc-800 p-6 ${className}`}>
      <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
      <p className="text-xs text-zinc-500 mb-4">{description}</p>
      <div className="h-40 bg-zinc-800/50 rounded-lg border border-zinc-800 border-dashed flex items-center justify-center">
        <span className="text-xs text-zinc-600">Coming soon</span>
      </div>
    </div>
  );
}
