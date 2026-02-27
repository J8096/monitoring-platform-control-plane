import axios from "axios";

/* ================= BASE URL ================= */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://monitoring-platform-control-plane-3.onrender.com/api";

if (!API_BASE) {
  console.error("❌ API base URL is not defined.");
} else {
  console.log("🚀 API BASE:", API_BASE);
}

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000, // increased slightly for Render cold start
});

/* ================= RESPONSE INTERCEPTOR ================= */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Timeout handling
    if (error.code === "ECONNABORTED") {
      console.error("⏳ Request timed out.");
    }

    // Auth expired handling
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
  async login(data) {
    const res = await api.post("/auth/login", data);
    return res.data;
  },

  async logout() {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  async me() {
    const res = await api.get("/auth/me");
    return res.data;
  },

  /* ---------- AGENTS ---------- */
  async get_agents() {
    const res = await api.get("/agents");
    return res.data;
  },

  async post_agents(data) {
    const res = await api.post("/agents", data);
    return res.data;
  },

  async get_agent(id) {
    const res = await api.get(`/agents/${id}`);
    return res.data;
  },

  /* ---------- METRICS ---------- */
  async get_metrics(agentId) {
    const res = await api.get(`/metrics/${agentId}`);
    return res.data;
  },

  /* ---------- INCIDENTS ---------- */
  async get_incidents() {
    const res = await api.get("/incidents");
    return res.data;
  },

  /* ---------- ALERTS ---------- */
  async get_alerts() {
    const res = await api.get("/alerts");
    return res.data;
  },
};

export default apiClient;