import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/api";

import {
  shouldUseMockData,
  getMockIncidents,
  resolveMockIncident,
  MOCK_AGENTS,
} from "../services/mockData";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap');
  .details-root { font-family: 'Syne', sans-serif; }
  .details-root * { box-sizing: border-box; }

  .detail-panel {
    animation: panelIn 0.35s ease both;
  }
  @keyframes panelIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pulse-live {
    animation: pulseLive 2s ease-in-out infinite;
  }
  @keyframes pulseLive {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .resolve-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .resolve-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(52,211,153,0.1) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .resolve-btn:hover::after { opacity: 1; }
  .resolve-btn:active { transform: scale(0.98); }
`;

const severityConfig = {
  P1: {
    label: "Critical",
    color: "#ef4444",
    bg: "bg-red-500/8",
    border: "border-red-500/15",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    bar: "bg-red-500",
  },
  P2: {
    label: "High",
    color: "#f59e0b",
    bg: "bg-amber-500/8",
    border: "border-amber-500/15",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    bar: "bg-amber-400",
  },
  P3: {
    label: "Medium",
    color: "#3b82f6",
    bg: "bg-blue-500/8",
    border: "border-blue-500/15",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    bar: "bg-blue-500",
  },
};

const statusConfig = {
  OPEN: {
    label: "Open",
    cls: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-400 animate-pulse",
    desc: "This incident is unacknowledged and requires immediate attention.",
  },
  INVESTIGATING: {
    label: "Investigating",
    cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400 animate-pulse",
    desc: "This incident is actively being investigated by on-call engineers.",
  },
  RESOLVED: {
    label: "Resolved",
    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
    desc: "This incident has been resolved and services have been restored.",
  },
};

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString([], {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (s < 60) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function duration(start, end) {
  if (!start) return "—";
  const diff = (end ? new Date(end) : new Date()) - new Date(start);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let alive = true;
    async function fetchIncident() {
      try {
        let data = null;
        if (shouldUseMockData()) {
          const raw = getMockIncidents().find((i) => i._id === id);
          if (raw) {
            const agent = MOCK_AGENTS.find((a) => a._id === raw.agentId);
            const type = raw.severity === "P1" ? "OFFLINE" : raw.severity === "P2" ? "CPU" : "MEMORY";
            data = { ...raw, agent: agent?.name ?? "Unknown", agentObj: agent, type, message: raw.title, timestamp: raw.createdAt };
          }
        } else {
          const res = await api.get(`/incidents/${id}`);
          data = res.data?.data || res.data || null;
        }
        if (!alive) return;
        setIncident(data);
      } catch (err) {
        console.error("Fetch incident error:", err);
        alive && setIncident(null);
      } finally {
        alive && setLoading(false);
      }
    }
    fetchIncident();
    const poll = setInterval(fetchIncident, 5000);
    return () => { alive = false; clearInterval(poll); };
  }, [id]);

  const resolveIncident = async () => {
    setResolving(true);
    try {
      if (shouldUseMockData()) {
        resolveMockIncident(id);
      } else {
        await api.post(`/incidents/${id}/resolve`);
      }
      setIncident((prev) =>
        prev ? { ...prev, status: "RESOLVED", resolvedAt: new Date().toISOString() } : null
      );
    } catch (err) {
      console.error("Resolve failed:", err);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="details-root flex items-center justify-center h-64 bg-[#080c14]">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-live" />
            <span className="text-sm font-medium">Loading incident…</span>
          </div>
        </div>
      </>
    );
  }

  if (!incident) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="details-root min-h-screen bg-[#080c14] flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-300 mb-1">Incident not found</p>
            <p className="text-sm text-slate-600 mb-6">The incident <code className="font-mono text-slate-500">{id}</code> does not exist.</p>
            <Link
              to="/incidents"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 bg-white/[0.03] text-sm font-semibold text-slate-300 hover:bg-white/[0.06] transition-all"
            >
              ← Back to Incidents
            </Link>
          </div>
        </div>
      </>
    );
  }

  const sev = severityConfig[incident.severity] || severityConfig.P3;
  const sta = statusConfig[incident.status] || statusConfig.OPEN;
  const isResolved = incident.status === "RESOLVED";

  return (
    <>
      <style>{STYLES}</style>
      <div className="details-root min-h-screen bg-[#080c14] text-slate-200 p-6 lg:p-8">

        {/* ── Breadcrumb nav ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/incidents")}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Incidents
            </button>
            <span className="text-slate-700">/</span>
            <span className="text-xs font-mono text-slate-400">{incident._id}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live" />
            <span className="text-xs font-mono text-slate-500">Auto-refreshing</span>
          </div>
        </div>

        <div className="detail-panel max-w-4xl mx-auto space-y-4">

          {/* ── Hero card ── */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: `${sev.color}18`, background: `linear-gradient(135deg, ${sev.color}06 0%, transparent 50%)` }}
          >
            {/* Severity bar top */}
            <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${sev.color}, transparent)` }} />

            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${sev.badge}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sev.color }} />
                      {incident.severity} · {sev.label}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${sta.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sta.dot}`} />
                      {sta.label}
                    </span>
                    <span className="text-xs font-mono text-slate-600">{incident.type}</span>
                  </div>
                  <h1 className="text-xl font-bold text-white leading-tight">{incident.title}</h1>
                  <p className="text-sm text-slate-500 mt-1.5">{sta.desc}</p>
                </div>

                {!isResolved && (
                  <button
                    onClick={resolveIncident}
                    disabled={resolving}
                    className="resolve-btn flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/15 hover:border-emerald-400/35 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Resolving…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mark Resolved
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Message */}
              <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/5 font-mono text-sm text-slate-300">
                {incident.message}
              </div>
            </div>
          </div>

          {/* ── Metadata grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <MetaCard
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" /></svg>}
              label="Affected Agent"
              value={incident.agent}
              sub={incident.agentId}
              mono
            />
            <MetaCard
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Opened"
              value={timeAgo(incident.createdAt)}
              sub={formatDate(incident.createdAt)}
            />
            <MetaCard
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>}
              label="Duration"
              value={duration(incident.createdAt, incident.resolvedAt)}
              sub={isResolved ? "Time to resolve" : "Time elapsed"}
            />
            {isResolved && (
              <MetaCard
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
                label="Resolved At"
                value={timeAgo(incident.resolvedAt)}
                sub={formatDate(incident.resolvedAt)}
              />
            )}
            <MetaCard
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg>}
              label="Incident ID"
              value={incident._id}
              mono
            />
            <MetaCard
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              label="Type"
              value={incident.type}
              mono
            />
          </div>

          {/* ── Agent info ── */}
          {incident.agentObj && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Agent Context</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AgentStat label="CPU" value={`${incident.agentObj.cpu}%`} warn={incident.agentObj.cpu > 70} />
                <AgentStat label="Memory" value={`${incident.agentObj.memory}%`} warn={incident.agentObj.memory > 70} />
                <AgentStat label="Status" value={incident.agentObj.status} />
                <AgentStat label="Platform" value={incident.agentObj.metadata?.platform ?? "—"} />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

function MetaCard({ icon, label, value, sub, mono }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3 text-slate-500">{icon}<span className="text-[10px] font-bold tracking-widest uppercase">{label}</span></div>
      <p className={`text-sm font-semibold text-slate-200 truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-slate-600 font-mono mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function AgentStat({ label, value, warn }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-600 mb-1">{label}</p>
      <p className={`text-sm font-semibold font-mono ${warn ? "text-amber-400" : "text-slate-300"}`}>{value}</p>
    </div>
  );
}
