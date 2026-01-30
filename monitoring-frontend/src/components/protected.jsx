import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/api";

export default function Protected({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    api
      .get("/auth/me")
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      window.location.href = "/login";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Checking authentication…
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ SAFE RENDER (this is the key fix)
  return typeof children === "function"
    ? children(logout)
    : children;
}
