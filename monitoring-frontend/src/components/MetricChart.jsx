import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";

/**
 * METRIC CHART (REDESIGNED WITH ECHARTS)
 * 
 * ✓ Enhanced visual design
 * ✓ Better color scheme
 * ✓ Improved typography
 * ✓ Stats display with current/avg/peak
 * ✓ Color-coded thresholds
 */

export default function MetricChart({
  title = "",
  dataKey,
  data = [],
  alertMarkers = [],
  height = 140,
}) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const hasData = Array.isArray(data) && data.length > 0;

  /* ================= STATS CALCULATION ================= */
  const stats = useMemo(() => {
    if (!hasData) return { current: 0, avg: 0, max: 0 };

    const values = data
      .map((d) => (typeof d[dataKey] === "number" ? d[dataKey] : null))
      .filter((v) => v !== null && !isNaN(v));

    if (!values.length) return { current: 0, avg: 0, max: 0 };

    const current = Math.round(values[values.length - 1]);
    const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
    const max = Math.round(Math.max(...values));

    return { current, avg, max };
  }, [data, dataKey, hasData]);

  /* ================= DYNAMIC COLOR BASED ON VALUE ================= */
  const getColorScheme = (value) => {
    if (value >= 90) {
      return {
        line: "#fb7185",
        area: ["rgba(251, 113, 133, 0.3)", "rgba(251, 113, 133, 0.01)"],
        text: "text-rose-400",
      };
    }
    if (value >= 75) {
      return {
        line: "#fbbf24",
        area: ["rgba(251, 191, 36, 0.3)", "rgba(251, 191, 36, 0.01)"],
        text: "text-amber-400",
      };
    }
    return {
      line: "#34d399",
      area: ["rgba(52, 211, 153, 0.3)", "rgba(52, 211, 153, 0.01)"],
      text: "text-emerald-400",
    };
  };

  const colorScheme = getColorScheme(stats.current);

  /* ================= METRIC SERIES ================= */
  const seriesData = useMemo(() => {
    if (!hasData) return [];

    return data.map((d) => {
      const timestamp = d.timestamp || d.createdAt;
      const value = typeof d[dataKey] === "number" ? d[dataKey] : null;
      return [new Date(timestamp).getTime(), value];
    });
  }, [data, dataKey, hasData]);

  /* ================= DYNAMIC Y-AXIS ================= */
  const yAxisRange = useMemo(() => {
    if (!seriesData.length) return { min: 0, max: 100 };

    const values = seriesData
      .map(([, value]) => value)
      .filter((v) => v !== null && !isNaN(v));

    if (!values.length) return { min: 0, max: 100 };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 10;

    return {
      min: Math.max(0, Math.floor(min - padding)),
      max: Math.ceil(max + padding),
    };
  }, [seriesData]);

  /* ================= ALERT OVERLAYS ================= */
  const alertLines = useMemo(() => {
    if (!Array.isArray(alertMarkers) || !alertMarkers.length) return [];

    return alertMarkers.map((a) => ({
      xAxis: new Date(a.createdAt).getTime(),
      label: {
        formatter: a.type || "ALERT",
        color: "#ef4444",
        fontSize: 10,
        position: "insideStartTop",
      },
      lineStyle: {
        color: "#ef4444",
        type: "dashed",
        width: 1,
      },
    }));
  }, [alertMarkers]);

  /* ================= INIT + UPDATE ================= */
  useEffect(() => {
    if (!chartRef.current) return;

    // Init once
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, "dark");
    }

    const chart = chartInstanceRef.current;

    const option = {
      backgroundColor: "transparent",
      animation: true,
      animationDuration: 300,

      grid: {
        top: 8,
        left: 42,
        right: 12,
        bottom: 28,
        containLabel: true,
      },

      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "line",
          lineStyle: { 
            color: "#475569",
            width: 1,
            type: "solid"
          },
        },
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderColor: "#334155",
        borderWidth: 1,
        textStyle: {
          color: "#e2e8f0",
          fontSize: 11,
        },
        padding: [6, 10],
        formatter: (params) => {
          if (!params || !params.length) return "";
          const point = params[0];
          const date = new Date(point.value[0]);
          const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
          const value = point.value[1] !== null ? Math.round(point.value[1]) : "N/A";
          return `<div style="font-weight: 600;">${time}</div><div style="margin-top: 2px;">${title}: <span style="color: ${colorScheme.line};">${value}%</span></div>`;
        },
      },

      xAxis: {
        type: "time",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#64748b",
          fontSize: 10,
          formatter: (value) => {
            const date = new Date(value);
            return `${date.getHours().toString().padStart(2, "0")}:${date
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
          },
          interval: "auto",
          showMaxLabel: true,
          showMinLabel: true,
        },
        splitLine: {
          show: false,
        },
      },

      yAxis: {
        type: "value",
        min: yAxisRange.min,
        max: yAxisRange.max,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#64748b",
          fontSize: 10,
          formatter: (value) => Math.round(value).toString(),
        },
        splitLine: {
          lineStyle: {
            color: "#1e293b",
            type: "solid",
            width: 1,
          },
        },
      },

      series: [
        {
          name: title,
          type: "line",
          smooth: 0.3,
          showSymbol: false,
          data: seriesData,
          lineStyle: {
            color: colorScheme.line,
            width: 2.5,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: colorScheme.area[0] },
                { offset: 1, color: colorScheme.area[1] },
              ],
            },
          },
          markLine: alertLines.length
            ? {
                symbol: "none",
                data: alertLines,
                animation: false,
              }
            : undefined,
        },
      ],
    };

    chart.setOption(option, { notMerge: true });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [seriesData, alertLines, title, yAxisRange, colorScheme]);

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  /* ================= EMPTY STATE ================= */
  if (!hasData) {
    return (
      <div style={{ height: height + 60 }} className="rounded-lg border border-slate-800/50 bg-slate-800/30 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-xs text-slate-500">No data available</p>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-3">
      {/* STATS ROW */}
      <div className="flex items-end justify-between">
        <div>
          <div className={`text-3xl font-bold ${colorScheme.text}`}>
            {stats.current}%
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>Avg: {stats.avg}%</span>
            <span>•</span>
            <span>Peak: {stats.max}%</span>
          </div>
        </div>

        {alertMarkers.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20">
            <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium text-rose-400">
              {alertMarkers.length}
            </span>
          </div>
        )}
      </div>

      {/* CHART */}
      <div className="rounded-lg border border-slate-800/50 bg-slate-800/30 p-3">
        <div ref={chartRef} style={{ height }} className="w-full" />
      </div>
    </div>
  );
}
