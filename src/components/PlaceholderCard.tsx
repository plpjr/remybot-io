"use client";

interface PlaceholderCardProps {
  title: string;
  description: string;
  className?: string;
}

export default function PlaceholderCard({ title, description, className = "" }: PlaceholderCardProps) {
  return (
    <div className={`bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm p-6 ${className}`}>
      <h4 className="text-sm font-semibold text-[var(--text)] mb-1">{title}</h4>
      <p className="text-xs text-[var(--text-muted)] mb-4">{description}</p>
      <div className="h-40 bg-[var(--surface)] rounded-xl border border-[var(--border)] border-dashed flex items-center justify-center">
        <span className="text-xs text-[var(--text-muted)] opacity-60">Coming soon</span>
      </div>
    </div>
  );
}
