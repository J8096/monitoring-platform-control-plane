import axios from "axios";

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: process.env.API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {

    "Content-Type": "application/json",
  },
  timeout: 15000,
});

/* ================= API CLIENT ================= */

const apiClient = {
  // AUTH
  async login(data) {
    return (await api.post("/auth/login", data)).data;
  },

  async logout() {
    return (await api.post("/auth/logout")).data;
  },

  async me() {
    return (await api.get("/auth/me")).data;
  },

  // AGENTS
  async get_agents() {
    return (await api.get("/agents")).data;
  },

  async post_agents(data) {
    return (await api.post("/agents", data)).data;
  },

  async get_agent(id) {
    return (await api.get(`/agents/${id}`)).data;
  },

  // METRICS
  async get_metrics(agentId) {
    return (await api.get(`/metrics/${agentId}`)).data;
  },

  // INCIDENTS
  async get_incidents() {
    return (await api.get("/incidents")).data;
  },

  // ALERTS
  async get_alerts() {
    return (await api.get("/alerts")).data;
  },
};

export default apiClient;
