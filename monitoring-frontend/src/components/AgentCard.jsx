import { Server, Circle } from "lucide-react";

/**
 * AGENT CARD — POLISHED SIDEBAR ITEM
 *
 * ✔ Status indicator with colors
 * ✔ Uptime display
 * ✔ Active state styling
 * ✔ Hover effects
 */

export default function AgentCard({ agent, active, onClick }) {
  const statusConfig = {
    HEALTHY: {
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
    DEGRADED: {
      color: "bg-amber-500",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/20",
    },
    OFFLINE: {
      color: "bg-red-500",
      textColor: "text-red-400",
      borderColor: "border-red-500/20",
    },
  };

  const config = statusConfig[agent.status] || statusConfig.OFFLINE;

  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-2.5 flex items-start gap-3
        border-l-2 transition-all duration-200
        ${
          active
            ? `bg-slate-900 ${config.borderColor} border-l-2`
            : "border-l-transparent hover:bg-slate-900/50"
        }
      `}
    >
      {/* ICON + STATUS */}
      <div className="relative pt-0.5">
        <Server className="w-4 h-4 text-slate-400" />
        <Circle
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${config.color} rounded-full`}
          fill="currentColor"
        />
      </div>

      {/* INFO */}
      <div className="flex-1 text-left min-w-0">
        <div className="text-sm font-medium text-slate-200 truncate">
          {agent.name || agent._id}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-medium ${config.textColor}`}>
            {agent.status}
          </span>
          {agent.uptime && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-[10px] text-slate-500 tabular-nums">
                {agent.uptime}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
