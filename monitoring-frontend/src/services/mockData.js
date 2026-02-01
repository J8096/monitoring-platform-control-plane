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
  role: "ADMIN",
};

// ========================================
// MOCK AGENTS (15 TOTAL)
// ========================================

export const MOCK_AGENTS = [
  { _id: "agent-web-1", name: "web-server", status: "HEALTHY", cpu: 45, memory: 62 },
  { _id: "agent-api-1", name: "api-server", status: "HEALTHY", cpu: 38, memory: 55 },
  { _id: "agent-db-1", name: "database-primary", status: "DEGRADED", cpu: 78, memory: 84 },
  { _id: "agent-cache-1", name: "redis-cache", status: "HEALTHY", cpu: 22, memory: 41 },
  { _id: "agent-worker-1", name: "background-worker", status: "OFFLINE", cpu: 0, memory: 0 },

  { _id: "agent-db-2", name: "database-replica", status: "HEALTHY", cpu: 41, memory: 59 },
  { _id: "agent-cache-2", name: "redis-cache-2", status: "HEALTHY", cpu: 27, memory: 44 },
  { _id: "agent-auth-1", name: "auth-service", status: "HEALTHY", cpu: 33, memory: 48 },
  { _id: "agent-metrics-1", name: "metrics-collector", status: "HEALTHY", cpu: 29, memory: 46 },
  { _id: "agent-logs-1", name: "log-shipper", status: "HEALTHY", cpu: 21, memory: 39 },

  { _id: "agent-worker-2", name: "email-worker", status: "DEGRADED", cpu: 69, memory: 73 },
  { _id: "agent-search-1", name: "search-indexer", status: "HEALTHY", cpu: 36, memory: 52 },
  { _id: "agent-billing-1", name: "billing-service", status: "HEALTHY", cpu: 42, memory: 61 },
  { _id: "agent-kafka-1", name: "kafka-broker", status: "DEGRADED", cpu: 81, memory: 77 },
  { _id: "agent-worker-3", name: "queue-worker", status: "HEALTHY", cpu: 34, memory: 50 },
].map((a, i) => ({
  ...a,
  lastHeartbeat: new Date(Date.now() - (i + 2) * 3000).toISOString(),
  heartbeatAgeSec: i + 2,
  missedHeartbeats: a.status === "OFFLINE" ? 12 : 0,
  metadata: {
    hostname: `${a.name}-prod`,
    platform: "linux",
    arch: "x64",
  },
  createdAt: new Date(Date.now() - (i + 10) * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
}));

// ========================================
// TIME-SERIES METRICS (FIXED)
// CPU = fast & spiky
// MEMORY = slow & drifting
// ========================================

export function generateMockMetrics(agentId, range = "5m") {
  const now = Date.now();
  const metrics = [];

  const ranges = {
    "5m": { interval: 5000, points: 60 },
    "1h": { interval: 60000, points: 60 },
    "24h": { interval: 300000, points: 288 },
  };

  const { interval, points } = ranges[range] || ranges["5m"];
  const agent = MOCK_AGENTS.find(a => a._id === agentId);

  let cpu = agent?.cpu ?? 45;
  let memory = agent?.memory ?? 65;

  for (let i = points; i >= 0; i--) {
    // CPU → volatile
    cpu += (Math.random() - 0.5) * 12;
    if (Math.random() > 0.93) cpu += 15;
    cpu = Math.max(5, Math.min(98, cpu));

    // MEMORY → slow drift + sine wave
    memory += (Math.random() - 0.5) * 3 + Math.sin(i / 10) * 2;
    memory = Math.max(10, Math.min(95, memory));

    const timestamp = now - i * interval;

    metrics.push({
      agentId,
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(memory * 10) / 10,
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
    });
  }

  return metrics;
}

// ========================================
// REAL-TIME METRIC (FIXED)
// ========================================

export function generateRealtimeMockMetric(agentId, previousMetrics = []) {
  const last = previousMetrics.at(-1) || {};

  let cpu = (last.cpu ?? 45) + (Math.random() - 0.5) * 10;
  if (Math.random() > 0.96) cpu += 20;
  cpu = Math.max(5, Math.min(98, cpu));

  let memory = (last.memory ?? 65) + (Math.random() - 0.5) * 4;
  memory = Math.max(10, Math.min(95, memory));

  return {
    agentId,
    cpu: Math.round(cpu * 10) / 10,
    memory: Math.round(memory * 10) / 10,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
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
    message: "CPU usage high",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    _id: "alert-2",
    agentId: "agent-worker-1",
    type: "AGENT_OFFLINE",
    severity: "P1",
    message: "Agent offline",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
  },
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
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    _id: "incident-2",
    agentId: "agent-worker-1",
    title: "Worker Offline",
    severity: "P1",
    status: "OPEN",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
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
      createdAt: new Date(timestamp).toISOString(),
    });
  }

  return data;
}

// ========================================
// DEFAULT EXPORT
// ========================================

export default {
  MOCK_USER,
  MOCK_AGENTS,
  MOCK_ALERTS,
  MOCK_INCIDENTS,
  generateMockMetrics,
  generateRealtimeMockMetric,
  generateMockSLOData,
  shouldUseMockData,
};
