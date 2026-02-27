import { useOutletContext } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import CreateAgentModal from "./CreateAgent";

/* ============================================================
   AGENTS PAGE — ENTERPRISE SAAS REDESIGN
   Aesthetic: Refined dark-glass industrial dashboard
   Font: DM Mono (monospace precision) + Sora (clean display)
============================================================ */

export default function Agents() {
  const { activeAgent, user } = useOutletContext();

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadAgents = useCallback(async () => {
    const res = await api.get("/agents");
    setAgents(Array.isArray(res.data) ? res.data : []);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (alive) await loadAgents();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [loadAgents]);

  const handleCreateClose = useCallback(() => {
    setShowCreate(false);
    loadAgents();
  }, [loadAgents]);

  const healthy = agents.filter((a) => a?.status === "HEALTHY").length;
  const degraded = agents.filter((a) => a?.status === "DEGRADED").length;
  const offline = agents.filter((a) => a?.status === "OFFLINE").length;

  const filtered = agents.filter((a) => {
    const matchFilter = filter === "ALL" || a.status === filter;
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a._id?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      <style>{STYLES}</style>

      <div className="agents-root">
        {/* ── TOP HEADER ── */}
        <header className="agents-header">
          <div className="agents-header-left">
            <div className="agents-breadcrumb">
              <span className="breadcrumb-item">Infrastructure</span>
              <ChevronRight />
              <span className="breadcrumb-current">Agents</span>
            </div>
            <h1 className="agents-title">Agent Registry</h1>
            <p className="agents-subtitle">
              Real-time fleet monitoring &amp; lifecycle management
            </p>
          </div>

          {user?.role === "ADMIN" && (
            <button
              className="btn-primary"
              onClick={() => setShowCreate(true)}
            >
              <PlusIcon />
              Register Agent
            </button>
          )}
        </header>

        {/* ── STAT CARDS ── */}
        <div className="stats-grid">
          <StatCard
            label="Total Fleet"
            value={agents.length}
            icon={<ServerIcon />}
            accent="blue"
            sub="registered agents"
          />
          <StatCard
            label="Operational"
            value={healthy}
            icon={<PulseIcon />}
            accent="green"
            sub={`${agents.length ? ((healthy / agents.length) * 100).toFixed(0) : 0}% of fleet`}
          />
          <StatCard
            label="Degraded"
            value={degraded}
            icon={<WarnIcon />}
            accent="amber"
            sub="require attention"
          />
          <StatCard
            label="Offline"
            value={offline}
            icon={<OfflineIcon />}
            accent="red"
            sub="unreachable"
          />
        </div>

        {/* ── TOOLBAR ── */}
        <div className="toolbar">
          <div className="search-wrap">
            <SearchIcon />
            <input
              className="search-input"
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          <div className="filter-tabs">
            {["ALL", "HEALTHY", "DEGRADED", "OFFLINE"].map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? "active" : ""} tab-${f.toLowerCase()}`}
                onClick={() => setFilter(f)}
              >
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                <span className="tab-count">
                  {f === "ALL" ? agents.length : agents.filter((a) => a.status === f).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── AGENT TABLE ── */}
        <div className="table-container">
          {loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState onClear={() => { setSearch(""); setFilter("ALL"); }} />
          ) : (
            <table className="agent-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th>Last Heartbeat</th>
                  <th>Platform</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <AgentRow
                    key={a._id}
                    agent={a}
                    active={activeAgent?._id === a._id}
                    index={i}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="table-footer">
          <span className="footer-count">
            Showing <strong>{filtered.length}</strong> of <strong>{agents.length}</strong> agents
          </span>
          <span className="footer-mock">
            <span className="mock-dot" />
            Mock data active
          </span>
        </div>
      </div>

      {/* ── CREATE MODAL ── */}
      {showCreate && <CreateAgentModal onClose={handleCreateClose} />}
    </>
  );
}

/* ── AGENT ROW ─────────────────────────────────────────────── */

function AgentRow({ agent, active, index }) {
  const ts = agent.lastHeartbeatTs || agent.lastHeartbeat
    ? new Date(agent.lastHeartbeat || agent.lastHeartbeatTs)
    : null;
  const ago = ts ? timeAgo(ts) : "—";
  const platform = agent.metadata?.platform || "—";
  const registered = agent.createdAt
    ? new Date(agent.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <tr
      className={`agent-row ${active ? "agent-row--active" : ""}`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Agent name + ID */}
      <td>
        <div className="agent-name-cell">
          <div className={`agent-status-dot dot--${agent.status?.toLowerCase()}`} />
          <div>
            <div className="agent-name">{agent.name || agent._id}</div>
            <div className="agent-id">{agent._id}</div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td>
        <StatusBadge status={agent.status} />
      </td>

      {/* CPU */}
      <td>
        <MetricBar value={agent.cpu} status={agent.status} />
      </td>

      {/* Memory */}
      <td>
        <MetricBar value={agent.memory} status={agent.status} color="purple" />
      </td>

      {/* Last heartbeat */}
      <td>
        <span className="mono-text">{ago}</span>
      </td>

      {/* Platform */}
      <td>
        <span className="platform-tag">{platform}</span>
      </td>

      {/* Registered */}
      <td>
        <span className="date-text">{registered}</span>
      </td>
    </tr>
  );
}

/* ── METRIC BAR ─────────────────────────────────────────────── */

function MetricBar({ value, status, color = "blue" }) {
  if (status === "OFFLINE" || value == null) {
    return <span className="mono-text muted">—</span>;
  }
  const pct = Math.min(100, Math.max(0, value));
  const isHigh = pct >= 75;
  const barColor = isHigh ? "var(--c-red)" : color === "purple" ? "var(--c-purple)" : "var(--c-blue)";

  return (
    <div className="metric-bar-wrap">
      <div className="metric-bar-track">
        <div
          className="metric-bar-fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="metric-value" style={{ color: isHigh ? "var(--c-red)" : "inherit" }}>
        {pct}%
      </span>
    </div>
  );
}

/* ── STATUS BADGE ───────────────────────────────────────────── */

function StatusBadge({ status }) {
  return (
    <span className={`status-badge badge--${status?.toLowerCase()}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

/* ── STAT CARD ──────────────────────────────────────────────── */

function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card-top">
        <div className={`stat-icon stat-icon--${accent}`}>{icon}</div>
        <span className="stat-label">{label}</span>
      </div>
      <div className={`stat-value stat-value--${accent}`}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

/* ── LOADING ────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div className="empty-state">
      <div className="loading-spinner" />
      <p>Loading agents…</p>
    </div>
  );
}

/* ── EMPTY ──────────────────────────────────────────────────── */

function EmptyState({ onClear }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <ServerIcon />
      </div>
      <p className="empty-title">No agents found</p>
      <p className="empty-sub">Try adjusting your search or filter</p>
      <button className="btn-ghost" onClick={onClear}>Clear filters</button>
    </div>
  );
}

/* ── UTILS ──────────────────────────────────────────────────── */

function timeAgo(date) {
  const diff = Date.now() - date.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── ICONS ──────────────────────────────────────────────────── */

const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const ServerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
);
const PulseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);
const WarnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const OfflineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
);

/* ── STYLES ─────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap');

:root {
  --c-bg: #080c14;
  --c-surface: #0d1220;
  --c-surface-2: #121826;
  --c-surface-3: #1a2235;
  --c-border: #1e2d45;
  --c-border-2: #253550;
  --c-text: #e2e8f4;
  --c-text-2: #8899bb;
  --c-text-3: #4a5f80;
  --c-blue: #3b82f6;
  --c-blue-dim: rgba(59,130,246,0.12);
  --c-green: #10b981;
  --c-green-dim: rgba(16,185,129,0.12);
  --c-amber: #f59e0b;
  --c-amber-dim: rgba(245,158,11,0.12);
  --c-red: #ef4444;
  --c-red-dim: rgba(239,68,68,0.12);
  --c-purple: #a855f7;
  --c-purple-dim: rgba(168,85,247,0.12);
  --radius: 10px;
  --font-body: 'Sora', sans-serif;
  --font-mono: 'DM Mono', monospace;
}

.agents-root {
  font-family: var(--font-body);
  background: var(--c-bg);
  min-height: 100vh;
  padding: 32px 40px 48px;
  color: var(--c-text);
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* ── HEADER ── */
.agents-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
}
.agents-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--c-text-3);
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}
.breadcrumb-item { color: var(--c-text-3); }
.breadcrumb-current { color: var(--c-blue); }
.agents-title {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: var(--c-text);
  margin: 0 0 4px;
  line-height: 1;
}
.agents-subtitle {
  font-size: 13px;
  color: var(--c-text-2);
  margin: 0;
  font-weight: 300;
}

