"use client";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

export default function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3 pl-12 lg:pl-0">
      <div className="p-2.5 bg-blue-50 dark:bg-blue-950 rounded-xl">
        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)]">{title}</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">{description}</p>
      </div>
    </div>
  );
}
