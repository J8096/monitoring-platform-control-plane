import { useEffect, useMemo, useRef, useState } from "react";
import { useMatch, useOutletContext } from "react-router-dom";
import api from "../api/api";
import { usePageVisibility } from "../hooks/usePageVisibility";
import { socket } from "../api/socket";
import { USE_MOCK } from "../api/api";

import AlertTable from "../components/AlertTable";
import MetricChart from "../components/MetricChart";

export default function Dashboard() {
  const incidentsMatch = useMatch("/incidents/*");
  const isVisible = usePageVisibility();

  /* ── Pull activeAgent from sidebar via OutletContext ── */
  const { agents = [], activeAgent } = useOutletContext() ?? {};

  const [alerts, setAlerts]               = useState([]);
  const [metrics, setMetrics]             = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [timeRange, setTimeRange]         = useState("5m");
  const activeAgentIdRef                  = useRef(null);

  const RANGE_MS = { "1m": 60000, "5m": 300000, "1h": 3600000, "24h": 86400000 };

  /* ── Alerts ── */
  const loadAlerts = async () => {
    try {
      const res = await api.get("/alerts?limit=50");
      const d = res.data; setAlerts(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
    } catch (err) { console.error("Failed to load alerts", err); }
    finally { setAlertsLoading(false); }
  };

  useEffect(() => {
    if (!isVisible) return;
    loadAlerts();
    const id = setInterval(loadAlerts, 5000);
    return () => clearInterval(id);
  }, [isVisible]);

  /* ── Metrics (re-fetches on agent or timeRange change) ── */
  useEffect(() => {
    if (!activeAgent || !isVisible) return;
    const agentId = activeAgent._id || activeAgent.id;
    activeAgentIdRef.current = agentId;
    setMetrics([]);
    setMetricsLoading(true);

    async function loadMetrics() {
      try {
        const res = await api.get(`/metrics/${agentId}?range=${timeRange}`);
        if (activeAgentIdRef.current !== agentId) return;
        const raw = Array.isArray(res.data) ? res.data : [];
        const cleaned = raw
          .filter(m => typeof m.timestamp === "number")
          .sort((a, b) => a.timestamp - b.timestamp)
          .filter((pt, i, arr) => i === 0 || pt.timestamp !== arr[i - 1].timestamp);
        setMetrics(cleaned);
      } catch (err) {
        console.error("Metrics fetch failed:", err);
        setMetrics([]);
      } finally { setMetricsLoading(false); }
    }
    loadMetrics();
  }, [activeAgent, timeRange, isVisible]);

  /* ── Socket ── */
  useEffect(() => {
    if (USE_MOCK) return;
    if (!socket.connected) socket.connect();
    const onMetricUpdate = metric => {
      if (metric.agentId !== activeAgentIdRef.current) return;
      setMetrics(prev => {
        const windowStart = Date.now() - RANGE_MS[timeRange];
        return [...prev, metric]
          .filter(m => m.timestamp >= windowStart)
          .sort((a, b) => a.timestamp - b.timestamp);
      });
    };
    socket.on("metrics:update", onMetricUpdate);
    return () => socket.off("metrics:update", onMetricUpdate);
  }, [timeRange]);

  useEffect(() => {
    if (USE_MOCK) return;
    if (!activeAgent || !socket.connected) return;
    const id = activeAgent._id || activeAgent.id;
    socket.emit("subscribe:metrics", id);
    return () => socket.emit("unsubscribe:metrics", id);
  }, [activeAgent]);

  /* ── Alert markers ── */
  const alertMarkers = useMemo(() => {
    if (!activeAgent) return [];
    return alerts.filter(a => a.agentId === activeAgent._id);
  }, [alerts, activeAgent]);

  const unresolvedCount = alerts.filter(a => !a.resolvedAt).length;
  const agentStatus = (activeAgent?.status || "OFFLINE").toLowerCase();

  const statusMeta = {
    healthy:  { color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  pulse: true  },
    degraded: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  pulse: true  },
    offline:  { color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)", pulse: false },
  }[agentStatus] || { color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)", pulse: false };

  return (
    <>
      <style>{CSS}</style>
      <div className="db-shell">

        {/* ── LEFT: Alerts ── */}
        <main className="db-main">
          {!incidentsMatch && (
            <>
              <div className="db-topbar">
                <div className="db-topbar-left">
                  <div className="db-bell-icon"><BellIcon /></div>
                  <span className="db-topbar-title">System Alerts</span>
                  {unresolvedCount > 0 && (
                    <span className="db-active-badge">{unresolvedCount} active</span>
                  )}
                  <span className="db-live-pill">
                    <span className="db-live-dot" />LIVE
                  </span>
                </div>
                <div className="db-range-group">
                  {["1m", "5m", "1h", "24h"].map(r => (
                    <button
                      key={r}
                      className={`db-range-btn${timeRange === r ? " db-range-active" : ""}`}
                      onClick={() => setTimeRange(r)}
                    >{r}</button>
                  ))}
                </div>
              </div>
              <div className="db-body">
                {alertsLoading ? (
                  <div className="db-loading">
                    <div className="db-spinner" /><span>Loading alerts…</span>
                  </div>
                ) : (
                  <AlertTable alerts={alerts} agents={agents} reloadAlerts={loadAlerts} />
                )}
              </div>
            </>
          )}
        </main>

        {/* ── RIGHT: Diagnostics ── */}
        <aside className="db-aside">
          {!activeAgent ? (
            <div className="db-empty">
              <div className="db-empty-icon"><ServerIcon /></div>
              <p className="db-empty-title">No agent selected</p>
              <p className="db-empty-sub">Click any agent in the sidebar to stream live diagnostics</p>
            </div>
          ) : (
            <>
              {/* ── Agent header ── */}
              <div className="db-agent-card">
                <div className="db-agent-card-bar" style={{ background: statusMeta.color }} />

                <div className="db-agent-card-inner">
                  <div className="db-agent-info">
                    <div className="db-agent-icon" style={{
                      borderColor: `${statusMeta.color}30`,
                      background: `${statusMeta.color}10`,
                    }}>
                      <ServerIcon color={statusMeta.color} />
                    </div>
                    <div className="db-agent-text">
                      <div className="db-agent-name">{activeAgent.name || activeAgent._id}</div>
                      <div className="db-agent-id">{activeAgent._id}</div>
                    </div>
                  </div>

                  <div className="db-status-badge" style={{
                    color: statusMeta.color,
                    background: statusMeta.bg,
                    borderColor: statusMeta.border,
                  }}>
                    <span className="db-status-dot" style={{
                      background: statusMeta.color,
                      animation: statusMeta.pulse ? "dbLive 2s ease-in-out infinite" : "none",
                    }} />
                    {activeAgent.status}
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="db-quick-stats">
                  <QuickStat
                    label="CPU"
                    value={activeAgent.cpu != null ? `${activeAgent.cpu}%` : "—"}
                    warn={activeAgent.cpu > 70}
                    crit={activeAgent.cpu > 90}
                  />
                  <div className="db-stat-sep" />
                  <QuickStat
                    label="MEM"
                    value={activeAgent.memory != null ? `${activeAgent.memory}%` : "—"}
                    warn={activeAgent.memory > 70}
                    crit={activeAgent.memory > 90}
                  />
                  <div className="db-stat-sep" />
                  <QuickStat
                    label="PLATFORM"
                    value={activeAgent.metadata?.platform ?? "linux"}
                    muted
                  />
                  <div className="db-stat-sep" />
                  <QuickStat
                    label="ALERTS"
                    value={alertMarkers.length}
                    crit={alertMarkers.length > 0}
                  />
                </div>
              </div>

              {/* ── Charts ── */}
              <div className="db-charts-wrap">
                <div className="db-charts-head">
                  <span className="db-charts-pulse" />
                  <span className="db-charts-label">Live Diagnostics</span>
                  <div className="db-charts-line" />
                  <span className="db-charts-range">{timeRange}</span>
                </div>

                {metricsLoading ? (
                  <div className="db-charts-loading">
                    <div className="db-spinner" />
                    <span>Fetching telemetry…</span>
                  </div>
                ) : (
                  <div className="db-charts-stack">
                    <div className="db-chart-card">
                      <MetricChart
                        key={`cpu-${activeAgent._id}-${timeRange}`}
                        title="CPU Usage"
                        dataKey="cpu"
                        data={metrics}
                        alertMarkers={alertMarkers}
                        timeRange={timeRange}
                        height={148}
                      />
                    </div>
                    <div className="db-chart-card">
                      <MetricChart
                        key={`mem-${activeAgent._id}-${timeRange}`}
                        title="Memory Usage"
                        dataKey="memory"
                        data={metrics}
                        alertMarkers={alertMarkers}
                        timeRange={timeRange}
                        height={148}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

      </div>
    </>
  );
}

function QuickStat({ label, value, warn, crit, muted }) {
  const color = crit
    ? "#f43f5e"
    : warn
    ? "#f59e0b"
    : muted
    ? "rgba(100,116,139,0.5)"
    : "rgba(148,163,184,0.7)";
  return (
    <div className="db-qstat">
      <span className="db-qstat-label">{label}</span>
      <span className="db-qstat-value" style={{ color }}>{value}</span>
    </div>
  );
}

const BellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const ServerIcon = ({ color = "currentColor" }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
    <rect x="2" y="2" width="20" height="8" rx="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500;600&display=swap');

.db-shell {
  display: grid; grid-template-columns: 1fr 354px;
  height: 100%; min-height: 0;
  background: #070b14;
  font-family: 'Outfit', sans-serif; color: #e2e8f4;
}

/* ── Left ── */
.db-main {
  min-height: 0; overflow-y: auto; display: flex; flex-direction: column;
  scrollbar-width: thin; scrollbar-color: #1a2840 transparent;
}
.db-topbar {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding: 0 24px; height: 58px;
  background: rgba(7,11,20,0.96); backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
}
.db-topbar-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.db-bell-icon {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.18);
  display: flex; align-items: center; justify-content: center; color: #ef4444; flex-shrink: 0;
}
.db-topbar-title { font-size: 13px; font-weight: 600; color: #e2e8f4; white-space: nowrap; }
.db-active-badge {
  font-family: 'Geist Mono', monospace; font-size: 10px;
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
  color: #ef4444; padding: 2px 8px; border-radius: 20px;
}
.db-live-pill {
  display: flex; align-items: center; gap: 5px;
  font-family: 'Geist Mono', monospace; font-size: 10px; font-weight: 500;
  color: #10b981; background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.18); padding: 3px 10px; border-radius: 20px;
}
.db-live-dot { width: 5px; height: 5px; border-radius: 50%; background: #10b981; animation: dbLive 2s infinite; }
@keyframes dbLive { 0%,100%{opacity:1} 50%{opacity:0.3} }

.db-range-group {
  display: flex; gap: 2px; background: #0c1422;
  border: 1px solid rgba(255,255,255,0.06); border-radius: 9px; padding: 3px; flex-shrink: 0;
}
.db-range-btn {
  padding: 5px 14px; border: none; background: transparent;
  border-radius: 6px; font-size: 12px; font-weight: 500;
  font-family: 'Geist Mono', monospace; color: #3a5070; cursor: pointer; transition: all 0.15s;
}
.db-range-btn:hover { color: #8099bb; background: #121e30; }
.db-range-active { background: #3b82f6 !important; color: #fff !important; box-shadow: 0 2px 10px rgba(59,130,246,0.3); }
.db-body { flex: 1; padding: 22px 24px 32px; animation: dbFade 0.25s ease both; }
@keyframes dbFade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
.db-loading {
  display: flex; align-items: center; gap: 10px;
  color: #3a5070; font-size: 12px; padding: 40px 0;
  font-family: 'Geist Mono', monospace;
}
.db-spinner {
  width: 15px; height: 15px; flex-shrink: 0;
  border: 2px solid #16243a; border-top-color: #3b82f6;
  border-radius: 50%; animation: dbSpin 0.65s linear infinite;
}
@keyframes dbSpin { to{transform:rotate(360deg)} }

/* ── Right / Aside ── */
.db-aside {
  min-height: 0; overflow-y: auto;
  border-left: 1px solid rgba(255,255,255,0.045);
  background: #040710;
  display: flex; flex-direction: column;
  scrollbar-width: thin; scrollbar-color: #0e1828 transparent;
}
.db-aside::-webkit-scrollbar { width: 2px; }
.db-aside::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }

/* Empty */
.db-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 48px 24px; text-align: center; gap: 6px;
}
.db-empty-icon {
  width: 52px; height: 52px; border-radius: 16px;
  background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: center;
  color: rgba(100,116,139,0.3); margin-bottom: 10px;
}
.db-empty-title { font-size: 13px; font-weight: 600; color: rgba(100,116,139,0.5); margin: 0; }
.db-empty-sub   { font-size: 11px; color: rgba(100,116,139,0.3); margin: 4px 0 0; line-height: 1.6; max-width: 190px; }

/* Agent card (sticky header) */
.db-agent-card {
  position: sticky; top: 0; z-index: 10; flex-shrink: 0;
  background: #050810;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.db-agent-card-bar { height: 2px; width: 100%; opacity: 0.55; }
.db-agent-card-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 15px 9px;
}
.db-agent-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
.db-agent-icon {
  width: 33px; height: 33px; border-radius: 9px; flex-shrink: 0;
  border: 1px solid; display: flex; align-items: center; justify-content: center;
}
.db-agent-text { min-width: 0; }
.db-agent-name {
  font-size: 13px; font-weight: 700; color: #f1f5f9; line-height: 1.3;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;
}
.db-agent-id {
  font-family: 'Geist Mono', monospace; font-size: 9px;
  color: rgba(100,116,139,0.38); margin-top: 1px; letter-spacing: 0.04em;
}
.db-status-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Geist Mono', monospace; font-size: 9px; font-weight: 700;
  letter-spacing: 0.07em; padding: 4px 10px; border-radius: 20px;
  border: 1px solid; white-space: nowrap; flex-shrink: 0; text-transform: uppercase;
}
.db-status-dot { width: 5px; height: 5px; border-radius: 50%; }

/* Quick stats bar */
.db-quick-stats {
  display: flex; align-items: center;
  padding: 7px 15px 12px; gap: 0;
  border-top: 1px solid rgba(255,255,255,0.04);
  background: #050810;
  margin-top: 2px;
}
.db-qstat { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.db-qstat-label {
  font-family: 'Geist Mono', monospace; font-size: 8px; font-weight: 700;
  letter-spacing: 0.1em; color: rgba(100,116,139,0.38); text-transform: uppercase;
}
.db-qstat-value {
  font-family: 'Geist Mono', monospace; font-size: 12px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.db-stat-sep { width: 1px; height: 24px; background: rgba(255,255,255,0.05); flex-shrink: 0; margin: 0 10px; }

/* Charts wrap */
.db-charts-wrap { flex: 1; padding: 14px; display: flex; flex-direction: column; gap: 12px; background: #040710; }
.db-charts-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.db-charts-pulse {
  width: 5px; height: 5px; border-radius: 50%; background: #10b981;
  animation: dbLive 2s ease-in-out infinite; flex-shrink: 0;
}
.db-charts-label {
  font-family: 'Geist Mono', monospace; font-size: 9px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: rgba(100,116,139,0.4); white-space: nowrap;
}
.db-charts-line { flex: 1; height: 1px; background: rgba(255,255,255,0.04); }
.db-charts-range {
  font-family: 'Geist Mono', monospace; font-size: 9px; font-weight: 600;
  color: rgba(59,130,246,0.65); background: rgba(59,130,246,0.08);
  border: 1px solid rgba(59,130,246,0.15); padding: 2px 7px; border-radius: 4px;
}
.db-charts-loading {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 0;
  color: rgba(100,116,139,0.45); font-family: 'Geist Mono', monospace; font-size: 11px;
}
.db-charts-stack { display: flex; flex-direction: column; gap: 12px; }
.db-chart-card {
  background: rgba(255,255,255,0.013);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; padding: 14px;
  transition: border-color 0.18s ease;
}
.db-chart-card:hover { border-color: rgba(255,255,255,0.09); }
`;