/* ── PRIMARY BUTTON ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--c-blue);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
  box-shadow: 0 0 0 0 rgba(59,130,246,0.4);
  white-space: nowrap;
}
.btn-primary:hover {
  background: #2563eb;
  box-shadow: 0 4px 24px rgba(59,130,246,0.35);
  transform: translateY(-1px);
}
.btn-ghost {
  background: transparent;
  border: 1px solid var(--c-border-2);
  color: var(--c-text-2);
  border-radius: var(--radius);
  padding: 8px 16px;
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover {
  background: var(--c-surface-3);
  color: var(--c-text);
}

/* ── STAT CARDS ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
}
.stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s;
}
.stat-card:hover::before { opacity: 1; }
.stat-card--blue:hover { border-color: rgba(59,130,246,0.4); }
.stat-card--blue::before { background: radial-gradient(ellipse at top left, rgba(59,130,246,0.06) 0%, transparent 70%); }
.stat-card--green:hover { border-color: rgba(16,185,129,0.4); }
.stat-card--green::before { background: radial-gradient(ellipse at top left, rgba(16,185,129,0.06) 0%, transparent 70%); }
.stat-card--amber:hover { border-color: rgba(245,158,11,0.4); }
.stat-card--amber::before { background: radial-gradient(ellipse at top left, rgba(245,158,11,0.06) 0%, transparent 70%); }
.stat-card--red:hover { border-color: rgba(239,68,68,0.4); }
.stat-card--red::before { background: radial-gradient(ellipse at top left, rgba(239,68,68,0.06) 0%, transparent 70%); }

.stat-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.stat-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.stat-icon--blue { background: var(--c-blue-dim); color: var(--c-blue); }
.stat-icon--green { background: var(--c-green-dim); color: var(--c-green); }
.stat-icon--amber { background: var(--c-amber-dim); color: var(--c-amber); }
.stat-icon--red { background: var(--c-red-dim); color: var(--c-red); }

.stat-label {
  font-size: 12px;
  color: var(--c-text-2);
  font-weight: 500;
  letter-spacing: 0.02em;
}
.stat-value {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 6px;
  font-family: var(--font-mono);
}
.stat-value--blue { color: var(--c-blue); }
.stat-value--green { color: var(--c-green); }
.stat-value--amber { color: var(--c-amber); }
.stat-value--red { color: var(--c-red); }
.stat-sub {
  font-size: 11px;
  color: var(--c-text-3);
  font-family: var(--font-mono);
}

/* ── TOOLBAR ── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 0 12px;
  gap: 8px;
  flex: 1;
  max-width: 360px;
  transition: border-color 0.2s;
}
.search-wrap:focus-within {
  border-color: var(--c-blue);
}
.search-wrap svg { color: var(--c-text-3); flex-shrink: 0; }
.search-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--c-text);
  font-size: 13px;
  font-family: var(--font-body);
  padding: 10px 0;
  width: 100%;
}
.search-input::placeholder { color: var(--c-text-3); }
.search-clear {
  background: none;
  border: none;
  color: var(--c-text-3);
  cursor: pointer;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;
}
.search-clear:hover { color: var(--c-text); }

.filter-tabs {
  display: flex;
  gap: 4px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 4px;
}
.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 7px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--c-text-2);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-tab:hover { color: var(--c-text); background: var(--c-surface-3); }
.filter-tab.active { background: var(--c-surface-3); color: var(--c-text); }
.tab-healthy.active { color: var(--c-green); }
.tab-degraded.active { color: var(--c-amber); }
.tab-offline.active { color: var(--c-red); }
.tab-count {
  font-family: var(--font-mono);
  font-size: 10px;
  background: var(--c-surface-3);
  color: var(--c-text-3);
  padding: 1px 6px;
  border-radius: 20px;
}
.filter-tab.active .tab-count {
  background: var(--c-bg);
}

/* ── TABLE ── */
.table-container {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  overflow: hidden;
}

