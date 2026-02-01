import { useEffect, useMemo, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import api from "../api/api";
import { usePageVisibility } from "../hooks/usePageVisibility";
import { socket } from "../api/socket";

import AlertTable from "../components/AlertTable";
import MetricChart from "../components/MetricChart";

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

        setActiveAgent(prev =>
          prev
            ? data.find(a => a._id === prev._id) ?? data[0] ?? null
            : data[0] ?? null
        );
      } catch (err) {
        console.error("Failed to load agents", err);
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
  const loadAlerts = async () => {
    try {
      const res = await api.get("/alerts?limit=50");
      setAlerts(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    loadAlerts();
    const id = setInterval(loadAlerts, 5000);
    return () => clearInterval(id);
  }, [isVisible]);

  /* ================= METRICS (FETCH) ================= */
  useEffect(() => {
    if (!activeAgent || !isVisible) return;

    const agentId = activeAgent._id;
    activeAgentIdRef.current = agentId;

    // 🔑 IMPORTANT: reset metrics on agent change
    setMetrics([]);
    setMetricsLoading(true);

    async function loadMetrics() {
      try {
        const res = await api.get(`/metrics/${agentId}?range=${timeRange}`);

        if (activeAgentIdRef.current === agentId) {
          setMetrics(Array.isArray(res.data) ? res.data : []);
          setMetricsError(null);
        }
      } catch (err) {
        console.error("Metrics error", err);
        setMetricsError("Metrics unavailable");
      } finally {
        setMetricsLoading(false);
      }
    }

    loadMetrics();
  }, [activeAgent, timeRange, isVisible]);

  /* ================= SOCKET (REAL-TIME) ================= */
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onMetricUpdate = metric => {
      // 🔒 Ignore metrics from other agents
      if (metric.agentId !== activeAgentIdRef.current) return;

      setMetrics(prev => [...prev.slice(-299), metric]);
    };

    socket.on("metrics:update", onMetricUpdate);
    return () => socket.off("metrics:update", onMetricUpdate);
  }, []);

  useEffect(() => {
    if (!activeAgent || !socket.connected) return;

    socket.emit("subscribe:metrics", activeAgent._id);
    return () => socket.emit("unsubscribe:metrics", activeAgent._id);
  }, [activeAgent]);

  /* ================= ALERT MARKERS ================= */
  const alertMarkers = useMemo(() => {
    if (!activeAgent) return [];
    return alerts.filter(a => a.agentId === activeAgent._id);
  }, [alerts, activeAgent]);

  /* ================= UI ================= */
  return (
    <div className="grid grid-cols-[1fr_380px] h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <main className="overflow-y-auto">
        {!incidentsMatch && (
          <>
            <div className="sticky top-0 z-10 px-6 py-4 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100">
                  System Alerts
                </h2>

                <div className="flex gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-800/50">
                  {["5m", "1h", "24h"].map(r => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-4 py-1.5 text-xs rounded-md ${
                        timeRange === r
                          ? "bg-slate-700 text-white"
                          : "text-slate-400 hover:bg-slate-800"
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
                <p className="text-slate-400">Loading alerts…</p>
              ) : (
                <AlertTable alerts={alerts} reloadAlerts={loadAlerts} />
              )}
            </div>
          </>
        )}
      </main>

      <aside className="border-l border-slate-800/50 overflow-y-auto bg-slate-950/50">
        {!activeAgent ? (
          <div className="p-6 text-slate-400 text-center">
            Select an agent to view diagnostics
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <MetricChart
              title="CPU Usage"
              dataKey="cpu"
              data={metrics}
              alertMarkers={alertMarkers}
            />

            <MetricChart
              title="Memory Usage"
              dataKey="memory"
              data={metrics}
              alertMarkers={alertMarkers}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
