import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import MetricChart from "../components/MetricChart";

/**
 * SLO PAGE (ENTERPRISE FINAL)
 *
 * ✔ Executive-friendly
 * ✔ Error-budget focused
 * ✔ Calm, serious UI
 * ✔ Polling-safe fetch
 * ✔ Clear failure states
 */
export default function SLO() {
  /* ================= STATE ================= */
  const [uptime24h, setUptime24h] = useState([]);
  const [uptime7d, setUptime7d] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    let alive = true;

    async function fetchSLO() {
      try {
        const [res24h, res7d] = await Promise.all([
          api.get("/slo/uptime/24h"),
          api.get("/slo/uptime/7d"),
        ]);

        if (!alive) return;

        setUptime24h(Array.isArray(res24h.data) ? res24h.data : []);
        setUptime7d(Array.isArray(res7d.data) ? res7d.data : []);
      } catch {
        alive && setError("Failed to load SLO data");
      } finally {
        alive && setLoading(false);
      }
    }

    fetchSLO();
    return () => {
      alive = false;
    };
  }, []);

  /* ================= DERIVED ================= */
  const uptimeSummary = useMemo(() => {
    const latest24h = uptime24h.at(-1)?.uptime ?? null;
    const latest7d = uptime7d.at(-1)?.uptime ?? null;

    const target = 99.9;

    return {
      target,
      last24h: latest24h,
      last7d: latest7d,
      budget24h:
        latest24h != null ? Math.max(0, target - latest24h) : null,
      budget7d:
        latest7d != null ? Math.max(0, target - latest7d) : null,
    };
  }, [uptime24h, uptime7d]);

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="p-4 text-xs text-slate-400">
        Loading SLO metrics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-xs text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* ================= HEADER ================= */}
      <div>
        <div className="text-sm font-semibold text-slate-200">
          Service Level Objectives
        </div>
        <div className="text-xs text-slate-400">
          Reliability targets and error budget tracking
        </div>
      </div>

      {/* ================= KPI STRIP ================= */}
      <div className="grid grid-cols-4 gap-4">
        <SloCard
          label="SLO Target"
          value={`${uptimeSummary.target}%`}
        />
        <SloCard
          label="Uptime (24h)"
          value={
            uptimeSummary.last24h != null
              ? `${uptimeSummary.last24h.toFixed(3)}%`
              : "—"
          }
        />
        <SloCard
          label="Uptime (7d)"
          value={
            uptimeSummary.last7d != null
              ? `${uptimeSummary.last7d.toFixed(3)}%`
              : "—"
          }
        />
        <SloCard
          label="Error Budget Used"
          value={
            uptimeSummary.budget7d != null
              ? `${uptimeSummary.budget7d.toFixed(3)}%`
              : "—"
          }
          muted
        />
      </div>

      {/* ================= CHARTS ================= */}
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="text-xs text-slate-400 mb-2">
            Platform Uptime — Last 24 Hours
          </div>
          <MetricChart dataKey="uptime" data={uptime24h} />
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="text-xs text-slate-400 mb-2">
            Platform Uptime — Last 7 Days
          </div>
          <MetricChart dataKey="uptime" data={uptime7d} />
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function SloCard({ label, value, muted = false }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div
        className={`mt-1 text-lg font-semibold ${
          muted ? "text-slate-400" : "text-slate-100"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
