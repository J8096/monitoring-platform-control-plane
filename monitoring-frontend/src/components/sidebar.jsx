import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Target, 
  Activity,
  Server,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import AgentCard from "./AgentCard";

/**
 * ENTERPRISE SIDEBAR — POLISHED & PROFESSIONAL
 *
 * ✔ Icon-rich navigation
 * ✔ Fleet status overview
 * ✔ Agent selection
 * ✔ Perfect spacing and hierarchy
 */

export default function Sidebar({
  agents = [],
  activeAgent,
  onSelectAgent,
  loading = false,
}) {
  /* ================= DERIVED ================= */
  const healthy = agents.filter((a) => a.status === "HEALTHY").length;
  const degraded = agents.filter((a) => a.status === "DEGRADED").length;
  const offline = agents.filter((a) => a.status === "OFFLINE").length;

  const navClass = ({ isActive }) =>
    `
      group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
      transition-all duration-200
      ${
        isActive
          ? "bg-slate-800 text-slate-100 shadow-sm"
          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
      }
    `;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950">
      {/* ================= PRODUCT BRANDING ================= */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-emerald-500" />
          <div className="text-sm font-semibold text-slate-100">
            Monitoring Platform
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Control Plane
        </div>
      </div>

      {/* ================= OPERATIONS NAV ================= */}
      <div className="px-3 py-4 border-b border-slate-800">
        <div className="px-2 mb-2 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
          Operations
        </div>

        <nav className="space-y-1">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/incidents" className={navClass}>
            <AlertTriangle className="w-4 h-4" />
            <span>Incidents</span>
          </NavLink>
          <NavLink to="/agents" className={navClass}>
  <Server className="w-4 h-4" />
  <span>Agents</span>
</NavLink>

        </nav>
      </div>

      {/* ================= RELIABILITY NAV ================= */}
      <div className="px-3 py-4 border-b border-slate-800">
        <div className="px-2 mb-2 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
          Reliability
        </div>

        <nav className="space-y-1">
          <NavLink to="/slo" className={navClass}>
            <Target className="w-4 h-4" />
            <span>SLO</span>
          </NavLink>
        </nav>
      </div>

      {/* ================= FLEET OVERVIEW ================= */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
            Fleet
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <FleetRow
            icon={CheckCircle}
            label="Healthy"
            value={healthy}
            color="text-emerald-400"
          />
          <FleetRow
            icon={AlertCircle}
            label="Degraded"
            value={degraded}
            color="text-amber-400"
          />
          <FleetRow
            icon={XCircle}
            label="Offline"
            value={offline}
            color="text-red-400"
          />
        </div>
      </div>

      {/* ================= AGENT LIST ================= */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
            Agents ({agents.length})
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-slate-400">
            Loading agents…
          </div>
        ) : agents.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">
            No agents registered
          </div>
        ) : (
          <div className="py-2">
            {agents.map((agent) => (
              <AgentCard
                key={agent._id}
                agent={agent}
                active={activeAgent?._id === agent._id}
                onClick={() => onSelectAgent(agent)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= FOOTER ================= */}
      <div className="px-4 py-3 border-t border-slate-800">
        <div className="text-[10px] text-slate-600">
          Internal Control Plane · v2.0
        </div>
      </div>
    </aside>
  );
}

/* ================= FLEET ROW COMPONENT ================= */

function FleetRow({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-slate-300">{label}</span>
      </div>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
