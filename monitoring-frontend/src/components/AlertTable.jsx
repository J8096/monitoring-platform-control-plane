import { useState } from "react";
import api from "../api/api";
import { timeAgo } from "../utils/timeAgo";

/* ============================================================
   ALERT TABLE — ENTERPRISE REDESIGN
   Original imports + props + logic preserved exactly.
   import { useState } from "react"
   import api from "../api/api"
   import { timeAgo } from "../utils/timeAgo"
============================================================ */

const FILTERS = [
  { key: "ALL",      label: "All",      cls: "" },
  { key: "OPEN",     label: "Open",     cls: "at-f-open" },
  { key: "ACKED",    label: "Ack'd",   cls: "at-f-acked" },
  { key: "RESOLVED", label: "Resolved", cls: "at-f-resolved" },
];

function getStatus(alert) {
  if (alert.resolvedAt)     return "RESOLVED";
  if (alert.acknowledgedAt) return "ACKED";
  return "OPEN";
}

/* ── MAIN EXPORT — props identical to original ── */
export default function AlertTable({ alerts, agents, reloadAlerts }) {
  const [filter, setFilter] = useState("ALL");

  const safe = Array.isArray(alerts) ? alerts : [];

  const counts = {
    ALL:      safe.length,
    OPEN:     safe.filter(a => getStatus(a) === "OPEN").length,
    ACKED:    safe.filter(a => getStatus(a) === "ACKED").length,
    RESOLVED: safe.filter(a => getStatus(a) === "RESOLVED").length,
  };

  const visible = safe.filter(a => filter === "ALL" || getStatus(a) === filter);

  if (safe.length === 0) {
    return (
      <>
        <style>{CSS}</style>
        <div className="at-root">
          <div className="at-box">
            <div className="at-empty">
              <div className="at-empty-icon"><ShieldIcon /></div>
              <p>All clear</p>
              <span>No alerts to display</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="at-root">

        {/* FILTER CHIPS */}
        <div className="at-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`at-chip ${filter === f.key ? "at-chip--on" : ""} ${f.cls}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="at-chip-n">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className="at-box">
          {visible.length === 0 ? (
            <div className="at-empty">
              <div className="at-empty-icon"><ShieldIcon /></div>
              <p>All clear</p>
              <span>No {filter !== "ALL" ? filter.toLowerCase() : ""} alerts</span>
            </div>
          ) : (
            <table className="at-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Agent</th>
                  <th>Sev</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th className="at-th-r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((alert, i) => (
                  <AlertRow
                    key={alert._id}
                    alert={alert}
                    agents={agents}
                    reloadAlerts={reloadAlerts}
                    index={i}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {visible.length > 0 && (
          <div className="at-foot">
            <span className="at-foot-txt">
              Showing <strong>{visible.length}</strong> of <strong>{safe.length}</strong> alerts
            </span>
          </div>
        )}

      </div>
    </>
  );
}

/* ── ALERT ROW — original handleAck/handleResolve logic preserved ── */
function AlertRow({ alert, agents, reloadAlerts, index }) {
  const [loading, setLoading] = useState(false);

  const isAcknowledged = Boolean(alert.acknowledgedAt);
  const isResolved     = Boolean(alert.resolvedAt);

  const handleAck = async () => {
    setLoading(true);
    try {
      await api.post(`/alerts/${alert._id}/ack`);
      reloadAlerts();
    } finally { setLoading(false); }
  };

  const handleResolve = async () => {
    setLoading(true);
    try {
      await api.post(`/alerts/${alert._id}/resolve`);
      reloadAlerts();
    } finally { setLoading(false); }
  };

  const agentName = agents?.find(a => a._id === alert.agentId)?.name || "Unknown";

  return (
    <tr
      className={`at-row${isResolved ? " at-row--dim" : ""}`}
      style={{ animationDelay: `${index * 20}ms` }}
    >
      {/* TIME — uses original timeAgo import */}
      <td>
        <div className="at-time">
          <span className="at-time-rel">{timeAgo(alert.createdAt)}</span>
          <span className="at-time-abs">{clock(alert.createdAt)}</span>
        </div>
      </td>

      {/* AGENT */}
      <td>
        <div className="at-agent">
          <AgentDot agents={agents} agentId={alert.agentId} />
          <div>
            <div className="at-agent-name">{agentName}</div>
            <div className="at-agent-id">{alert.agentId}</div>
          </div>
        </div>
      </td>

      {/* SEVERITY */}
      <td><SevBadge sev={alert.severity} /></td>

      {/* TYPE */}
      <td><TypeBadge type={alert.type} /></td>

      {/* MESSAGE */}
      <td><span className="at-msg">{alert.message}</span></td>

      {/* ACTIONS — original isResolved/isAcknowledged logic preserved */}
      <td className="at-td-r">
        {isResolved ? (
          <span className="at-done"><CheckIcon /> Resolved</span>
        ) : (
          <div className="at-actions">
            {!isAcknowledged && (
              <button className="at-btn at-btn--ack" onClick={handleAck} disabled={loading}>
                {loading ? "…" : <><EyeIcon /> Ack</>}
              </button>
            )}
            <button className="at-btn at-btn--resolve" onClick={handleResolve} disabled={loading}>
              {loading ? "…" : <><CheckIcon /> Resolve</>}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

/* ── SUB COMPONENTS ── */
function AgentDot({ agents, agentId }) {
  const agent = agents?.find(a => a._id === agentId);
  const status = (agent?.status || "OFFLINE").toLowerCase();
  const colors = { healthy: "#10b981", degraded: "#f59e0b", offline: "#2e4060" };
  return <span className="at-agent-dot" style={{ background: colors[status] || colors.offline }} />;
}

function SevBadge({ sev }) {
  const cls = sev === "P1" ? "at-sev-p1" : sev === "P2" ? "at-sev-p2" : "at-sev-p3";
  return <span className={`at-sev ${cls}`}>{sev}</span>;
}

function TypeBadge({ type }) {
  if (type === "CPU_HIGH")    return <span className="at-type at-type--cpu"><CpuIcon /> CPU_HIGH</span>;
  if (type === "MEMORY_HIGH") return <span className="at-type at-type--mem"><MemIcon /> MEM_HIGH</span>;
  return <span className="at-type at-type--off"><WifiIcon /> OFFLINE</span>;
}

/* ── UTILS ── */
function clock(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/* ── ICONS ── */
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
);
const EyeIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const CpuIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>
);
const MemIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12H2M2 12V8a2 2 0 012-2h16a2 2 0 012 2v4M2 12v4a2 2 0 002 2h16a2 2 0 002-2v-4"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></svg>
);
const WifiIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
);
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
);

/* ── STYLES ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500&display=swap');

.at-root { font-family: 'Outfit', sans-serif; color: #e2e8f4; width: 100%; }

/* FILTER CHIPS */
.at-filters { display: flex; align-items: center; gap: 7px; margin-bottom: 14px; flex-wrap: wrap; }

.at-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 20px;
  font-size: 12px; font-weight: 500; font-family: 'Outfit', sans-serif;
  border: 1px solid #16243a; background: #0c1422;
  color: #3a5070; cursor: pointer; transition: all 0.15s;
}
.at-chip:hover { border-color: #1e334e; color: #7a90b4; }
.at-chip--on { border-color: #3b82f6; background: rgba(59,130,246,0.09); color: #e2e8f4; }
.at-chip--on.at-f-open     { border-color: #ef4444; background: rgba(239,68,68,0.08);   color: #ef4444; }
.at-chip--on.at-f-acked    { border-color: #f59e0b; background: rgba(245,158,11,0.08);  color: #f59e0b; }
.at-chip--on.at-f-resolved { border-color: #10b981; background: rgba(16,185,129,0.08);  color: #10b981; }

.at-chip-n {
  font-family: 'Geist Mono', monospace; font-size: 10px;
  background: #0f1928; color: #243450; padding: 1px 6px; border-radius: 10px;
}
.at-chip--on .at-chip-n { background: transparent; color: inherit; opacity: 0.6; }

/* TABLE BOX */
.at-box { background: #0c1422; border: 1px solid #16243a; border-radius: 12px; overflow: hidden; }

.at-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.at-table thead tr { background: #0f1928; border-bottom: 1px solid #16243a; }
.at-table th {
  padding: 11px 16px; text-align: left;
  font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: #243450;
  font-family: 'Geist Mono', monospace; white-space: nowrap;
}
.at-th-r { text-align: right; }

.at-row { border-bottom: 1px solid #0f1928; transition: background 0.12s; animation: atRow 0.2s ease both; }
.at-row:last-child { border-bottom: none; }
.at-row:hover { background: #0f1928; }
.at-row--dim { opacity: 0.38; }
@keyframes atRow { from{opacity:0;transform:translateX(-5px)} to{opacity:1;transform:translateX(0)} }

.at-table td { padding: 13px 16px; vertical-align: middle; }

/* TIME */
.at-time { display: flex; flex-direction: column; gap: 2px; font-family: 'Geist Mono', monospace; white-space: nowrap; }
.at-time-rel { font-size: 12px; color: #7a90b4; }
.at-time-abs { font-size: 10px; color: #243450; }

/* AGENT */
.at-agent { display: flex; align-items: center; gap: 9px; }
.at-agent-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.at-agent-name { font-size: 13px; font-weight: 600; color: #e2e8f4; white-space: nowrap; }
.at-agent-id { font-family: 'Geist Mono', monospace; font-size: 10px; color: #243450; margin-top: 1px; }

/* SEVERITY */
.at-sev {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 30px; height: 22px; padding: 0 8px; border-radius: 6px;
  font-family: 'Geist Mono', monospace; font-size: 10px; font-weight: 700;
  letter-spacing: 0.04em; border: 1px solid transparent;
}
.at-sev-p1 { background: rgba(239,68,68,0.13);  color: #ef4444; border-color: rgba(239,68,68,0.28);  }
.at-sev-p2 { background: rgba(245,158,11,0.13); color: #f59e0b; border-color: rgba(245,158,11,0.28); }
.at-sev-p3 { background: rgba(59,130,246,0.12); color: #3b82f6; border-color: rgba(59,130,246,0.24); }

/* TYPE */
.at-type {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Geist Mono', monospace; font-size: 10px; font-weight: 500;
  letter-spacing: 0.04em; padding: 3px 9px; border-radius: 5px;
  white-space: nowrap; border: 1px solid transparent;
}
.at-type--cpu { background: rgba(239,68,68,0.08);  color: #f87171; border-color: rgba(239,68,68,0.18);  }
.at-type--mem { background: rgba(139,92,246,0.10); color: #a78bfa; border-color: rgba(139,92,246,0.20); }
.at-type--off { background: #0f1928; color: #243450; border-color: #16243a; }

/* MESSAGE */
.at-msg { color: #7a90b4; font-size: 13px; }

/* ACTIONS */
.at-td-r { text-align: right; }
.at-actions { display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; }

.at-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 13px; border-radius: 7px; font-size: 12px;
  font-weight: 500; font-family: 'Outfit', sans-serif;
  border: 1px solid transparent; cursor: pointer;
  transition: all 0.15s; white-space: nowrap; min-width: 70px; justify-content: center;
}
.at-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.at-btn--ack    { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.22); color: #f59e0b; }
.at-btn--ack:hover:not(:disabled)    { background: rgba(245,158,11,0.16); border-color: rgba(245,158,11,0.38); }
.at-btn--resolve { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.22); color: #10b981; }
.at-btn--resolve:hover:not(:disabled) { background: rgba(16,185,129,0.16); border-color: rgba(16,185,129,0.38); }

.at-done {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 13px; border-radius: 7px; font-size: 12px;
  font-weight: 500; font-family: 'Outfit', sans-serif;
  background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.18);
  color: #10b981; min-width: 70px; justify-content: center;
}

/* EMPTY */
.at-empty {
  padding: 52px 20px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.at-empty-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: #0f1928; border: 1px solid #16243a;
  display: flex; align-items: center; justify-content: center;
  color: #243450; margin-bottom: 6px;
}
.at-empty p    { font-size: 14px; font-weight: 600; color: #3a5070; margin: 0; }
.at-empty span { font-size: 12px; color: #243450; }

/* FOOTER */
.at-foot { padding: 11px 2px 0; }
.at-foot-txt { font-size: 11px; color: #243450; font-family: 'Geist Mono', monospace; }
.at-foot-txt strong { color: #3a5070; }
`;
