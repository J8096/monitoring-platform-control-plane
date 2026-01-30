import { useState } from "react";
import api from "../../api/api";

export default function CreateAgentModal({ onClose }) {
  const [name, setName] = useState("");
  const [result, setResult] = useState(null);

  async function createAgent() {
    const res = await api.post("/agents", { name });
    setResult(res.data);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-slate-900 p-6 rounded w-96">
        {!result ? (
          <>
            <h2 className="text-lg mb-3">Create Agent</h2>
            <input
              className="w-full p-2 mb-3 bg-slate-800"
              placeholder="Agent name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className="bg-indigo-600 px-4 py-2 rounded"
              onClick={createAgent}
            >
              Create
            </button>
          </>
        ) : (
          <>
            <p className="text-green-400 mb-2">Agent created</p>
            <p className="text-sm">Agent ID</p>
            <code className="block mb-2">{result.agentId}</code>
            <p className="text-sm">Token</p>
            <code className="block text-red-400">{result.token}</code>
            <p className="text-xs mt-2">
              Save this token now. You won’t see it again.
            </p>
          </>
        )}

        <button
          className="mt-4 text-sm underline"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
