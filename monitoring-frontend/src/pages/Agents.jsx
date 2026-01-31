import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import CreateAgentModal from "../components/agents/CreateAgentModal";

export default function Agents() {
  const { agents, activeAgent, user } = useOutletContext();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="px-8 py-6 max-w-7xl mx-auto">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Agents</h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor and manage infrastructure agents
          </p>
        </div>

        {user?.role === "ADMIN" && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition px-4 py-2 rounded-md text-sm font-medium"
          >
            + Add Agent
          </button>
        )}
      </div>

      {/* ===== Stats ===== */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Agents" value={agents.length} />
        <StatCard
          label="Healthy"
          value={agents.filter((a) => a.status === "HEALTHY").length}
          color="text-emerald-400"
        />
        <StatCard
          label="Offline"
          value={agents.filter((a) => a.status === "OFFLINE").length}
          color="text-red-400"
        />
      </div>

      {/* ===== Agents Table ===== */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
        {agents.length === 0 ? (
          <div className="p-6 text-slate-400 text-sm">
            No agents registered
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr className="text-left text-slate-400">
                <th className="px-6 py-3 font-medium">Agent</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              {agents.map((a) => (
                <tr
                  key={a._id}
                  className={`border-b border-slate-800 hover:bg-slate-800/40 transition ${
                    activeAgent?._id === a._id
                      ? "bg-indigo-500/10"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {a.name}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateAgentModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

/* ===== Small Components ===== */

function StatCard({ label, value, color = "text-white" }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    HEALTHY: "bg-emerald-500/10 text-emerald-400",
    OFFLINE: "bg-red-500/10 text-red-400",
    DEGRADED: "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
        styles[status] || "bg-slate-700 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}
