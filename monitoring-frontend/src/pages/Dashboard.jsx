import { useEffect, useMemo, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import api from "../api/api";
import { usePageVisibility } from "../hooks/usePageVisibility";
import { socket } from "../api/socket";

import AlertTable from "../components/AlertTable";
import MetricChart from "../components/MetricChart";

/* ================= HELPERS ================= */

function formatDelta(value) {
  if (value > 0) return `↑ ${value}`;
  if (value < 0) return `↓ ${Math.abs(value)}`;
  return "—";
}

/* ================= DASHBOARD ================= */

export default function Dashboard() {
  const incidentsMatch = useMatch("/incidents/*");
  const isVisible = usePageVisibility();

  /* ================= STATE ================= */
  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState([]);

  const [alertsLoading, setAlertsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [metricsError, setMetricsError] = useState(null);
  const [timeRange, setTimeRange] = useState("5m");

  const activeAgentIdRef = useRef(null);

  /* ================= AGENTS ================= */
  useEffect(() => {
    if (!isVisible) return;

    let alive = true;

    async function loadAgents() {
      try {
        const res = await api.get("/agents");
        if (!alive) return;

        const data = res.data || [];
        setAgents(data);

        setActiveAgent((prev) =>
          prev
            ? data.find((a) => a._id === prev._id) ?? data[0] ?? null
            : data[0] ?? null
        );
      } catch {
        /* silent */
      }
    }

    loadAgents();
    const id = setInterval(loadAgents, 5000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [isVisible]);

  /* ================= ALERTS ================= */
  useEffect(() => {
    if (!isVisible) return;

    let alive = true;

    async function loadAlerts() {
      try {
        const res = await api.get("/alerts?limit=50");
        if (!alive) return;
        setAlerts(res.data?.data || []);
      } finally {
        alive && setAlertsLoading(false);
      }
    }

    loadAlerts();
    const id = setInterval(loadAlerts, 5000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [isVisible]);

  /* ================= METRICS (INITIAL FETCH) ================= */
  useEffect(() => {
    if (!activeAgent || !isVisible) return;

    const agentId = activeAgent._id;
    activeAgentIdRef.current = agentId;
    setMetricsLoading(true);

    async function loadMetrics() {
      try {
        const res = await api.get(
          `/metrics/${agentId}?range=${timeRange}`
        );

        if (activeAgentIdRef.current === agentId) {
          setMetrics(res.data || []);
          setMetricsError(null);
        }
      } catch {
        setMetricsError("Metrics unavailable");
      } finally {
        setMetricsLoading(false);
      }
    }

    loadMetrics();
  }, [activeAgent, isVisible, timeRange]);

  /* ================= LIVE METRICS (WEBSOCKET) ================= */
  useEffect(() => {
    if (!activeAgent) return;

    socket.connect();
    socket.emit("subscribe:metrics", activeAgent._id);

    socket.on("metrics:update", (metric) => {
      setMetrics((prev) => [...prev.slice(-299), metric]);
    });

    return () => {
      socket.off("metrics:update");
      socket.disconnect();
    };
  }, [activeAgent]);

  /* ================= HEARTBEAT ================= */
  const heartbeat = useMemo(() => {
    if (!activeAgent) return null;

    const age = activeAgent.heartbeatAgeSec ?? 0;
    const missed = activeAgent.missedHeartbeats ?? 0;

    let status = "HEALTHY";
    if (age > 15 || missed > 3) status = "DEGRADED";
    if (age > 60) status = "OFFLINE";

    return { status, age, missed };
  }, [activeAgent]);

  /* ================= METRIC DELTA ================= */
  const metricDelta = useMemo(() => {
    if (metrics.length < 2) return null;

    const last = metrics.at(-1);
    const prev = metrics.at(-2);

    return {
      cpu: Math.round((last.cpu ?? 0) - (prev.cpu ?? 0)),
      memory: Math.round((last.memory ?? 0) - (prev.memory ?? 0)),
    };
  }, [metrics]);

  /* ================= ALERT MARKERS (PER AGENT) ================= */
  const alertMarkers = useMemo(() => {
    if (!activeAgent) return [];
    return alerts.filter(
      (a) => a.agentId === activeAgent._id
    );
  }, [alerts, activeAgent]);

  /* ================= RENDER STATUS BADGE ================= */
  const getStatusStyles = (status) => {
    switch (status) {
      case "HEALTHY":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "DEGRADED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "OFFLINE":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "HEALTHY":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "DEGRADED":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case "OFFLINE":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  /* ================= UI ================= */
  return (
    <div className="grid grid-cols-[1fr_380px] h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <main className="overflow-y-auto">
        {!incidentsMatch && (
          <>
            {/* TIME RANGE SELECTOR */}
            <div className="sticky top-0 z-10 px-6 py-4 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100 tracking-tight">System Alerts</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time infrastructure monitoring</p>
                </div>
                
                <div className="flex gap-1.5 bg-slate-900/50 rounded-lg p-1 border border-slate-800/50">
                  {["5m", "1h", "24h"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                        timeRange === r
                          ? "bg-slate-700 text-white shadow-lg shadow-slate-900/50"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6">
              {alertsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Loading alerts…</p>
                  </div>
                </div>
              ) : (
                <AlertTable alerts={alerts} />
              )}
            </div>
          </>
        )}
      </main>

      <aside className="border-l border-slate-800/50 overflow-y-auto bg-slate-950/50 backdrop-blur-sm">
        {!activeAgent ? (
          <div className="p-6 text-center">
            <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-8">
              <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <p className="text-sm text-slate-400">Select an agent to view diagnostics</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* HEALTH SUMMARY CARD */}
            <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5 shadow-xl backdrop-blur-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-1">
                    Health Summary
                  </p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${getStatusStyles(heartbeat.status)}`}>
                    {getStatusIcon(heartbeat.status)}
                    {heartbeat.status}
                  </div>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <div className={`w-3 h-3 rounded-full ${
                    heartbeat.status === "HEALTHY" ? "bg-emerald-400 animate-pulse" :
                    heartbeat.status === "DEGRADED" ? "bg-amber-400" :
                    "bg-rose-400"
                  }`} />
                </div>
              </div>

              {metricDelta && (
                <div className="pt-4 border-t border-slate-800/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">CPU Delta</p>
                      <p className={`text-sm font-mono font-semibold ${
                        metricDelta.cpu > 0 ? "text-rose-400" : 
                        metricDelta.cpu < 0 ? "text-emerald-400" : 
                        "text-slate-300"
                      }`}>
                        {formatDelta(metricDelta.cpu)}
                      </p>
                    </div>
                    
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Mem Delta</p>
                      <p className={`text-sm font-mono font-semibold ${
                        metricDelta.memory > 0 ? "text-rose-400" : 
                        metricDelta.memory < 0 ? "text-emerald-400" : 
                        "text-slate-300"
                      }`}>
                        {formatDelta(metricDelta.memory)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* METRICS CHARTS */}
            <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5 shadow-xl backdrop-blur-sm space-y-6">
              {metricsError ? (
                <div className="text-center py-8">
                  <svg className="w-10 h-10 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-400">{metricsError}</p>
                </div>
              ) : metricsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Loading metrics…</p>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs uppercase tracking-wider text-slate-400 font-medium">CPU Usage</h3>
                      <div className="h-px flex-1 bg-gradient-to-r from-slate-700/50 to-transparent ml-3" />
                    </div>
                    <MetricChart
                      title="CPU Usage"
                      dataKey="cpu"
                      data={metrics}
                      alertMarkers={alertMarkers}
                    />
                  </div>
                  
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs uppercase tracking-wider text-slate-400 font-medium">Memory Usage</h3>
                      <div className="h-px flex-1 bg-gradient-to-r from-slate-700/50 to-transparent ml-3" />
                    </div>
                    <MetricChart
                      title="Memory Usage"
                      dataKey="memory"
                      data={metrics}
                      alertMarkers={alertMarkers}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
