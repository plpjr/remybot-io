"use client";

import { useEffect, useState, useRef } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart, BarChart, ScatterChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { lightEChartsTheme, darkEChartsTheme } from "@/lib/echarts-theme";
import type { EChartsOption } from "echarts";

// Register only the components we need
echarts.use([
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

// Register themes
echarts.registerTheme("kronos-light", lightEChartsTheme);
echarts.registerTheme("kronos-dark", darkEChartsTheme);

interface ChartProps {
  option: EChartsOption;
  height?: number | string;
  className?: string;
  notMerge?: boolean;
}

export default function Chart({ option, height = 300, className = "", notMerge = true }: ChartProps) {
  const [isDark, setIsDark] = useState(false);
  const chartRef = useRef<ReactEChartsCore>(null);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Resize on window resize
  useEffect(() => {
    const handleResize = () => {
      chartRef.current?.getEchartsInstance()?.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const themeName = isDark ? "kronos-dark" : "kronos-light";

  // Merge common defaults into option
  const mergedOption: EChartsOption = {
    animation: true,
    animationDuration: 400,
    animationEasing: "cubicOut",
    tooltip: {
      trigger: "axis",
      ...(typeof option.tooltip === "object" && !Array.isArray(option.tooltip) ? option.tooltip : {}),
    },
    grid: {
      left: 12,
      right: 12,
      top: 16,
      bottom: 12,
      containLabel: true,
      ...(typeof option.grid === "object" && !Array.isArray(option.grid) ? option.grid : {}),
    },
    ...option,
  };

  return (
    <ReactEChartsCore
      ref={chartRef}
      echarts={echarts}
      option={mergedOption}
      theme={themeName}
      notMerge={notMerge}
      style={{ height: typeof height === "number" ? `${height}px` : height, width: "100%" }}
      className={className}
      opts={{ renderer: "canvas" }}
    />
  );
}

// Re-export echarts for use in page-level option building
export { echarts };
export type { EChartsOption };
