import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import api from "../api/api";

import Header from "./Header";
import Sidebar from "./Sidebar";


/**
 * APP LAYOUT — POLISHED ENTERPRISE CONTROL PLANE
 *
 * ✔ Clean authentication shell
 * ✔ Global agent state management
 * ✔ Professional layout structure
 * ✔ Navigation and logout
 * ✔ Context provider for pages
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
        setUser(res.data || null);
      } catch {
        alive && setUser(null);
      } finally {
        alive && setLoadingUser(false);
      }
    }

    loadUser();
    return () => {
      alive = false;
    };
  }, []);

  /* ================= LOAD AGENTS ================= */
  useEffect(() => {
    let alive = true;

    async function loadAgents() {
      try {
        const res = await api.get("/agents");
        if (!alive) return;

        const data = res.data || [];
        setAgents(data);

        setActiveAgent((prev) =>
          prev
            ? data.find((a) => a._id === prev._id) ?? data[0] ?? null
            : data[0] ?? null
        );
      } catch {
        // silent by design
      } finally {
        alive && setAgentsLoading(false);
      }
    }

    loadAgents();
    const id = setInterval(loadAgents, 5000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

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
      <Header user={user} loading={loadingUser} onLogout={handleLogout} />

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
          <Outlet context={{ agents, activeAgent, user }} />
        </main>
      </div>
    </div>
  );
}
