import { useOutletContext } from "react-router-dom";
import { useState } from "react";
import CreateAgentModal from "../components/agents/CreateAgentModal";

export default function Agents() {
  const { agents, activeAgent, user } = useOutletContext();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Agents</h1>

        {user?.role === "ADMIN" && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 px-4 py-2 rounded"
          >
            + Add Agent
          </button>
        )}
      </div>

      {agents.length === 0 ? (
        <p className="text-slate-400">No agents registered</p>
      ) : (
        <ul className="space-y-2">
          {agents.map((a) => (
            <li
              key={a._id}
              className={`p-3 border rounded ${
                activeAgent?._id === a._id
                  ? "border-indigo-500"
                  : "border-slate-700"
              }`}
            >
              <div className="flex justify-between">
                <span>{a.name}</span>
                <span className="text-sm">{a.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showCreate && (
        <CreateAgentModal
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
