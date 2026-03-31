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
} from "lucide-react";

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

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 shadow-sm transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-200 shadow-sm ${
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
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Kronos</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Trading Bot</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status indicator */}
        <div className="mx-4 mb-4 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-blue-700 font-medium">Live Trading</span>
          </div>
          <p className="text-[10px] text-blue-400 mt-1">Model v6.1-PPO</p>
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
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-blue-600" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center">
            Powered by Reinforcement Learning
          </p>
        </div>
      </aside>
    </>
  );
}
