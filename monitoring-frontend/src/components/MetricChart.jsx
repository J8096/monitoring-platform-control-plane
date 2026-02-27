import { useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";

export default function MetricChart({
  title,
  dataKey,
  data = [],
  alertMarkers = [],
  timeRange = "5m",
  height = 190,
}) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  /* =========================================================
     NORMALIZE + SORT + DEDUPE SERIES DATA
  ========================================================== */

  const seriesData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const normalized = data
      .map((d) => {
        let ts = null;

        if (typeof d.timestamp === "number") {
          ts = d.timestamp;
        } else if (d.createdAt) {
          const parsed = new Date(d.createdAt).getTime();
          if (!Number.isNaN(parsed)) ts = parsed;
        }

        const value = d[dataKey];

        if (!ts || Number.isNaN(ts) || typeof value !== "number") {
          return null;
        }

        return [ts, value];
      })
      .filter(Boolean)
      .sort((a, b) => a[0] - b[0]);

    // remove duplicate timestamps
    return normalized.filter((point, index, arr) => {
      return index === 0 || point[0] !== arr[index - 1][0];
    });
  }, [data, dataKey]);

  const hasData = seriesData.length > 0;

  /* =========================================================
     TIME SCALE CONFIG
  ========================================================== */

  const tickConfig = useMemo(() => {
    switch (timeRange) {
      case "1m":
        return {
          minInterval: 10 * 1000,
          formatter: (d) =>
            d.toLocaleTimeString([], {
              minute: "2-digit",
              second: "2-digit",
            }),
        };

      case "5m":
        return {
          minInterval: 30 * 1000,
          formatter: (d) =>
            d.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
        };

      case "1h":
        return {
          minInterval: 5 * 60 * 1000,
          formatter: (d) =>
            d.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
        };

      case "24h":
        return {
          minInterval: 60 * 60 * 1000,
          formatter: (d) =>
            d.toLocaleTimeString([], {
              hour: "2-digit",
            }),
        };

      default:
        return {
          minInterval: 60 * 1000,
          formatter: (d) =>
            d.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
        };
    }
  }, [timeRange]);

  /* =========================================================
     STATS
  ========================================================== */

  const stats = useMemo(() => {
    if (!hasData) return { current: 0, avg: 0, max: 0 };

    const values = seriesData.map(([, v]) => v);

    return {
      current: Math.round(values.at(-1)),
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      max: Math.round(Math.max(...values)),
    };
  }, [seriesData, hasData]);

  /* =========================================================
     COLOR LOGIC
  ========================================================== */

  const colorScheme = useMemo(() => {
    if (stats.current >= 90) {
      return {
        line: "#fb7185",
        areaTop: "rgba(251,113,133,0.35)",
        areaBottom: "rgba(251,113,133,0.05)",
        text: "text-rose-400",
      };
    }

    if (stats.current >= 75) {
      return {
        line: "#fbbf24",
        areaTop: "rgba(251,191,36,0.35)",
        areaBottom: "rgba(251,191,36,0.05)",
        text: "text-amber-400",
      };
    }

    return {
      line: "#34d399",
      areaTop: "rgba(52,211,153,0.35)",
      areaBottom: "rgba(52,211,153,0.05)",
      text: "text-emerald-400",
    };
  }, [stats.current]);

  /* =========================================================
     ALERT MARKERS (DEDUPED)
  ========================================================== */

  const alertLines = useMemo(() => {
    if (!alertMarkers?.length) return [];

    const unique = new Map();

    alertMarkers.forEach((a) => {
      const ts = new Date(a.createdAt).getTime();
      if (!Number.isNaN(ts)) {
        unique.set(ts, { xAxis: ts });
      }
    });

    return Array.from(unique.values());
  }, [alertMarkers]);

  /* =========================================================
     CHART INIT / UPDATE
  ========================================================== */

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, "dark");
    }

    if (!hasData) return;

    const start = seriesData[0][0];
    const end = seriesData.at(-1)[0];

    chartInstanceRef.current.setOption(
      {
        backgroundColor: "transparent",

  grid: {
  top: 5,
  left: 5,
  right:5,
  bottom: 5,
  containLabel: true,
},



        tooltip: {
          trigger: "axis",
          backgroundColor: "#020617",
          borderColor: "#1e293b",
          textStyle: { color: "#e5e7eb", fontSize: 11 },
        },

        xAxis: {
          type: "time",
          boundaryGap: false,
          min: start,
          max: end + tickConfig.minInterval,
          minInterval: tickConfig.minInterval,
          splitNumber: 6,
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: {
            color: "#64748b",
            fontSize: 10,
            hideOverlap: true,
            formatter: (value) =>
              tickConfig.formatter(new Date(value)),
          },
        },

        yAxis: {
          type: "value",
          min: 0,
          max: 100,
          axisLine: { show: false },
          axisLabel: { color: "#64748b", fontSize: 10 },
          splitLine: { lineStyle: { color: "#1e293b" } },
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
                  { offset: 0, color: colorScheme.areaTop },
                  { offset: 1, color: colorScheme.areaBottom },
                ],
              },
            },

markLine: alertLines.length
  ? {
      symbol: "none",
      silent: true,
      animation: false,
      z: 50,

      lineStyle: {
        color: "#ef4444",
        width: 1.5,
        type: "dashed",
        opacity: 0.7,
      },

      label: {
        show: true,
        position: "insideEndTop",
        formatter: "Alert",
        color: "#ef4444",
        fontSize: 9,
        fontWeight: 500,
        padding: [2, 4],
        backgroundColor: "rgba(239,68,68,0.1)",
        borderRadius: 3,
      },

      data: alertLines,
    }
  : undefined,


          },
        ],
      },
      { notMerge: true }
    );

    const resize = () => chartInstanceRef.current?.resize();
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, [
    hasData,
    seriesData,
    alertLines,
    colorScheme,
    title,
    tickConfig,
  ]);

  /* =========================================================
     CLEANUP
  ========================================================== */

  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">
          {title}
        </h3>
        <span className="text-xs text-slate-500">
          Last {seriesData.length} points
        </span>
      </div>

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

      <div className="relative rounded-lg border border-slate-800/50 bg-slate-800/30 p-3">
        <div ref={chartRef} style={{ height }} />

        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
