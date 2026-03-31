"use client";

interface PlaceholderCardProps {
  title: string;
  description: string;
  className?: string;
}

export default function PlaceholderCard({ title, description, className = "" }: PlaceholderCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}>
      <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 mb-4">{description}</p>
      <div className="h-40 bg-slate-50 rounded-xl border border-slate-100 border-dashed flex items-center justify-center">
        <span className="text-xs text-slate-400">Coming soon</span>
      </div>
    </div>
  );
}
