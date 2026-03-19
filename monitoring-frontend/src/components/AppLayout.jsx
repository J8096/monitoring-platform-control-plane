import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import api from "../api/api";

import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const navigate = useNavigate();

  /* ── Auth ── */
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  /* ── Agents ── */
  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [agentsLoading, setAgentsLoading] = useState(true);

  /* ── Load user ── */
  useEffect(() => {
    let alive = true;
    async function loadUser() {
      try {
        const res = await api.get("/auth/me");
        if (alive) setUser(res.data ?? null);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setLoadingUser(false);
      }
    }
    loadUser();
    return () => { alive = false; };
  }, []);

  /* ── Load agents ── */
  const loadAgents = useCallback(async () => {
    try {
      const res = await api.get("/agents");
      const data = res.data ?? [];
      setAgents(data);
      setActiveAgent(prev =>
        prev
          ? (data.find(a => a._id === prev._id) ?? data[0] ?? null)
          : (data[0] ?? null)
      );
    } catch {
      /* silent */
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    if (alive) loadAgents();
    const id = setInterval(loadAgents, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [loadAgents]);

  /* ── Logout ── */
  const handleLogout = useCallback(async () => {
    try { await api.post("/auth/logout"); } finally {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /* ── Render ── */
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
      background: "#070b12",
      color: "#f1f5f9",
    }}>
      {/* Header */}
      <Header user={user} loading={loadingUser} onLogout={handleLogout} />

      {/* Body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* Sidebar — fixed width, never shrinks */}
        <Sidebar
          agents={agents}
          activeAgent={activeAgent}
          onSelectAgent={setActiveAgent}
          loading={agentsLoading}
        />

        {/* Main content — takes remaining space, independently scrollable */}
        <main style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflowY: "auto",
          background: "#080c14",
        }}>
          <Outlet context={{ user, agents, activeAgent, reloadAgents: loadAgents }} />
        </main>

      </div>
    </div>
  );
}
