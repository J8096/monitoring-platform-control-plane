import axios from "axios";
import {
  MOCK_AGENTS,
  MOCK_ALERTS,
  MOCK_INCIDENTS,
  MOCK_USER,
  generateMockMetrics,
  generateMockSLOData,
  shouldUseMockData,
} from "../services/mockData";

// ========================================
// MODE SELECTION
// ========================================
const USE_MOCK = shouldUseMockData();

console.log("🔧 API Mode:", USE_MOCK ? "MOCK DATA" : "REAL BACKEND");

// ========================================
// AXIOS INSTANCE
// ========================================
const API_BASE = import.meta.env.VITE_API_URL;

if (!USE_MOCK && !API_BASE) {
  console.error("❌ VITE_API_URL is missing in production");
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ========================================
// RESPONSE INTERCEPTOR
// ========================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401 && !USE_MOCK) {
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    } else {
      error.isNetworkError = true;
    }

    return Promise.reject(error);
  }
);

// ========================================
// MOCK HELPERS
// ========================================
const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 300));

// ========================================
// MOCK API IMPLEMENTATION
// ========================================
const mockAPI = {
  // ---------- AUTH ----------
  async get_auth_me() {
    await mockDelay();
    return { data: MOCK_USER };
  },

  async post_auth_login(data) {
    await mockDelay();
    console.log("🔐 Mock login:", data?.email);
    return { data: MOCK_USER };
  },

  async post_auth_logout() {
    await mockDelay();
    return { data: { message: "Logged out" } };
  },

  async post_auth_signup() {
    await mockDelay();
    return { data: { message: "User created" } };
  },

  // ---------- AGENTS ----------
  async get_agents() {
    await mockDelay();
    const agents = MOCK_AGENTS.map((agent) => ({
      ...agent,
      lastHeartbeat: new Date(
        Date.now() - agent.heartbeatAgeSec * 1000
      ).toISOString(),
      updatedAt: new Date(
        Date.now() - agent.heartbeatAgeSec * 1000
      ).toISOString(),
    }));
    return { data: agents };
  },

  async post_agents(data) {
    await mockDelay();
    const newAgent = {
      _id: `mock-${Date.now()}`,
      name: data.name,
      token: `mock-token-${Math.random().toString(36).slice(2)}`,
      status: "OFFLINE",
      lastHeartbeat: null,
      heartbeatAgeSec: null,
      missedHeartbeats: 0,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { data: newAgent };
  },

  // ---------- METRICS ----------
  async get_metrics(agentId, params) {
    await mockDelay();
    const range = params?.range || "5m";
    return { data: generateMockMetrics(agentId, range) };
  },

  // ---------- ALERTS ----------
  async get_alerts(params) {
    await mockDelay();
    let alerts = [...MOCK_ALERTS];

    if (params?.status === "active") {
      alerts = alerts.filter((a) => !a.resolvedAt);
    } else if (params?.status === "resolved") {
      alerts = alerts.filter((a) => a.resolvedAt);
    }

    const limit = params?.limit || 50;
    alerts = alerts.slice(0, limit);

    return { data: { count: alerts.length, data: alerts } };
  },

  async get_alerts_agent(agentId) {
    await mockDelay();
    return {
      data: MOCK_ALERTS.filter((a) => a.agentId === agentId),
    };
  },

  async post_alerts_ack(id) {
    await mockDelay();
    const alert = MOCK_ALERTS.find((a) => a._id === id);
    if (alert) {
      alert.acknowledgedAt = new Date().toISOString();
      alert.acknowledgedBy = "admin@example.com";
    }
    return { data: alert || {} };
  },

  async post_alerts_resolve(id) {
    await mockDelay();
    const alert = MOCK_ALERTS.find((a) => a._id === id);
    if (alert) {
      alert.resolvedAt = new Date().toISOString();
    }
    return { data: alert || {} };
  },

  // ---------- INCIDENTS ----------
  async get_incidents(params) {
    await mockDelay();
    let incidents = [...MOCK_INCIDENTS];

    if (params?.status && params.status !== "ALL") {
      incidents = incidents.filter((i) => i.status === params.status);
    }

    return { data: incidents };
  },

  async get_incident(id) {
    await mockDelay();
    return {
      data: MOCK_INCIDENTS.find((i) => i._id === id) || null,
    };
  },

  async post_incidents(data) {
    await mockDelay();
    return {
      data: {
        _id: `incident-${Date.now()}`,
        agentId: data.agentId || null,
        title: data.title,
        message: data.message || "",
        type: data.type || "CUSTOM",
        severity: data.severity,
        status: "OPEN",
        acknowledged: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  async post_incident_acknowledge(id) {
    await mockDelay();
    const incident = MOCK_INCIDENTS.find((i) => i._id === id);
    if (incident) {
      incident.acknowledged = true;
      incident.acknowledgedAt = new Date().toISOString();
    }
    return { data: incident || {} };
  },

  async post_incident_resolve(id) {
    await mockDelay();
    const incident = MOCK_INCIDENTS.find((i) => i._id === id);
    if (incident) {
      incident.status = "RESOLVED";
      incident.resolvedAt = new Date().toISOString();
    }
    return { data: incident || {} };
  },

  // ---------- SLO ----------
  async get_slo_uptime_24h() {
    await mockDelay();
    return { data: generateMockSLOData(24, 5) };
  },

  async get_slo_uptime_7d() {
    await mockDelay();
    return { data: generateMockSLOData(24 * 7, 60) };
  },

  // ---------- HEALTH ----------
  async get_health() {
    await mockDelay();
    return {
      data: { status: "ok", timestamp: new Date().toISOString() },
    };
  },
};

// ========================================
// WRAPPED API (MOCK ↔ REAL)
// ========================================
const wrappedAPI = {
  get(url, config) {
    if (!USE_MOCK) return api.get(url, config);

    const [path, qs] = url.split("?");
    const params =
      config?.params ||
      (qs ? Object.fromEntries(new URLSearchParams(qs)) : {});

    if (path === "/auth/me") return mockAPI.get_auth_me();
    if (path === "/agents") return mockAPI.get_agents();
    if (path.startsWith("/metrics/"))
      return mockAPI.get_metrics(path.split("/")[2], params);
    if (path === "/alerts") return mockAPI.get_alerts(params);
    if (path.startsWith("/alerts/agent/"))
      return mockAPI.get_alerts_agent(path.split("/")[3]);
    if (path === "/incidents") return mockAPI.get_incidents(params);
    if (path === "/health") return mockAPI.get_health();
    if (path === "/slo/uptime/24h") return mockAPI.get_slo_uptime_24h();
    if (path === "/slo/uptime/7d") return mockAPI.get_slo_uptime_7d();

    console.warn("⚠️ Unhandled mock GET:", path);
    return Promise.resolve({ data: null });
  },

  post(url, data, config) {
    if (!USE_MOCK) return api.post(url, data, config);

    if (url === "/auth/login") return mockAPI.post_auth_login(data);
    if (url === "/auth/logout") return mockAPI.post_auth_logout();
    if (url === "/auth/signup") return mockAPI.post_auth_signup(data);
    if (url === "/agents") return mockAPI.post_agents(data);
    if (url === "/incidents") return mockAPI.post_incidents(data);

    if (url.endsWith("/ack"))
      return mockAPI.post_alerts_ack(url.split("/")[2]);
    if (url.endsWith("/resolve"))
      return mockAPI.post_alerts_resolve(url.split("/")[2]);

    console.warn("⚠️ Unhandled mock POST:", url);
    return Promise.resolve({ data: null });
  },
};

export default wrappedAPI;
export { USE_MOCK };
