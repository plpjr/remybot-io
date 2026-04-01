"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ShieldCheck,
  Brain,
  BarChart3,
  FlaskConical,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Trading", href: "/trading", icon: TrendingUp },
  { name: "Risk", href: "/risk", icon: ShieldCheck },
  { name: "Model", href: "/model", icon: Brain },
  { name: "Analysis", href: "/analysis", icon: BarChart3 },
  { name: "Autoresearch", href: "/autoresearch", icon: FlaskConical },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] shadow-sm transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 dark:bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--card)] border-r border-[var(--border)] z-50 flex flex-col transition-transform duration-200 shadow-sm ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text)] tracking-tight">Kronos</h1>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Trading Bot</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status indicator */}
        <div className="mx-4 mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-100 dark:border-blue-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">Research Phase</span>
          </div>
          <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-1">Model v6.1-PPO</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[var(--border)] space-y-3">
          <button
            onClick={toggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-4 h-4" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" />
                Light Mode
              </>
            )}
          </button>
          <p className="text-[10px] text-[var(--text-muted)] text-center opacity-60">
            Powered by Reinforcement Learning
          </p>
        </div>
      </aside>
    </>
  );
}
