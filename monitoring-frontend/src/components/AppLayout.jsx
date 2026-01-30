import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import api from "../api/api";

import Header from "./Header";
import Sidebar from "./sidebar";

/**
 * APP LAYOUT — POLISHED ENTERPRISE CONTROL PLANE
 *
 * ✔ Clean authentication shell
 * ✔ Global agent state management
 * ✔ Sidebar agent selection
 * ✔ Central data source for pages
 * ✔ Safe polling & cleanup
 */

export default function AppLayout() {
  const navigate = useNavigate();

  /* ================= AUTH ================= */
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  /* ================= AGENTS (GLOBAL) ================= */
  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [agentsLoading, setAgentsLoading] = useState(true);

  /* ================= LOAD USER ================= */
  useEffect(() => {
    let alive = true;

    async function loadUser() {
      try {
        const res = await api.get("/auth/me");
        if (!alive) return;
        setUser(res.data ?? null);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setLoadingUser(false);
      }
    }

    loadUser();
    return () => {
      alive = false;
    };
  }, []);

  /* ================= LOAD AGENTS ================= */
  const loadAgents = useCallback(async () => {
    try {
      const res = await api.get("/agents");
      const data = res.data ?? [];

      setAgents(data);

      // Keep active agent stable if possible
      setActiveAgent((prev) => {
        if (!prev) return data[0] ?? null;
        return data.find((a) => a._id === prev._id) ?? data[0] ?? null;
      });
    } catch {
      // silent by design (network hiccups allowed)
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    if (alive) loadAgents();
    const interval = setInterval(loadAgents, 5000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [loadAgents]);

  /* ================= LOGOUT ================= */
  const handleLogout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /* ================= UI ================= */
  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* ================= HEADER ================= */}
      <Header
        user={user}
        loading={loadingUser}
        onLogout={handleLogout}
      />

      {/* ================= BODY ================= */}
      <div className="flex flex-1 overflow-hidden">
        {/* ================= SIDEBAR ================= */}
        <Sidebar
          agents={agents}
          activeAgent={activeAgent}
          onSelectAgent={setActiveAgent}
          loading={agentsLoading}
        />

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 overflow-hidden bg-slate-950">
          <Outlet
            context={{
              user,
              agents,
              activeAgent,
              reloadAgents: loadAgents, // 🔥 allows CreateAgentModal to refresh list
            }}
          />
        </main>
      </div>
    </div>
  );
}
