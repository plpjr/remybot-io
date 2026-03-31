"use client";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

export default function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3 pl-12 lg:pl-0">
      <div className="p-2.5 bg-zinc-800 rounded-lg">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
