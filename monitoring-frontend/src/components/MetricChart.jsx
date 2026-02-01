import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";

/**
 * METRIC CHART
 * - CPU / Memory chart
 * - Heading + stats + alert markers
 * - Works with mock + socket data
 */

export default function MetricChart({
  title,
  dataKey,
  data = [],
  alertMarkers = [],
  height = 140,
}) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const hasData = Array.isArray(data) && data.length > 0;

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    if (!hasData) return { current: 0, avg: 0, max: 0 };

    const values = data
      .map((d) => d[dataKey])
      .filter((v) => typeof v === "number" && !isNaN(v));

    if (!values.length) return { current: 0, avg: 0, max: 0 };

    return {
      current: Math.round(values.at(-1)),
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      max: Math.round(Math.max(...values)),
    };
  }, [data, dataKey, hasData]);

  /* ================= COLOR LOGIC ================= */
  const colorScheme = useMemo(() => {
    if (stats.current >= 90)
      return {
        line: "#fb7185",
        area: ["rgba(251,113,133,0.35)", "rgba(251,113,133,0.05)"],
        text: "text-rose-400",
      };

    if (stats.current >= 75)
      return {
        line: "#fbbf24",
        area: ["rgba(251,191,36,0.35)", "rgba(251,191,36,0.05)"],
        text: "text-amber-400",
      };

    return {
      line: "#34d399",
      area: ["rgba(52,211,153,0.35)", "rgba(52,211,153,0.05)"],
      text: "text-emerald-400",
    };
  }, [stats.current]);

  /* ================= SERIES ================= */
  const seriesData = useMemo(() => {
    if (!hasData) return [];
    return data.map((d) => [
      new Date(d.timestamp || d.createdAt).getTime(),
      d[dataKey],
    ]);
  }, [data, dataKey, hasData]);

  /* ================= ALERT MARKERS ================= */
  const alertLines = useMemo(() => {
    return alertMarkers.map((a) => ({
      xAxis: new Date(a.createdAt).getTime(),
      lineStyle: {
        color: "#ef4444",
        type: "dashed",
        width: 1,
      },
      label: {
        formatter: a.type || "ALERT",
        color: "#ef4444",
        fontSize: 10,
      },
    }));
  }, [alertMarkers]);

  /* ================= CHART INIT ================= */
  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, "dark");
    }

    chartInstanceRef.current.setOption(
      {
        backgroundColor: "transparent",
        grid: { top: 10, left: 42, right: 12, bottom: 28 },
        tooltip: {
          trigger: "axis",
          backgroundColor: "#020617",
          borderColor: "#1e293b",
          textStyle: { color: "#e5e7eb", fontSize: 11 },
        },
        xAxis: {
          type: "time",
          axisLabel: { color: "#64748b", fontSize: 10 },
          axisLine: { show: false },
          splitLine: { show: false },
        },
        yAxis: {
          type: "value",
          min: 0,
          max: 100,
          axisLabel: { color: "#64748b", fontSize: 10 },
          axisLine: { show: false },
          splitLine: { lineStyle: { color: "#1e293b" } },
        },
        series: [
          {
            name: title,
            type: "line",
            smooth: 0.3,
            showSymbol: false,
            data: seriesData,
            lineStyle: { color: colorScheme.line, width: 2.5 },
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
              ? { symbol: "none", data: alertLines }
              : undefined,
          },
        ],
      },
      { notMerge: true }
    );

    const resize = () => chartInstanceRef.current.resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [seriesData, alertLines, colorScheme, title]);

  /* ================= EMPTY ================= */
  if (!hasData) {
    return (
      <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
        No data available
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-3">
      {/* TITLE */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <span className="text-xs text-slate-500">
          Last {seriesData.length} points
        </span>
      </div>

      {/* STATS */}
      <div className="flex items-end justify-between">
        <div>
          <div className={`text-3xl font-bold ${colorScheme.text}`}>
            {stats.current}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Avg: {stats.avg}% • Peak: {stats.max}%
          </div>
        </div>

        {alertMarkers.length > 0 && (
          <span className="px-2 py-1 text-xs rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {alertMarkers.length} alerts
          </span>
        )}
      </div>

      {/* CHART */}
      <div className="rounded-lg border border-slate-800/50 bg-slate-800/30 p-3">
        <div ref={chartRef} style={{ height }} />
      </div>
    </div>
  );
}
