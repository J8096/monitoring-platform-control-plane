import { useState } from "react";
import api from "../api/api";
import { timeAgo } from "../utils/timeAgo";

/**
 * ALERT TABLE (ENTERPRISE-WIRED)
 */

export default function AlertTable({ alerts, reloadAlerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-sm overflow-hidden">
        <div className="px-8 py-12 text-center">
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
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Time</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Agent</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Severity</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase">Message</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/30">
            {alerts.map((alert) => (
              <AlertRow
                key={alert._id}
                alert={alert}
                reloadAlerts={reloadAlerts}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= ALERT ROW ================= */

/* ================= ALERT ROW ================= */

function AlertRow({ alert, reloadAlerts }) {
  const [loading, setLoading] = useState(false);

  const isAcknowledged = Boolean(alert.acknowledgedAt);
  const isResolved = Boolean(alert.resolvedAt);

  const handleAck = async () => {
    setLoading(true);
    try {
      await api.post(`/alerts/${alert._id}/ack`);
      reloadAlerts(); // refresh alert state
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setLoading(true);
    try {
      await api.post(`/alerts/${alert._id}/resolve`);
      reloadAlerts(); // refresh alert state
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="hover:bg-slate-800/20 transition">
      <td className="px-6 py-4 text-sm text-slate-400">
        {timeAgo(alert.createdAt)}
      </td>

      <td className="px-6 py-4 text-sm font-medium text-slate-200">
        {alert.agent?.name || "Unknown"}
      </td>

      <td className="px-6 py-4">
        <span className="px-2.5 py-1 text-xs rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
          {alert.severity}
        </span>
      </td>

      <td className="px-6 py-4">
        <span className="px-2.5 py-1 text-xs rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/20">
          {alert.type}
        </span>
      </td>

      <td className="px-6 py-4 text-sm text-slate-300">
        {alert.message}
      </td>

      <td className="px-6 py-4 text-right">
  {isResolved ? (
    <span className="inline-flex justify-center min-w-[96px] px-3 py-1 text-xs rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      Resolved
    </span>
  ) : (
    <div className="flex justify-end gap-2">
      {!isAcknowledged && (
        <button
          onClick={handleAck}
          disabled={loading}
          className="min-w-[96px] px-3 py-1.5 text-xs rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
        >
          Ack
        </button>
      )}

      <button
        onClick={handleResolve}
        disabled={loading}
        className="min-w-[96px] px-3 py-1.5 text-xs rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
      >
        Resolve
      </button>
    </div>
  )}
</td>

    </tr>
  );
}