.agent-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.agent-table thead tr {
  background: var(--c-surface-2);
  border-bottom: 1px solid var(--c-border);
}
.agent-table th {
  padding: 12px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--c-text-3);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-family: var(--font-mono);
  white-space: nowrap;
}

.agent-row {
  border-bottom: 1px solid var(--c-border);
  transition: background 0.15s;
  animation: rowIn 0.25s ease both;
}
.agent-row:last-child { border-bottom: none; }
.agent-row:hover { background: var(--c-surface-2); }
.agent-row--active { background: rgba(59,130,246,0.05); border-left: 2px solid var(--c-blue); }
.agent-row--active:hover { background: rgba(59,130,246,0.08); }

.agent-table td {
  padding: 14px 20px;
  vertical-align: middle;
}

@keyframes rowIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.agent-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.agent-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot--healthy { background: var(--c-green); box-shadow: 0 0 6px var(--c-green); }
.dot--degraded { background: var(--c-amber); box-shadow: 0 0 6px var(--c-amber); }
.dot--offline { background: var(--c-text-3); }

.agent-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: 2px;
}
.agent-id {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--c-text-3);
}

/* ── STATUS BADGE ── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
  border: 1px solid transparent;
}
.badge--healthy { background: var(--c-green-dim); color: var(--c-green); border-color: rgba(16,185,129,0.2); }
.badge--degraded { background: var(--c-amber-dim); color: var(--c-amber); border-color: rgba(245,158,11,0.2); }
.badge--offline { background: var(--c-surface-3); color: var(--c-text-3); border-color: var(--c-border-2); }
.badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.badge--healthy .badge-dot { animation: pulse-green 2s infinite; }
.badge--degraded .badge-dot { animation: pulse-amber 2s infinite; }

@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes pulse-amber {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── METRIC BAR ── */
.metric-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.metric-bar-track {
  flex: 1;
  height: 4px;
  background: var(--c-surface-3);
  border-radius: 2px;
  overflow: hidden;
  min-width: 60px;
  max-width: 80px;
}
.metric-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}
.metric-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--c-text-2);
  min-width: 32px;
}

