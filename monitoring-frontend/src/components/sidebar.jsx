import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Server,
  Target,
  Activity,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  .sb { font-family: 'DM Sans', sans-serif; }
  .sb * { box-sizing: border-box; }

  .sb-scroll::-webkit-scrollbar { width: 2px; }
  .sb-scroll::-webkit-scrollbar-track { background: transparent; }
  .sb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }

  .sb-link {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(148,163,184,0.6);
    text-decoration: none;
    transition: background 0.12s, color 0.12s;
    user-select: none;
    white-space: nowrap;
  }
  .sb-link:hover { background: rgba(255,255,255,0.04); color: #cbd5e1; }
  .sb-link.active { background: rgba(255,255,255,0.06); color: #f1f5f9; }
  .sb-link.active::before {
    content:'';
    position:absolute; left:0; top:22%; height:56%; width:2px;
    border-radius:0 2px 2px 0;
    background:#10b981;
  }
  .sb-icon { flex-shrink:0; opacity:0.5; transition:opacity 0.12s; }
  .sb-link:hover .sb-icon, .sb-link.active .sb-icon { opacity:1; }

  .sb-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  @keyframes sb-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
  .sb-dot-on { animation: sb-pulse 2.4s ease-in-out infinite; }

  .sb-track { height:2px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; margin-top:4px; }
  .sb-fill  { height:100%; border-radius:2px; transition:width 0.6s ease; }

  .sb-agent-btn {
    display:flex; align-items:center; gap:9px;
    padding: 6px 12px;
    width:100%; border:none; background:transparent;
    cursor:pointer; text-align:left;
    transition:background 0.1s;
  }
  .sb-agent-btn:hover { background:rgba(255,255,255,0.03); }
  .sb-agent-btn.on { background:rgba(255,255,255,0.055); }

  @keyframes sb-shimmer { 0%,100%{opacity:0.25} 50%{opacity:0.45} }
  .sb-skel { animation:sb-shimmer 1.5s ease-in-out infinite; background:rgba(255,255,255,0.06); border-radius:5px; }

  @keyframes sb-live { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
  .sb-live-dot { animation:sb-live 2s ease-in-out infinite; }
`;

/* ─────────────────────────────────────────────────
   NAV
───────────────────────────────────────────────── */
const NAV = [
  {
    group: "Operations",
    links: [
      { to: "/",          end: true, Icon: LayoutDashboard, label: "Dashboard" },
      { to: "/incidents",            Icon: AlertTriangle,   label: "Incidents"  },
      { to: "/agents",               Icon: Server,          label: "Agents"     },
    ],
  },
  {
    group: "Reliability",
    links: [
      { to: "/slo", Icon: Target, label: "SLO" },
    ],
  },
];

const STATUS = {
  HEALTHY:  { color: "#10b981", pulse: true  },
  DEGRADED: { color: "#f59e0b", pulse: true  },
  OFFLINE:  { color: "#ef4444", pulse: false },
};

/* ─────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────── */
export default function Sidebar({ agents = [], activeAgent, onSelectAgent, loading = false }) {
  const healthy  = agents.filter(a => a.status === "HEALTHY").length;
  const degraded = agents.filter(a => a.status === "DEGRADED").length;
  const offline  = agents.filter(a => a.status === "OFFLINE").length;
  const total    = agents.length;

  return (
    <>
      <style>{STYLES}</style>
      <aside className="sb" style={{
        width: 200,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#070b12",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}>

        {/* ── Brand ─────────────────────────────── */}
        <div style={{ padding: "15px 13px 13px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Activity size={13} color="#10b981" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.25 }}>
                Monitoring
              </p>
              <p style={{
                margin: 0, marginTop: 1,
                fontSize: 9, fontFamily: "'IBM Plex Mono',monospace",
                color: "rgba(100,116,139,0.55)", letterSpacing: "0.09em",
              }}>
                INFRA OPS
              </p>
            </div>
          </div>
        </div>

        {/* ── Navigation ────────────────────────── */}
        <div style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          {NAV.map(({ group, links }) => (
            <div key={group} style={{ marginBottom: 10 }}>
              <p style={{
                margin: "0 0 2px 6px",
                fontSize: 9, fontFamily: "'IBM Plex Mono',monospace",
                fontWeight: 600, letterSpacing: "0.1em",
                color: "rgba(100,116,139,0.5)", textTransform: "uppercase",
              }}>
                {group}
              </p>
              <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {links.map(({ to, end, Icon, label }) => (
                  <NavLink
                    key={to} to={to} end={end}
                    className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}
                  >
                    <Icon size={14} className="sb-icon" />
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* ── Fleet ─────────────────────────────── */}
        <div style={{ padding: "11px 13px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
            <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, letterSpacing: "0.1em", color: "rgba(100,116,139,0.5)", textTransform: "uppercase" }}>
              Fleet
            </span>
            <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: "rgba(100,116,139,0.4)" }}>
              {total}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <FleetRow label="Healthy"  count={healthy}  total={total} color="#10b981" pulse />
            <FleetRow label="Degraded" count={degraded} total={total} color="#f59e0b" pulse />
            <FleetRow label="Offline"  count={offline}  total={total} color="#ef4444" />
          </div>
        </div>

        {/* ── Agents header ─────────────────────── */}
        <div style={{
          padding: "8px 13px 6px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, letterSpacing: "0.1em", color: "rgba(100,116,139,0.5)", textTransform: "uppercase" }}>
            Agents
          </span>
          <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: "rgba(100,116,139,0.4)" }}>
            {total}
          </span>
        </div>

        {/* ── Agents list ───────────────────────── */}
        <div className="sb-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="sb-skel" style={{ height: 34, opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div style={{ padding: "24px 13px", textAlign: "center" }}>
              <Server size={15} color="rgba(100,116,139,0.3)" />
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(100,116,139,0.4)" }}>
                No agents
              </p>
            </div>
          ) : (
            <div style={{ paddingTop: 4, paddingBottom: 8 }}>
              {agents.map(agent => (
                <AgentRow
                  key={agent._id}
                  agent={agent}
                  active={activeAgent?._id === agent._id}
                  onClick={() => onSelectAgent(agent)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────── */}
        <div style={{
          padding: "7px 13px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: "rgba(100,116,139,0.3)", letterSpacing: "0.07em" }}>
            CTRL PLANE · v2.0
          </span>
          <div className="sb-live-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
        </div>

      </aside>
    </>
  );
}

/* ─────────────────────────────────────────────────
   FLEET ROW
───────────────────────────────────────────────── */
function FleetRow({ label, count, total, color, pulse }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const dim = count === 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            className={pulse && count > 0 ? "sb-dot sb-dot-on" : "sb-dot"}
            style={{ background: color, opacity: dim ? 0.2 : 1 }}
          />
          <span style={{ fontSize: 12, fontWeight: 500, color: dim ? "rgba(100,116,139,0.35)" : "rgba(148,163,184,0.65)" }}>
            {label}
          </span>
        </div>
        <span style={{
          fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500,
          color: dim ? "rgba(100,116,139,0.3)" : color,
        }}>
          {count}
        </span>
      </div>
      <div className="sb-track">
        <div className="sb-fill" style={{ width: `${pct}%`, background: color, opacity: dim ? 0.1 : 0.6 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   AGENT ROW
───────────────────────────────────────────────── */
function AgentRow({ agent, active, onClick }) {
  const meta = STATUS[agent.status] || STATUS.OFFLINE;
  const highCPU = agent.cpu > 70;

  return (
    <button
      className={`sb-agent-btn${active ? " on" : ""}`}
      onClick={onClick}
      title={`${agent.name} · ${agent.status}${agent.status !== "OFFLINE" ? ` · CPU ${agent.cpu}%` : ""}`}
    >
      {/* Status dot */}
      <div
        className={meta.pulse ? "sb-dot sb-dot-on" : "sb-dot"}
        style={{ background: meta.color }}
      />

      {/* Name + label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, lineHeight: 1.3, fontSize: 12, fontWeight: 600,
          color: active ? "#f1f5f9" : "rgba(203,213,225,0.7)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {agent.name}
        </p>
        <p style={{
          margin: 0, marginTop: 1,
          fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500,
          letterSpacing: "0.07em", color: meta.color, opacity: 0.85,
        }}>
          {agent.status}
        </p>
      </div>

      {/* CPU % — only if not offline, right-aligned, never clips name */}
      {agent.status !== "OFFLINE" && (
        <span style={{
          fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 500,
          color: highCPU ? "#f59e0b" : "rgba(100,116,139,0.45)",
          flexShrink: 0,
        }}>
          {agent.cpu}%
        </span>
      )}

      {/* Chevron when selected */}
      {active && (
        <ChevronRight size={10} style={{ color: "#10b981", opacity: 0.7, flexShrink: 0 }} />
      )}
    </button>
  );
}
