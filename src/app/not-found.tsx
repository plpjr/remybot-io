import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="px-6 py-16 max-w-xl mx-auto">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center shadow-sm">
        <Search
          className="w-10 h-10 text-[var(--text-muted)] opacity-40 mx-auto mb-4"
          aria-hidden="true"
        />
        <h1 className="text-lg font-semibold text-[var(--text)] mb-1">
          Page not found
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          The path you asked for isn&apos;t part of the Kronos dashboard.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
        >
          Back to Overview
        </Link>
      </div>
    </div>
  );
}
