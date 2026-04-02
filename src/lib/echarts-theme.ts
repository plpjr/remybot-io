export const lightEChartsTheme = {
  color: ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
  backgroundColor: "transparent",
  textStyle: { color: "#64748b", fontFamily: "inherit" },
  title: { textStyle: { color: "#0f172a" }, subtextStyle: { color: "#64748b" } },
  line: {
    itemStyle: { borderWidth: 2 },
    lineStyle: { width: 2.5 },
    symbolSize: 0,
    smooth: false,
  },
  bar: {
    itemStyle: { barBorderRadius: [4, 4, 0, 0] },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#e2e8f0" } },
    axisTick: { lineStyle: { color: "#e2e8f0" } },
    axisLabel: { color: "#94a3b8", fontSize: 11 },
    splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" as const } },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "#94a3b8", fontSize: 11 },
    splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" as const } },
  },
  tooltip: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    textStyle: { color: "#334155", fontSize: 12 },
    extraCssText: "border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);",
  },
  legend: {
    textStyle: { color: "#64748b", fontSize: 12 },
  },
  grid: {
    left: 12,
    right: 12,
    top: 16,
    bottom: 12,
    containLabel: true,
  },
};

export const darkEChartsTheme = {
  color: ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6"],
  backgroundColor: "transparent",
  textStyle: { color: "#94a3b8", fontFamily: "inherit" },
  title: { textStyle: { color: "#f1f5f9" }, subtextStyle: { color: "#94a3b8" } },
  line: {
    itemStyle: { borderWidth: 2 },
    lineStyle: { width: 2.5 },
    symbolSize: 0,
    smooth: false,
  },
  bar: {
    itemStyle: { barBorderRadius: [4, 4, 0, 0] },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#334155" } },
    axisTick: { lineStyle: { color: "#334155" } },
    axisLabel: { color: "#94a3b8", fontSize: 11 },
    splitLine: { lineStyle: { color: "#334155", type: "dashed" as const } },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "#94a3b8", fontSize: 11 },
    splitLine: { lineStyle: { color: "#334155", type: "dashed" as const } },
  },
  tooltip: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    borderWidth: 1,
    textStyle: { color: "#e2e8f0", fontSize: 12 },
    extraCssText: "border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);",
  },
  legend: {
    textStyle: { color: "#94a3b8", fontSize: 12 },
  },
  grid: {
    left: 12,
    right: 12,
    top: 16,
    bottom: 12,
    containLabel: true,
  },
};