/* ── MISC ── */
.mono-text {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--c-text-2);
}
.mono-text.muted { color: var(--c-text-3); }
.platform-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--c-text-3);
  background: var(--c-surface-3);
  padding: 3px 8px;
  border-radius: 4px;
}
.date-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--c-text-3);
}

/* ── TABLE FOOTER ── */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px 0;
}
.footer-count {
  font-size: 12px;
  color: var(--c-text-3);
  font-family: var(--font-mono);
}
.footer-count strong { color: var(--c-text-2); }
.footer-mock {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--c-text-3);
  font-family: var(--font-mono);
}
.mock-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-amber);
  animation: pulse-amber 2s infinite;
}

/* ── EMPTY / LOADING ── */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--c-text-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--c-surface-3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: var(--c-text-3);
}
.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--c-text-2);
  margin: 0;
}
.empty-sub { font-size: 13px; margin: 0 0 12px; }

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--c-border-2);
  border-top-color: var(--c-blue);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin-bottom: 8px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .agents-root { padding: 24px 20px 40px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .agent-table th:nth-child(6),
  .agent-table td:nth-child(6),
  .agent-table th:nth-child(7),
  .agent-table td:nth-child(7) { display: none; }
}
@media (max-width: 720px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-wrap { max-width: 100%; }
  .filter-tabs { overflow-x: auto; }
  .agent-table th:nth-child(4),
  .agent-table td:nth-child(4),
  .agent-table th:nth-child(5),
  .agent-table td:nth-child(5) { display: none; }
}
`;
