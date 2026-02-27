import axios from "axios";

/* ================= BASE URL ================= */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://monitoring-platform-control-plane-3.onrender.com/api";

console.log("🚀 API BASE:", API_BASE);

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000, // allow cold start delay
});

/* ================= RESPONSE INTERCEPTOR ================= */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("⏳ Request timed out (possible cold start).");
    }

    if (error.response?.status === 401) {
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

/* ================= API CLIENT ================= */

const apiClient = {
  /* ---------- AUTH ---------- */
  login: async (data) => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  logout: async () => {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  me: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  /* ---------- AGENTS ---------- */
  get_agents: async () => {
    const res = await api.get("/agents");
    return res.data;
  },

  post_agents: async (data) => {
    const res = await api.post("/agents", data);
    return res.data;
  },

  get_agent: async (id) => {
    const res = await api.get(`/agents/${id}`);
    return res.data;
  },

  /* ---------- METRICS ---------- */
  get_metrics: async (agentId) => {
    const res = await api.get(`/metrics/${agentId}`);
    return res.data;
  },

  /* ---------- INCIDENTS ---------- */
  get_incidents: async () => {
    const res = await api.get("/incidents");
    return res.data;
  },

  /* ---------- ALERTS ---------- */
  get_alerts: async () => {
    const res = await api.get("/alerts");
    return res.data;
  },
};

export default apiClient;