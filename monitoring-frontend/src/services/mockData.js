// ========================================
// MOCK DATA SERVICE
// ========================================
// Complete mock data generator for demo/testing
// without requiring backend connection

// ========================================
// CONFIGURATION
// ========================================

export function shouldUseMockData() {
  const envSetting = import.meta.env.VITE_USE_MOCK_DATA;

  if (envSetting === "true" || envSetting === true) return true;
  if (envSetting === "false" || envSetting === false) return false;

  const apiUrl = import.meta.env.VITE_API_URL;
  return !apiUrl || apiUrl.includes("localhost");
}

// ========================================
// MOCK USER
// ========================================

export const MOCK_USER = {
  id: "mock-admin-1",
  email: "admin@test.com",
  role: "ADMIN"
};

// ========================================
// MOCK AGENTS
// ========================================

export const MOCK_AGENTS = [
  {
    _id: "agent-web-1",
    name: "web-server",
    status: "HEALTHY",
    cpu: 45,
    memory: 62,
    lastHeartbeat: new Date(Date.now() - 5000).toISOString(),
    heartbeatAgeSec: 5,
    missedHeartbeats: 0,
    metadata: { hostname: "web-prod-01", platform: "linux", arch: "x64" },
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5000).toISOString()
  },
  {
    _id: "agent-api-1",
    name: "api-server",
    status: "HEALTHY",
    cpu: 38,
    memory: 55,
    lastHeartbeat: new Date(Date.now() - 3000).toISOString(),
    heartbeatAgeSec: 3,
    missedHeartbeats: 0,
    metadata: { hostname: "api-prod-01", platform: "linux", arch: "x64" },
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3000).toISOString()
  },
  {
    _id: "agent-db-1",
    name: "database-primary",
    status: "DEGRADED",
    cpu: 78,
    memory: 84,
    lastHeartbeat: new Date(Date.now() - 8000).toISOString(),
    heartbeatAgeSec: 8,
    missedHeartbeats: 1,
    metadata: { hostname: "db-prod-01", platform: "linux", arch: "x64" },
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 8000).toISOString()
  },
  {
    _id: "agent-cache-1",
    name: "redis-cache",
    status: "HEALTHY",
    cpu: 22,
    memory: 41,
    lastHeartbeat: new Date(Date.now() - 2000).toISOString(),
    heartbeatAgeSec: 2,
    missedHeartbeats: 0,
    metadata: { hostname: "cache-prod-01", platform: "linux", arch: "x64" },
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2000).toISOString()
  },
  {
    _id: "agent-worker-1",
    name: "background-worker",
    status: "OFFLINE",
    cpu: 0,
    memory: 0,
    lastHeartbeat: new Date(Date.now() - 180000).toISOString(),
    heartbeatAgeSec: 180,
    missedHeartbeats: 12,
    metadata: { hostname: "worker-prod-01", platform: "linux", arch: "x64" },
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 180000).toISOString()
  }
];

// ========================================
// TIME-SERIES METRICS
// ========================================

export function generateMockMetrics(agentId, range = "5m") {
  const now = Date.now();
  const metrics = [];

  const ranges = {
    "5m": { interval: 5000, points: 60 },
    "1h": { interval: 60000, points: 60 },
    "24h": { interval: 300000, points: 288 }
  };

  const { interval, points } = ranges[range] || ranges["5m"];

  const agent = MOCK_AGENTS.find(a => a._id === agentId);
  let cpu = agent?.cpu ?? 50;
  let memory = agent?.memory ?? 60;

  for (let i = points; i >= 0; i--) {
    cpu = Math.max(5, Math.min(98, cpu + (Math.random() - 0.5) * 8));
    memory = Math.max(10, Math.min(95, memory + (Math.random() - 0.5) * 6));

    const timestamp = now - i * interval;

    metrics.push({
      agentId,
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(memory * 10) / 10,
      timestamp,
      createdAt: new Date(timestamp).toISOString()
    });
  }

  return metrics;
}

// ========================================
// REAL-TIME METRIC (WebSocket Simulation)
// ========================================

export function generateRealtimeMockMetric(agentId, previousMetrics = []) {
  const agent = MOCK_AGENTS.find(a => a._id === agentId);
  const last = previousMetrics[previousMetrics.length - 1];

  const baseCpu = last?.cpu ?? agent?.cpu ?? 40;
  const baseMemory = last?.memory ?? agent?.memory ?? 60;

  return {
    agentId,
    cpu: Math.max(5, Math.min(98, Math.round((baseCpu + (Math.random() - 0.5) * 10) * 10) / 10)),
    memory: Math.max(10, Math.min(95, Math.round((baseMemory + (Math.random() - 0.5) * 6) * 10) / 10)),
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
}

// ========================================
// MOCK ALERTS
// ========================================

export const MOCK_ALERTS = [
  {
    _id: "alert-1",
    agentId: "agent-db-1",
    type: "CPU_HIGH",
    severity: "P2",
    message: "CPU usage high (78%)",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString()
  },
  {
    _id: "alert-2",
    agentId: "agent-worker-1",
    type: "AGENT_OFFLINE",
    severity: "P1",
    message: "Agent offline",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 3 * 60000).toISOString()
  }
];

// ========================================
// MOCK INCIDENTS
// ========================================

export const MOCK_INCIDENTS = [
  {
    _id: "incident-1",
    agentId: "agent-db-1",
    title: "Database Degradation",
    severity: "P2",
    status: "INVESTIGATING",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString()
  }
];

// ========================================
// MOCK SLO
// ========================================

export function generateMockSLOData(hoursBack = 24, intervalMinutes = 5) {
  const now = Date.now();
  const data = [];
  const points = Math.floor((hoursBack * 60) / intervalMinutes);

  for (let i = points; i >= 0; i--) {
    const timestamp = now - i * intervalMinutes * 60000;
    let uptime = 99.8 + Math.random() * 0.2;

    if (Math.random() < 0.02) uptime = 95 + Math.random() * 3;

    data.push({
      timestamp,
      uptime: Math.round(uptime * 100) / 100,
      createdAt: new Date(timestamp).toISOString()
    });
  }

  return data;
}

// ========================================
// DEFAULT EXPORT (optional)
// ========================================

export default {
  MOCK_USER,
  MOCK_AGENTS,
  MOCK_ALERTS,
  MOCK_INCIDENTS,
  generateMockMetrics,
  generateRealtimeMockMetric,
  generateMockSLOData,
  shouldUseMockData
};
