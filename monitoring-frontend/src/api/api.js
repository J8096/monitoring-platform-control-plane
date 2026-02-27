import axios from "axios";
import {
  MOCK_AGENTS,
  MOCK_USER,
  getMockAlerts,
  acknowledgeMockAlert,
  resolveMockAlert,
  getMockIncidents,
  resolveMockIncident,
  acknowledgeMockIncident,
  generateMockMetrics,
  generateMockSLOData,
  shouldUseMockData,
} from "../services/mockData";

/* ========================================
   MODE SELECTION
======================================== */

const USE_MOCK = shouldUseMockData();
console.log("🔧 API Mode:", USE_MOCK ? "MOCK DATA" : "REAL BACKEND");

/* ========================================
   REAL BACKEND AXIOS INSTANCE
======================================== */

const API_BASE = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !USE_MOCK) {
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/* ========================================
   MOCK UTIL
======================================== */

const mockDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 300));

/* ========================================
   MOCK IMPLEMENTATION
======================================== */

const mockAPI = {
  /* ---------- AUTH ---------- */
  async getAuthMe() {
    await mockDelay();
    return { data: MOCK_USER };
  },

  async postAuthLogin() {
    await mockDelay();
    return { data: MOCK_USER };
  },

  async postAuthLogout() {
    await mockDelay();
    return { data: { success: true } };
  },

  /* ---------- AGENTS ---------- */
  async getAgents() {
    await mockDelay();
    return { data: [...MOCK_AGENTS] };
  },

  async postAgents(data) {
    await mockDelay();
    const now = Date.now();

    const newAgent = {
      _id: `mock-${now}`,
      name: data.name,
      status: "OFFLINE",
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };

    MOCK_AGENTS.push(newAgent);
    return { data: newAgent };
  },

  /* ---------- METRICS ---------- */
  async getMetrics(agentId, range) {
    await mockDelay();
    return {
      data: generateMockMetrics(agentId, range),
    };
  },

  /* ---------- ALERTS ---------- */
  async getAlerts() {
    await mockDelay();
    return { data: getMockAlerts() };
  },

  async postAlertAck(id) {
    await mockDelay();
    acknowledgeMockAlert(id);
    return { data: { success: true } };
  },

  async postAlertResolve(id) {
    await mockDelay();
    resolveMockAlert(id);
    return { data: { success: true } };
  },

  /* ---------- INCIDENTS ---------- */
  async getIncidents() {
    await mockDelay();
    return { data: getMockIncidents() };
  },

  async getIncidentById(id) {
    await mockDelay();
    const incident = getMockIncidents().find(
      (i) => i._id === id
    );
    return { data: incident || null };
  },

  async postIncident(data) {
    await mockDelay();
    return {
      data: {
        _id: `incident-${Date.now()}`,
        ...data,
        status: "OPEN",
        createdAt: new Date().toISOString(),
      },
    };
  },

  async postIncidentResolve(id) {
    await mockDelay();
    resolveMockIncident(id);
    return { data: { success: true } };
  },

  async postIncidentAck(id) {
    await mockDelay();
    acknowledgeMockIncident(id);
    return { data: { success: true } };
  },

  /* ---------- SLO ---------- */
  async getSlo24h() {
    await mockDelay();
    return { data: generateMockSLOData(24, 5) };
  },

  async getSlo7d() {
    await mockDelay();
    return { data: generateMockSLOData(168, 60) };
  },
};

/* ========================================
   WRAPPED API
======================================== */

const api = {
  async get(url, config) {
    if (!USE_MOCK) return axiosInstance.get(url, config);

    const [path, queryString] = url.split("?");
    const query = new URLSearchParams(queryString || "");

    /* ---------- AUTH ---------- */
    if (path === "/auth/me") return mockAPI.getAuthMe();

    /* ---------- AGENTS ---------- */
    if (path === "/agents") return mockAPI.getAgents();

    /* ---------- METRICS ---------- */
    if (path.startsWith("/metrics/")) {
      const agentId = path.split("/")[2];
      const range = query.get("range");
      return mockAPI.getMetrics(agentId, range);
    }

    /* ---------- ALERTS ---------- */
    if (path === "/alerts") return mockAPI.getAlerts();

    /* ---------- INCIDENTS ---------- */
    if (path === "/incidents") return mockAPI.getIncidents();

    if (path.startsWith("/incidents/")) {
      const id = path.split("/")[2];
      return mockAPI.getIncidentById(id);
    }

    /* ---------- SLO ---------- */
    if (path === "/slo/uptime/24h") return mockAPI.getSlo24h();
    if (path === "/slo/uptime/7d") return mockAPI.getSlo7d();

    return Promise.resolve({ data: null });
  },

  async post(url, data) {
    if (!USE_MOCK) return axiosInstance.post(url, data);

    /* ---------- AUTH ---------- */
    if (url === "/auth/login")
      return mockAPI.postAuthLogin(data);

    if (url === "/auth/logout")
      return mockAPI.postAuthLogout();

    /* ---------- AGENTS ---------- */
    if (url === "/agents")
      return mockAPI.postAgents(data);

    /* ---------- ALERT ACK ---------- */
    if (url.startsWith("/alerts/") && url.endsWith("/ack")) {
      const id = url.split("/")[2];
      return mockAPI.postAlertAck(id);
    }

    /* ---------- ALERT RESOLVE ---------- */
    if (url.startsWith("/alerts/") && url.endsWith("/resolve")) {
      const id = url.split("/")[2];
      return mockAPI.postAlertResolve(id);
    }

    /* ---------- INCIDENT CREATE ---------- */
    if (url === "/incidents")
      return mockAPI.postIncident(data);

    /* ---------- INCIDENT RESOLVE ---------- */
    if (
      url.startsWith("/incidents/") &&
      url.endsWith("/resolve")
    ) {
      const id = url.split("/")[2];
      return mockAPI.postIncidentResolve(id);
    }

    /* ---------- INCIDENT ACK ---------- */
    if (
      url.startsWith("/incidents/") &&
      url.endsWith("/acknowledge")
    ) {
      const id = url.split("/")[2];
      return mockAPI.postIncidentAck(id);
    }

    return Promise.resolve({ data: null });
  },
};

export default api;
export { USE_MOCK };
