

import axios from "axios";
import {
  MOCK_AGENTS,
  MOCK_ALERTS,
  MOCK_INCIDENTS,
  MOCK_USER,
  generateMockMetrics,
  generateMockSLOData,
  shouldUseMockData
} from "../services/mockData";


const USE_MOCK = shouldUseMockData();

console.log('🔧 API Mode:', USE_MOCK ? 'MOCK DATA' : 'REAL BACKEND');

// Create axios instance (same as your original api.js)
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

// Response interceptor (same as your original)
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

      return Promise.reject(error);
    }
    error.isNetworkError = true;
    return Promise.reject(error);
  }
);

// ========================================
// MOCK API IMPLEMENTATIONS
// ========================================

const mockDelay = () => new Promise(resolve => setTimeout(resolve, 300));

const mockAPI = {
  // Auth endpoints
  async get_auth_me() {
    await mockDelay();
    return { data: MOCK_USER };
  },
async post_auth_login(data) {
  await mockDelay();
  console.log('🔐 Mock login:', data.email);
  return { data: MOCK_USER };
}


  async post_auth_logout() {
    await mockDelay();
    return { data: { message: "Logged out" } };
  },

  async post_auth_signup(data) {
    await mockDelay();
    return { data: { message: "User created" } };
  },

  // Agent endpoints
  async get_agents() {
    await mockDelay();
    // Update heartbeat ages to be current
    const agents = MOCK_AGENTS.map(agent => ({
      ...agent,
      lastHeartbeat: new Date(Date.now() - (agent.heartbeatAgeSec * 1000)).toISOString(),
      updatedAt: new Date(Date.now() - (agent.heartbeatAgeSec * 1000)).toISOString()
    }));
    return { data: agents };
  },

  async post_agents(data) {
    await mockDelay();
    const newAgent = {
      _id: `mock-${Date.now()}`,
      name: data.name,
      token: `mock-token-${Math.random().toString(36).substring(2)}`,
      status: "OFFLINE",
      lastHeartbeat: null,
      heartbeatAgeSec: null,
      missedHeartbeats: 0,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    console.log('✅ Mock agent created:', newAgent.name);
    return { data: newAgent };
  },

  // Metrics endpoints
  async get_metrics(agentId, params) {
    await mockDelay();
    const range = params?.range || "5m";
    const metrics = generateMockMetrics(agentId, range);
    return { data: metrics };
  },

  // Alert endpoints
  async get_alerts(params) {
    await mockDelay();
    let alerts = [...MOCK_ALERTS];
    
    // Filter by status
    if (params?.status === 'active') {
      alerts = alerts.filter(a => !a.resolvedAt);
    } else if (params?.status === 'resolved') {
      alerts = alerts.filter(a => a.resolvedAt);
    }
    
    // Apply limit
    const limit = params?.limit || 50;
    alerts = alerts.slice(0, limit);
    
    return { 
      data: {
        count: alerts.length,
        data: alerts
      }
    };
  },

  async get_alerts_agent(agentId, params) {
    await mockDelay();
    const alerts = MOCK_ALERTS.filter(a => a.agentId === agentId);
    return { data: alerts };
  },

  async post_alerts_ack(id) {
    await mockDelay();
    const alert = MOCK_ALERTS.find(a => a._id === id);
    if (alert) {
      alert.acknowledgedAt = new Date().toISOString();
      alert.acknowledgedBy = "admin@example.com";
    }
    return { data: alert || {} };
  },

  async post_alerts_resolve(id) {
    await mockDelay();
    const alert = MOCK_ALERTS.find(a => a._id === id);
    if (alert) {
      alert.resolvedAt = new Date().toISOString();
    }
    return { data: alert || {} };
  },

  // Incident endpoints
  async get_incidents(params) {
    await mockDelay();
    let incidents = [...MOCK_INCIDENTS];
    
    if (params?.status && params.status !== 'ALL') {
      incidents = incidents.filter(i => i.status === params.status);
    }
    
    return { data: incidents };
  },

  async get_incident(id) {
    await mockDelay();
    const incident = MOCK_INCIDENTS.find(i => i._id === id);
    return { data: incident || null };
  },

  async post_incidents(data) {
    await mockDelay();
    const newIncident = {
      _id: `incident-${Date.now()}`,
      agentId: data.agentId || null,
      title: data.title,
      message: data.message || "",
      type: data.type || "CUSTOM",
      severity: data.severity,
      status: "OPEN",
      acknowledged: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { data: newIncident };
  },

  async post_incident_acknowledge(id) {
    await mockDelay();
    const incident = MOCK_INCIDENTS.find(i => i._id === id);
    if (incident) {
      incident.acknowledged = true;
      incident.acknowledgedAt = new Date().toISOString();
      incident.acknowledgedBy = "admin";
    }
    return { data: incident || {} };
  },

  async post_incident_resolve(id) {
    await mockDelay();
    const incident = MOCK_INCIDENTS.find(i => i._id === id);
    if (incident) {
      incident.status = "RESOLVED";
      incident.resolvedAt = new Date().toISOString();
      incident.resolvedBy = "admin";
    }
    return { data: incident || {} };
  },

  // SLO endpoints
  async get_slo_uptime_24h() {
    await mockDelay();
    return { data: generateMockSLOData(24, 5) };
  },

  async get_slo_uptime_7d() {
    await mockDelay();
    return { data: generateMockSLOData(24 * 7, 60) };
  },

  // Health check
  async get_health() {
    await mockDelay();
    return { 
      data: { 
        status: 'ok',
        timestamp: new Date().toISOString() 
      } 
    };
  }
};

// ========================================
// WRAPPED API (AUTO-SWITCHES BETWEEN MOCK AND REAL)
// ========================================

const wrappedAPI = {
  get: async (url, config) => {
    if (!USE_MOCK) return api.get(url, config);

    // Parse URL and params
    const [path, queryString] = url.split('?');
    const params = config?.params || (queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {});
    
    // Route to mock handlers
    if (path === '/auth/me') return mockAPI.get_auth_me();
    if (path === '/agents') return mockAPI.get_agents();
    if (path.startsWith('/metrics/')) {
      const agentId = path.split('/')[2];
      return mockAPI.get_metrics(agentId, params);
    }
    if (path === '/alerts') return mockAPI.get_alerts(params);
    if (path.match(/^\/alerts\/agent\/.+/)) {
      const agentId = path.split('/')[3];
      return mockAPI.get_alerts_agent(agentId, params);
    }
    if (path === '/incidents') return mockAPI.get_incidents(params);
    if (path.match(/^\/incidents\/.+/) && !path.includes('/acknowledge') && !path.includes('/resolve')) {
      const id = path.split('/')[2];
      return mockAPI.get_incident(id);
    }
    if (path === '/slo/uptime/24h') return mockAPI.get_slo_uptime_24h();
    if (path === '/slo/uptime/7d') return mockAPI.get_slo_uptime_7d();
    if (path === '/health') return mockAPI.get_health();
    
    console.warn('⚠️ Unhandled mock GET:', path);
    return { data: null };
  },

  post: async (url, data, config) => {
    if (!USE_MOCK) return api.post(url, data, config);

    // Route to mock handlers
    if (url === '/auth/login') return mockAPI.post_auth_login(data);
    if (url === '/auth/logout') return mockAPI.post_auth_logout();
    if (url === '/auth/signup') return mockAPI.post_auth_signup(data);
    if (url === '/agents') return mockAPI.post_agents(data);
    if (url === '/incidents') return mockAPI.post_incidents(data);
    if (url.match(/^\/alerts\/.+\/ack/)) {
      const id = url.split('/')[2];
      return mockAPI.post_alerts_ack(id);
    }
    if (url.match(/^\/alerts\/.+\/resolve/)) {
      const id = url.split('/')[2];
      return mockAPI.post_alerts_resolve(id);
    }
    if (url.match(/^\/incidents\/.+\/acknowledge/)) {
      const id = url.split('/')[2];
      return mockAPI.post_incident_acknowledge(id);
    }
    if (url.match(/^\/incidents\/.+\/resolve/)) {
      const id = url.split('/')[2];
      return mockAPI.post_incident_resolve(id);
    }
    
    console.warn('⚠️ Unhandled mock POST:', url);
    return { data: null };
  }
};

export default wrappedAPI;
export { USE_MOCK };
