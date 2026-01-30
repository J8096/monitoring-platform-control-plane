import { Link } from "react-router-dom";
import { timeAgo } from "../utils/timeAgo";

/**
 * ALERT TABLE (REDESIGNED)
 * 
 * ✓ Enhanced visual hierarchy
 * ✓ Better status badges
 * ✓ Improved readability
 * ✓ Smooth hover states
 */

export default function AlertTable({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm overflow-hidden">
        <div className="px-8 py-12 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-slate-400">No alerts to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {alerts.map((alert, index) => (
              <AlertRow key={alert._id || index} alert={alert} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= ALERT ROW ================= */

function AlertRow({ alert }) {
  const getSeverityStyles = (severity) => {
    switch (severity) {
      case "P1":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "P2":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "P3":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case "OFFLINE":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "CPU":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "MEMORY":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const isResolved = Boolean(alert.resolvedAt);

  return (
    <tr className="group hover:bg-slate-800/20 transition-colors duration-150">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
        {timeAgo(alert.createdAt)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-slate-200">
          {alert.agentName || "Unknown"}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getSeverityStyles(alert.severity)}`}>
          {alert.severity}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getTypeStyles(alert.type)}`}>
          {alert.type}
        </span>
      </td>
      
      <td className="px-6 py-4">
        <p className="text-sm text-slate-300 line-clamp-2">
          {alert.message}
        </p>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          {isResolved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Resolved
            </span>
          ) : (
            <>
              <button className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 rounded-md transition-all duration-150">
                Ack
              </button>
              <button className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-slate-700/50 rounded-md transition-all duration-150">
                Resolve
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
