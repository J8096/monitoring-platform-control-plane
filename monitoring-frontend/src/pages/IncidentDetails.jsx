import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/api";

/**
 * INCIDENT DETAILS - Fixed for your data structure
 * Works with: agent, severity, type, message, timestamp, status
 */
export default function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  useEffect(() => {
    let alive = true;

    async function fetchIncident() {
      try {
        const res = await api.get(`/incidents/${id}`);
        if (!alive) return;
        
        // Handle both nested and direct data
        const data = res.data?.data || res.data;
        setIncident(data || null);
      } catch (err) {
        console.error("Error fetching incident:", err);
        alive && setIncident(null);
      } finally {
        alive && setLoading(false);
      }
    }

    fetchIncident();
    const poll = setInterval(fetchIncident, 5000);

    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [id]);

  /* ================= ACTIONS ================= */
  const resolveIncident = async () => {
    try {
      await api.post(`/incidents/${id}/resolve`);
      setIncident((prev) => prev ? { ...prev, status: "RESOLVED" } : null);
    } catch (err) {
      console.error("Failed to resolve incident:", err);
    }
  };

  const acknowledgeIncident = async () => {
    try {
      await api.post(`/incidents/${id}/acknowledge`);
      setIncident((prev) => prev ? { ...prev, acknowledged: true } : null);
    } catch (err) {
      console.error("Failed to acknowledge incident:", err);
    }
  };

  /* ================= HELPERS ================= */
  const timeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";
    
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const formatFullDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSeverityInfo = (severity) => {
    switch (severity) {
      case "P1":
        return { 
          label: "Critical", 
          color: "text-rose-400", 
          bg: "bg-rose-500/10", 
          border: "border-rose-500/20" 
        };
      case "P2":
        return { 
          label: "High", 
          color: "text-amber-400", 
          bg: "bg-amber-500/10", 
          border: "border-amber-500/20" 
        };
      case "P3":
        return { 
          label: "Medium", 
          color: "text-blue-400", 
          bg: "bg-blue-500/10", 
          border: "border-blue-500/20" 
        };
      default:
        return { 
          label: "Unknown", 
          color: "text-slate-400", 
          bg: "bg-slate-500/10", 
          border: "border-slate-500/20" 
        };
    }
  };

  const getTypeInfo = (type) => {
    switch (type) {
      case "OFFLINE":
        return {
          icon: "🔴",
          color: "text-rose-400",
          bg: "bg-rose-500/10",
          border: "border-rose-500/20"
        };
      case "CPU":
        return {
          icon: "⚡",
          color: "text-purple-400",
          bg: "bg-purple-500/10",
          border: "border-purple-500/20"
        };
      case "MEMORY":
        return {
          icon: "💾",
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20"
        };
      default:
        return {
          icon: "📊",
          color: "text-slate-400",
          bg: "bg-slate-500/10",
          border: "border-slate-500/20"
        };
    }
  };

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading incident details...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 border-2 border-slate-700/50 flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Incident Not Found</h3>
          <p className="text-sm text-slate-400 mb-6">The incident you're looking for doesn't exist or has been deleted.</p>
          <Link
            to="/incidents"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Incidents
          </Link>
        </div>
      </div>
    );
  }

  const isResolved = incident.status === "RESOLVED";
  const severityInfo = getSeverityInfo(incident.severity);
  const typeInfo = getTypeInfo(incident.type);

  /* ================= MAIN UI ================= */
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        
        {/* ================= BACK BUTTON ================= */}
        <button
          onClick={() => navigate("/incidents")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Incidents
        </button>

        {/* ================= HEADER ================= */}
        <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              {/* Type Icon */}
              <div className={`w-12 h-12 rounded-xl ${typeInfo.bg} ${typeInfo.border} border flex items-center justify-center text-2xl`}>
                {typeInfo.icon}
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-slate-100 mb-2">
                  {incident.type} Alert - {incident.agent || "Unknown Agent"}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Status Badge */}
                  {isResolved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Resolved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                      Open
                    </span>
                  )}

                  {/* Severity Badge */}
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${severityInfo.bg} ${severityInfo.color} border ${severityInfo.border}`}>
                    {incident.severity} - {severityInfo.label}
                  </span>

                  {/* Type Badge */}
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${typeInfo.bg} ${typeInfo.color} border ${typeInfo.border}`}>
                    {typeInfo.icon} {incident.type}
                  </span>

                  {/* Acknowledged Badge */}
                  {incident.acknowledged && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {!isResolved && (
              <div className="flex items-center gap-2">
                {!incident.acknowledged && (
                  <button
                    onClick={acknowledgeIncident}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={resolveIncident}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Resolve Incident
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= MESSAGE ================= */}
        {incident.message && (
          <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Message</h2>
            <p className="text-slate-200 leading-relaxed">{incident.message}</p>
          </div>
        )}

        {/* ================= DETAILS GRID ================= */}
        <div className="grid grid-cols-2 gap-4">
          {/* Incident Info */}
          <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Incident Information</h2>
            <div className="space-y-4">
              <InfoRow label="Incident ID" value={incident._id} mono />
              <InfoRow label="Agent" value={incident.agent || "Unknown"} />
              <InfoRow label="Type" value={incident.type} />
              <InfoRow label="Severity" value={`${incident.severity} - ${severityInfo.label}`} />
              <InfoRow label="Status" value={incident.status} highlight />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Timeline</h2>
            <div className="space-y-4">
              <TimelineEntry 
                label="Created"
                time={formatFullDate(incident.timestamp || incident.createdAt)}
                relative={timeAgo(incident.timestamp || incident.createdAt)}
                icon={
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                }
              />
              {incident.acknowledgedAt && (
                <TimelineEntry 
                  label="Acknowledged"
                  time={formatFullDate(incident.acknowledgedAt)}
                  relative={timeAgo(incident.acknowledgedAt)}
                  icon={
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  }
                />
              )}
              {incident.resolvedAt && (
                <TimelineEntry 
                  label="Resolved"
                  time={formatFullDate(incident.resolvedAt)}
                  relative={timeAgo(incident.resolvedAt)}
                  icon={
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* ================= RAW DATA (FOR DEBUGGING) ================= */}
        <details className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm">
          <summary className="p-4 cursor-pointer text-sm font-semibold text-slate-400 hover:text-slate-300 transition-colors">
            Show Raw Data (Debug)
          </summary>
          <div className="px-4 pb-4">
            <pre className="text-xs text-slate-400 bg-slate-950 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(incident, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function InfoRow({ label, value, mono = false, highlight = false }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""} ${highlight ? "font-semibold text-slate-100" : "text-slate-300"}`}>
        {value}
      </span>
    </div>
  );
}

function TimelineEntry({ label, time, relative, icon }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{relative}</div>
        <div className="text-xs text-slate-500 font-mono mt-1">{time}</div>
      </div>
    </div>
  );
}
