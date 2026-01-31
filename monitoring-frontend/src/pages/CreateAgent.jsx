import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function CreateAgentModal({ onClose }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState(null);
  const [error, setError] = useState("");

  /* ================= CLOSE HANDLER ================= */
  const handleClose = () => {
    if (onClose) {
      onClose(); // modal usage
    } else {
      navigate("/agents", { replace: true }); // route usage
    }
  };

  /* ================= CREATE ================= */
  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/agents", { name });
      setAgent(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create agent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 shadow-xl p-6">
        {/* ================= HEADER ================= */}
        <h2 className="text-lg font-semibold text-white mb-4">
          Create Agent
        </h2>

        {/* ================= FORM ================= */}
        {!agent && (
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Agent name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
                {error}
              </div>
            )}

            {/* ================= ACTIONS ================= */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
              >
                {loading ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        )}

        {/* ================= SUCCESS ================= */}
        {agent && (
          <div className="space-y-4">
            <div className="text-emerald-400 font-medium">
              Agent created
            </div>

            <Field label="Agent ID">
              {agent._id}
            </Field>

            <Field label="Token" danger>
              {agent.token}
            </Field>

            <p className="text-xs text-slate-400">
              Save this token now. You won’t see it again.
            </p>

            {/* ================= FOOTER ================= */}
            <div className="flex justify-end pt-2 pr-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm rounded-md bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= HELPER ================= */

function Field({ label, children, danger = false }) {
  return (
    <div
      className={`rounded-lg border p-3 text-xs break-all ${
        danger
          ? "border-red-500/30 bg-red-500/5 text-red-400"
          : "border-slate-700 bg-slate-950 text-slate-300"
      }`}
    >
      <div className="text-slate-400 mb-1">{label}</div>
      <code>{children}</code>
    </div>
  );
}
