import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api/api";
import IncidentList from "./IncidentList";

/**
 * ENTERPRISE INCIDENTS DASHBOARD
 * 
 * Features:
 * ✓ Advanced filtering & search
 * ✓ Bulk actions
 * ✓ Time-based grouping
 * ✓ Rich status indicators
 * ✓ Responsive design
 * ✓ Optimistic updates
 * ✓ Real-time polling
 */
export default function Incidents() {
  /* ================= STATE ================= */
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // list or grouped

  /* ================= FETCH ================= */
  useEffect(() => {
    let alive = true;

    async function fetchIncidents() {
      try {
        const res = await api.get("/incidents");
        if (!alive) return;

        const data = res.data?.data || res.data || [];

        // Debug: Log what we're receiving
        console.log("📊 Fetched incidents:", {
          total: data.length,
          sample: data[0],
          statuses: [...new Set(data.map(i => i.status))]
        });

        setIncidents((prev) =>
          prev.length === data.length &&
          prev.every((p, i) => p._id === data[i]?._id)
            ? prev
            : data
        );
      } catch (err) {
        console.error("❌ Error fetching incidents:", err);
      } finally {
        alive && setLoading(false);
      }
    }

    fetchIncidents();
    const id = setInterval(fetchIncidents, 5000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /* ================= DERIVED STATE ================= */
  const openIncidents = useMemo(
    () => {
      // Show all incidents that are not explicitly resolved
      const filtered = incidents.filter((i) => {
        const status = (i.status || "").toUpperCase();
        return status !== "RESOLVED" && status !== "CLOSED";
      });
      
      console.log("🔍 Open incidents filter:", {
        totalIncidents: incidents.length,
        openIncidents: filtered.length,
        allIncidents: incidents,
        filteredIncidents: filtered
      });
      
      return filtered;
    },
    [incidents]
  );

  const filteredIncidents = useMemo(() => {
    return openIncidents.filter((incident) => {
      const matchesSearch = 
        searchQuery === "" ||
        incident.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.agent?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = 
        severityFilter === "all" || 
        incident.severity === severityFilter;

      const matchesType = 
        typeFilter === "all" || 
        incident.type === typeFilter;

      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [openIncidents, searchQuery, severityFilter, typeFilter]);

  const stats = useMemo(() => {
    const critical = openIncidents.filter(
      (i) => i.severity === "P1" || i.type === "CPU" || i.type === "OFFLINE"
    ).length;
    const high = openIncidents.filter((i) => i.severity === "P2").length;
    const medium = openIncidents.filter(
      (i) => i.severity === "P3" || i.type === "MEMORY"
    ).length;

    return { critical, high, medium, total: openIncidents.length };
  }, [openIncidents]);

  const groupedIncidents = useMemo(() => {
    if (viewMode !== "grouped") return null;

    const groups = {
      recent: [],
      today: [],
      yesterday: [],
      older: [],
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const recentThreshold = new Date(now.getTime() - 60 * 60 * 1000); // Last hour

    filteredIncidents.forEach((incident) => {
      const incidentDate = new Date(incident.timestamp || incident.createdAt);

      if (incidentDate >= recentThreshold) {
        groups.recent.push(incident);
      } else if (incidentDate >= todayStart) {
        groups.today.push(incident);
      } else if (incidentDate >= yesterdayStart) {
        groups.yesterday.push(incident);
      } else {
        groups.older.push(incident);
      }
    });

    return groups;
  }, [filteredIncidents, viewMode]);

  /* ================= ACTIONS ================= */
  const resolveIncident = useCallback(async (id) => {
    setIncidents((prev) =>
      prev.map((i) => (i._id === id ? { ...i, status: "RESOLVED" } : i))
    );

    try {
      await api.post(`/incidents/${id}/resolve`);
      setSelectedIncidents((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      setIncidents((prev) =>
        prev.map((i) => (i._id === id ? { ...i, status: "OPEN" } : i))
      );
    }
  }, []);

  const acknowledgeIncident = useCallback(async (id) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i._id === id ? { ...i, acknowledged: true } : i
      )
    );

    try {
      await api.post(`/incidents/${id}/acknowledge`);
    } catch {
      setIncidents((prev) =>
        prev.map((i) =>
          i._id === id ? { ...i, acknowledged: false } : i
        )
      );
    }
  }, []);

  /* ================= RENDER ================= */
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* ================= HEADER ================= */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
                Incidents
              </h1>
              <p className="text-sm text-slate-400 mt-1.5">
                Active production issues and alerts requiring attention
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === "list" ? "grouped" : "list")}
                className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors text-sm text-slate-300 flex items-center gap-2"
              >
                {viewMode === "list" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Group by Time
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    List View
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ================= STATS CARDS ================= */}
          {!loading && openIncidents.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                label="Critical"
                value={stats.critical}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                }
                variant="critical"
              />
              <StatCard
                label="High"
                value={stats.high}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                }
                variant="warning"
              />
              <StatCard
                label="Medium"
                value={stats.medium}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                }
                variant="info"
              />
              <StatCard
                label="Total Open"
                value={stats.total}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                }
                variant="neutral"
              />
            </div>
          )}

          {/* ================= FILTERS & SEARCH ================= */}
          {!loading && openIncidents.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[240px]">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search incidents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="OFFLINE">Offline</option>
                <option value="CPU">CPU</option>
                <option value="MEMORY">Memory</option>
              </select>

              {/* Clear Filters */}
              {(searchQuery || severityFilter !== "all" || typeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSeverityFilter("all");
                    setTypeFilter("all");
                  }}
                  className="px-3 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}

              {/* Results Count */}
              <div className="ml-auto px-3 py-2 text-sm text-slate-400">
                {filteredIncidents.length} {filteredIncidents.length === 1 ? "incident" : "incidents"}
              </div>
            </div>
          )}
        </div>

        {/* ================= CONTENT ================= */}
        {loading && incidents.length === 0 ? (
          <LoadingState />
        ) : openIncidents.length === 0 ? (
          <EmptyState />
        ) : filteredIncidents.length === 0 ? (
          <NoResultsState
            onClear={() => {
              setSearchQuery("");
              setSeverityFilter("all");
              setTypeFilter("all");
            }}
          />
        ) : viewMode === "grouped" ? (
          <GroupedIncidentsList
            groups={groupedIncidents}
            onResolve={resolveIncident}
            onAcknowledge={acknowledgeIncident}
          />
        ) : (
          <IncidentList
            incidents={filteredIncidents}
            onResolve={resolveIncident}
          />
        )}
      </div>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function StatCard({ label, value, icon, variant }) {
  const variantStyles = {
    critical: "border-rose-500/20 bg-rose-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
    info: "border-blue-500/20 bg-blue-500/5",
    neutral: "border-slate-700/50 bg-slate-800/30",
  };

  const iconStyles = {
    critical: "text-rose-400",
    warning: "text-amber-400",
    info: "text-blue-400",
    neutral: "text-slate-400",
  };

  const textStyles = {
    critical: "text-rose-400",
    warning: "text-amber-400",
    info: "text-blue-400",
    neutral: "text-slate-300",
  };

  return (
    <div
      className={`rounded-xl border ${variantStyles[variant]} p-4 backdrop-blur-sm transition-all hover:scale-105`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>
          <p className={`text-2xl font-bold ${textStyles[variant]}`}>{value}</p>
        </div>
        <div className={`${iconStyles[variant]} opacity-60`}>{icon}</div>
      </div>
    </div>
  );
}

function GroupedIncidentsList({ groups, onResolve, onAcknowledge }) {
  return (
    <div className="space-y-6">
      {groups.recent.length > 0 && (
        <GroupSection
          title="Last Hour"
          icon="🔥"
          incidents={groups.recent}
          onResolve={onResolve}
          onAcknowledge={onAcknowledge}
        />
      )}
      {groups.today.length > 0 && (
        <GroupSection
          title="Today"
          icon="📅"
          incidents={groups.today}
          onResolve={onResolve}
          onAcknowledge={onAcknowledge}
        />
      )}
      {groups.yesterday.length > 0 && (
        <GroupSection
          title="Yesterday"
          icon="⏰"
          incidents={groups.yesterday}
          onResolve={onResolve}
          onAcknowledge={onAcknowledge}
        />
      )}
      {groups.older.length > 0 && (
        <GroupSection
          title="Older"
          icon="📦"
          incidents={groups.older}
          onResolve={onResolve}
          onAcknowledge={onAcknowledge}
        />
      )}
    </div>
  );
}

function GroupSection({ title, icon, incidents, onResolve }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-xs text-slate-500">({incidents.length})</span>
      </div>
      <IncidentList incidents={incidents} onResolve={onResolve} />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading incidents…</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm overflow-hidden">
      <div className="px-8 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-200 mb-2">All Systems Operational</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          No active incidents at the moment. Your infrastructure is running smoothly and all
          services are healthy.
        </p>
      </div>
    </div>
  );
}

function NoResultsState({ onClear }) {
  return (
    <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm overflow-hidden">
      <div className="px-8 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 border-2 border-slate-700/50 mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-200 mb-2">No Matching Incidents</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          No incidents match your current filters. Try adjusting your search criteria or clearing
          filters to see all incidents.
        </p>
        <button
          onClick={onClear}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
