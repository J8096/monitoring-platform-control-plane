import { Link } from "react-router-dom";

/**
 * INCIDENT LIST - Fixed to match your actual data structure
 * Works with: agent, severity, type, message, timestamp, status
 */

export default function IncidentList({ incidents, onResolve }) {
  if (!incidents || incidents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <IncidentCard
          key={incident._id}
          incident={incident}
          onResolve={onResolve}
        />
      ))}
    </div>
  );
}

/* ================= INCIDENT CARD ================= */

function IncidentCard({ incident, onResolve }) {
  const getTypeStyles = (type) => {
    switch (type) {
      case "OFFLINE":
        return {
          bg: "bg-rose-500/10",
          border: "border-rose-500/20",
          text: "text-rose-400",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
        };
      case "CPU":
        return {
          bg: "bg-purple-500/10",
          border: "border-purple-500/20",
          text: "text-purple-400",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
            </svg>
          ),
        };
      case "MEMORY":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          text: "text-amber-400",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
            </svg>
          ),
        };
      default:
        return {
          bg: "bg-slate-500/10",
          border: "border-slate-500/20",
          text: "text-slate-400",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
        };
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case "P1":
        return {
          bg: "bg-rose-500/10",
          border: "border-rose-500/20",
          text: "text-rose-400",
          label: "Critical",
        };
      case "P2":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          text: "text-amber-400",
          label: "High",
        };
      case "P3":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          text: "text-blue-400",
          label: "Medium",
        };
      default:
        return {
          bg: "bg-slate-500/10",
          border: "border-slate-500/20",
          text: "text-slate-400",
          label: "Unknown",
        };
    }
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return "Unknown time";
    
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const typeStyle = getTypeStyles(incident.type);
  const severityStyle = getSeverityStyles(incident.severity);
  const isResolved = incident.status === "RESOLVED";

  return (
    <Link 
      to={`/incidents/${incident._id}`}
      className="group block rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm hover:border-slate-700/50 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* LEFT SIDE - MAIN INFO */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-3">
              {/* TYPE ICON */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${typeStyle.bg} ${typeStyle.border} border flex items-center justify-center ${typeStyle.text}`}>
                {typeStyle.icon}
              </div>

              {/* TITLE & META */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-base font-semibold text-slate-100 line-clamp-1">
                    {incident.type} Alert - {incident.agent || "Unknown Agent"}
                  </h3>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  {/* Time */}
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {timeAgo(incident.timestamp || incident.createdAt)}
                  </span>
                  
                  {/* Agent */}
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                    {incident.agent || "Unknown"}
                  </span>
                  
                  {/* Severity Badge */}
                  <span className="text-slate-600">•</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${severityStyle.bg} ${severityStyle.border} border ${severityStyle.text}`}>
                    {incident.severity} - {severityStyle.label}
                  </span>
                  
                  {/* Type Badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${typeStyle.bg} ${typeStyle.border} border ${typeStyle.text}`}>
                    {incident.type}
                  </span>
                </div>
              </div>
            </div>

            {/* MESSAGE */}
            {incident.message && (
              <p className="text-sm text-slate-300 line-clamp-2 mt-2 ml-13 bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/30">
                {incident.message}
              </p>
            )}
          </div>

          {/* RIGHT SIDE - STATUS & ACTIONS */}
          <div className="flex flex-col items-end gap-3">
            {/* STATUS BADGE */}
            {isResolved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Resolved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                Open
              </span>
            )}

            {/* ACTIONS */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {!isResolved && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onResolve(incident._id);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 rounded-md transition-all duration-150 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
