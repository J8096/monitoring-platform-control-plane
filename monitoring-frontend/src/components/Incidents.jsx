import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api/api";
import IncidentList from "../components/IncidentList";

import {
  shouldUseMockData,
  getMockIncidents,
  resolveMockIncident,
  MOCK_AGENTS,
} from "../mocks";

/* ─── inline styles injected once ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap');

  .incidents-root { font-family: 'Syne', sans-serif; }
  .incidents-root * { box-sizing: border-box; }

  .stat-card {
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .stat-card:hover { transform: translateY(-1px); }
  .stat-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at top left, var(--card-glow, rgba(255,255,255,0.03)) 0%, transparent 60%);
    pointer-events: none;
  }

  .incident-row {
    animation: slideUp 0.3s ease both;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .search-input::placeholder { color: rgba(148,163,184,0.4); }
  .search-input:focus { outline: none; }

  .filter-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
    cursor: pointer;
  }
  .filter-select:focus { outline: none; }
  .filter-select option { background: #0f172a; }

  .pulse-live {
    animation: pulseLive 2s ease-in-out infinite;
  }
  @keyframes pulseLive {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .table-header-row {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .scrollbar-thin::-webkit-scrollbar { width: 4px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.1); border-radius: 2px; }
`;

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);

  /* ─── fetch ─── */
  useEffect(() => {
    let alive = true;

    async function fetchIncidents() {
      try {
        let raw = [];
        if (shouldUseMockData()) {
          raw = getMockIncidents();
        } else {
          const res = await api.get("/incidents");
          raw = res.data?.data || res.data || [];
        }
        if (!alive) return;

        const normalized = raw.map((i) => {
          const agent = MOCK_AGENTS.find((a) => a._id === i.agentId);
          const type =
            i.severity === "P1" ? "OFFLINE" : i.severity === "P2" ? "CPU" : "MEMORY";
          return {
            ...i,
            agent: agent?.name ?? "Unknown",
            type,
            message: i.title,
            timestamp: i.createdAt,
          };
        });

        setIncidents(normalized);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Fetch incidents error:", err);
      } finally {
        alive && setLoading(false);
      }
    }

    fetchIncidents();
    const id = setInterval(fetchIncidents, 5000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  /* ─── filter ─── */
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        incident.message?.toLowerCase().includes(q) ||
        incident.agent?.toLowerCase().includes(q) ||
        incident._id?.toLowerCase().includes(q);
      const matchesSeverity = severityFilter === "all" || incident.severity === severityFilter;
      const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [incidents, searchQuery, severityFilter, statusFilter]);

  /* ─── resolve ─── */
  const resolveIncident = useCallback(async (id) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i._id === id ? { ...i, status: "RESOLVED", resolvedAt: new Date().toISOString() } : i
      )
    );
    try {
      if (shouldUseMockData()) {
        resolveMockIncident(id);
      } else {
        await api.post(`/incidents/${id}/resolve`);
      }
    } catch {
      setIncidents((prev) =>
        prev.map((i) => (i._id === id ? { ...i, status: "OPEN" } : i))
      );
    }
  }, []);

  /* ─── stats ─── */
  const stats = useMemo(() => {
    const critical = incidents.filter((i) => i.severity === "P1" && i.status !== "RESOLVED").length;
    const high = incidents.filter((i) => i.severity === "P2" && i.status !== "RESOLVED").length;
    const medium = incidents.filter((i) => i.severity === "P3" && i.status !== "RESOLVED").length;
    const open = incidents.filter((i) => i.status === "OPEN").length;
    const investigating = incidents.filter((i) => i.status === "INVESTIGATING").length;
    const resolved = incidents.filter((i) => i.status === "RESOLVED").length;
    return { critical, high, medium, open, investigating, resolved, total: incidents.length };
  }, [incidents]);

  const formatTime = (d) => d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  /* ─── states ─── */
  if (loading && incidents.length === 0) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="incidents-root flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-live" />
            <span className="text-sm font-medium">Loading incidents…</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="incidents-root min-h-screen bg-[#080c14] text-slate-200 p-6 lg:p-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* Breadcrumb */}
              <span className="text-xs text-slate-600 font-mono">OPERATIONS</span>
              <span className="text-xs text-slate-700">/</span>
              <span className="text-xs text-slate-400 font-mono">INCIDENTS</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Incident Command</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Active production issues requiring immediate attention
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live" />
              <span className="text-xs font-semibold text-emerald-400 font-mono">LIVE</span>
            </div>

            {/* Last updated */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02]">
              <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
              </svg>
              <span className="text-xs text-slate-500 font-mono">
                {formatTime(lastUpdated)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Critical"
            value={stats.critical}
            total={stats.total}
            color="#ef4444"
            glowColor="rgba(239,68,68,0.08)"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
            sublabel="P1 · Unresolved"
          />
          <StatCard
            label="High"
            value={stats.high}
            total={stats.total}
            color="#f59e0b"
            glowColor="rgba(245,158,11,0.08)"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.258-12.748c.866-1.5 3.032-1.5 3.898 0l7.258 12.748z" />
              </svg>
            }
            sublabel="P2 · Unresolved"
          />
          <StatCard
            label="Medium"
            value={stats.medium}
            total={stats.total}
            color="#3b82f6"
            glowColor="rgba(59,130,246,0.08)"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            }
            sublabel="P3 · Unresolved"
          />
          <StatCard
            label="Total"
            value={stats.total}
            total={stats.total}
            color="#94a3b8"
            glowColor="rgba(148,163,184,0.05)"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            }
            sublabel={`${stats.resolved} resolved · ${stats.investigating} investigating`}
          />
        </div>

        {/* ── Status mini bar ── */}
        <div className="flex items-center gap-4 mb-6 px-1">
          <StatusPill label="Open" count={stats.open} color="text-red-400" dot="bg-red-400" />
          <StatusPill label="Investigating" count={stats.investigating} color="text-amber-400" dot="bg-amber-400" />
          <StatusPill label="Resolved" count={stats.resolved} color="text-emerald-400" dot="bg-emerald-400" />
          <div className="flex-1" />
          <span className="text-xs text-slate-600 font-mono hidden sm:block">5s refresh interval</span>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center gap-3 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, agent, or ID…"
              className="search-input w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/5 bg-white/[0.03] text-slate-200 placeholder:text-slate-600 hover:border-white/10 focus:border-white/15 focus:bg-white/[0.05] transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="filter-select px-3 py-2.5 text-sm rounded-xl border border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 focus:border-white/15 transition-all font-mono"
          >
            <option value="all">All Severity</option>
            <option value="P1">P1 · Critical</option>
            <option value="P2">P2 · High</option>
            <option value="P3">P3 · Medium</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select px-3 py-2.5 text-sm rounded-xl border border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 focus:border-white/15 transition-all font-mono"
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Count badge */}
          <div className="px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] font-mono text-xs text-slate-400 whitespace-nowrap">
            {filteredIncidents.length}
            <span className="text-slate-600"> / {incidents.length}</span>
          </div>
        </div>

        {/* ── Table Header ── */}
        <div className="flex items-center gap-0 px-0 mb-1 ml-[3px]">
          <div className="flex items-center gap-5 flex-1 px-5 py-2">
            <div className="w-2 flex-shrink-0" />
            <span className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase w-24 hidden sm:block">ID</span>
            <span className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase flex-1">Incident</span>
            <span className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase hidden md:block w-28">Severity</span>
            <span className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase w-24">Status</span>
            <span className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase w-24 text-right">Action</span>
          </div>
        </div>

        {/* ── List ── */}
        {incidents.length === 0 ? (
          <EmptyState message="No incidents found" sub="The system is clear" />
        ) : filteredIncidents.length === 0 ? (
          <EmptyState message="No matching incidents" sub="Try adjusting your filters" onClear={() => { setSearchQuery(""); setSeverityFilter("all"); setStatusFilter("all"); }} />
        ) : (
          <div className="scrollbar-thin overflow-y-auto max-h-[calc(100vh-420px)]">
            <IncidentList incidents={filteredIncidents} onResolve={resolveIncident} />
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Sub-components ─── */

function StatCard({ label, value, total, color, glowColor, icon, sublabel }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div
      className="stat-card rounded-xl border border-white/5 bg-white/[0.025] p-4"
      style={{ "--card-glow": glowColor }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold tracking-tight" style={{ color, textShadow: `0 0 20px ${color}40` }}>
          {value}
        </span>
        <span className="text-xs text-slate-600 mb-1 font-mono">{pct}%</span>
      </div>
      {/* Mini bar */}
      <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <p className="text-[10px] text-slate-600 font-mono">{sublabel}</p>
    </div>
  );
}

function StatusPill({ label, count, color, dot }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className={`text-xs font-semibold ${color}`}>{count}</span>
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}

function EmptyState({ message, sub, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center mb-4">
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-400">{message}</p>
      <p className="text-xs text-slate-600 mt-1">{sub}</p>
      {onClear && (
        <button
          onClick={onClear}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg border border-white/5 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-all"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
