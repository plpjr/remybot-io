"use client";

import { useEffect, useState } from "react";

export interface ChartTheme {
  grid: string;
  tick: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipShadow: string;
  line: string;
  lineMuted: string;
}

const lightTheme: ChartTheme = {
  grid: "#f1f5f9",
  tick: "#94a3b8",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e2e8f0",
  tooltipShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  line: "#2563eb",
  lineMuted: "#94a3b8",
};

const darkTheme: ChartTheme = {
  grid: "#334155",
  tick: "#94a3b8",
  tooltipBg: "#1e293b",
  tooltipBorder: "#334155",
  tooltipShadow: "0 4px 6px -1px rgba(0,0,0,0.3)",
  line: "#60a5fa",
  lineMuted: "#64748b",
};

export function useChartTheme(): ChartTheme {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark ? darkTheme : lightTheme;
}

export function tooltipStyle(theme: ChartTheme) {
  return {
    borderRadius: "12px",
    border: `1px solid ${theme.tooltipBorder}`,
    boxShadow: theme.tooltipShadow,
    backgroundColor: theme.tooltipBg,
    color: theme.tick,
  };
}
