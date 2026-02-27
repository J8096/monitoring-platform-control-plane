import { Link } from "react-router-dom";
import { MOCK_AGENTS } from "../services/mockData";

const severityConfig = {
  P1: {
    label: "Critical",
    dot: "#ef4444",
    badge: "bg-red-500/10 text-red-400 border-red-500/20 ring-red-500/10",
    bar: "bg-red-500",
    glow: "shadow-red-500/10",
  },
  P2: {
    label: "High",
    dot: "#f59e0b",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20 ring-amber-500/10",
    bar: "bg-amber-400",
    glow: "shadow-amber-500/10",
  },
  P3: {
    label: "Medium",
    dot: "#3b82f6",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20 ring-blue-500/10",
    bar: "bg-blue-500",
    glow: "shadow-blue-500/10",
  },
};

const statusConfig = {
  OPEN: {
    label: "Open",
    cls: "bg-red-500/10 text-red-400 border border-red-500/20",
    dot: "bg-red-400 animate-pulse",
  },
  INVESTIGATING: {
    label: "Investigating",
    cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dot: "bg-amber-400 animate-pulse",
  },
  RESOLVED: {
    label: "Resolved",
    cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-400",
  },
};

function timeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function IncidentList({ incidents, onResolve }) {
  if (!incidents || incidents.length === 0) return null;

  return (
    <div className="space-y-2">
      {incidents.map((incident, idx) => (
        <IncidentRow
          key={incident._id}
          incident={incident}
          onResolve={onResolve}
          index={idx}
        />
      ))}
    </div>
  );
}

function IncidentRow({ incident, onResolve, index }) {
  const agent = MOCK_AGENTS.find((a) => a._id === incident.agentId);
  const agentName = agent?.name ?? incident.agent ?? "Unknown";
  const sev = severityConfig[incident.severity] || severityConfig.P3;
  const sta = statusConfig[incident.status] || statusConfig.OPEN;
  const isResolved = incident.status === "RESOLVED";

  return (
    <Link
      to={`/incidents/${incident._id}`}
      style={{ animationDelay: `${index * 40}ms` }}
      className="group flex items-center gap-0 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.045] hover:border-white/10 transition-all duration-200 overflow-hidden incident-row"
    >
      {/* Severity color bar */}
      <div className={`w-[3px] self-stretch flex-shrink-0 ${sev.bar} opacity-70`} />

      {/* Main content */}
      <div className="flex flex-1 items-center gap-5 px-5 py-4 min-w-0">
        {/* Severity dot */}
        <div className="flex-shrink-0">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: sev.dot, boxShadow: `0 0 6px ${sev.dot}` }}
          />
        </div>

        {/* Incident ID */}
        <span className="flex-shrink-0 font-mono text-xs text-slate-500 w-24 hidden sm:block">
          {incident._id}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
            {incident.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
            <span className="font-mono">{agentName}</span>
            <span className="text-slate-700">·</span>
            <span>{timeAgo(incident.createdAt)}</span>
          </div>
        </div>

        {/* Severity badge */}
        <div className="flex-shrink-0 hidden md:block">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide border ${sev.badge}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sev.dot }} />
            {incident.severity} · {sev.label}
          </span>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide ${sta.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sta.dot}`} />
            {sta.label}
          </span>
        </div>

        {/* Action */}
        <div className="flex-shrink-0 w-24 flex justify-end">
          {!isResolved ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onResolve?.(incident._id);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-400/30 hover:text-emerald-300 transition-all duration-150 active:scale-95"
            >
              Resolve
            </button>
          ) : (
            <span className="text-[11px] text-slate-600">—</span>
          )}
        </div>
      </div>
    </Link>
  );
}
