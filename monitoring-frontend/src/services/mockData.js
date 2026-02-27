
export function shouldUseMockData() {
  const flag = import.meta.env.VITE_USE_MOCK_DATA;
  if (flag !== undefined) return flag === "true";
  return import.meta.env.MODE === "development";
}

/* ========================================
   MOCK USER
======================================== */

export const MOCK_USER = {
  id: "mock-admin-1",
  email: "admin@test.com",
  role: "ADMIN",
};

/* ========================================
   UTILITIES
======================================== */

const now = () => Date.now();

const random = (min, max) =>
  Math.round(min + Math.random() * (max - min));

const pick = (arr, i) => arr[i % arr.length];

/* ========================================
   MOCK AGENTS (20)
======================================== */

const STATUS_POOL = [
  "HEALTHY",
  "HEALTHY",
  "HEALTHY",
  "DEGRADED",
  "HEALTHY",
  "DEGRADED",
  "OFFLINE",
];

export const MOCK_AGENTS = Array.from({ length: 20 }, (_, i) => {
  const id = i + 1;
  const status = pick(STATUS_POOL, i);
  const ts = now() - (i + 1) * 4000;

  const cpu =
    status === "OFFLINE"
      ? 0
      : status === "DEGRADED"
      ? random(70, 90)
      : random(20, 55);

  const memory =
    status === "OFFLINE"
      ? 0
      : status === "DEGRADED"
      ? random(70, 85)
      : random(40, 70);

  return {
    _id: `agent-${id}`,
    name: `service-${id}`,
    status,
    cpu,
    memory,
    lastHeartbeatTs: ts,
    lastHeartbeat: new Date(ts).toISOString(),
    missedHeartbeats:
      status === "OFFLINE"
        ? Math.floor((now() - ts) / 3000)
        : 0,
    metadata: {
      hostname: `service-${id}-prod`,
      platform: "linux",
      arch: "x64",
    },
    createdAt: new Date(now() - id * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

/* ========================================
   METRICS (HISTORICAL)
======================================== */

export function generateMockMetrics(agentId, range = "5m") {
  const agent = MOCK_AGENTS.find((a) => a._id === agentId);
  if (!agent) return [];

  const config = {
    "1m":  { interval: 1000,   points: 60 },
    "5m":  { interval: 5000,   points: 60 },
    "1h":  { interval: 60000,  points: 60 },
    "24h": { interval: 300000, points: 288 },
  };

  const { interval, points } = config[range] || config["5m"];

  const alignedNow = Math.floor(now() / interval) * interval;
  const startTime = alignedNow - interval * (points - 1);

  let cpu = agent.cpu || 45;
  let memory = agent.memory || 60;

  return Array.from({ length: points }, (_, i) => {
    const ts = startTime + i * interval;

    if (agent.status !== "OFFLINE") {
      cpu += (Math.random() - 0.5) * 5;
      memory += (Math.random() - 0.5) * 3;
    } else {
      cpu = 0;
      memory = 0;
    }

    cpu = Math.max(5, Math.min(95, cpu));
    memory = Math.max(10, Math.min(90, memory));

    return {
      agentId,
      cpu: Math.round(cpu),
      memory: Math.round(memory),
      timestamp: ts,
      createdAt: new Date(ts).toISOString(),
    };
  });
}

/* ========================================
   REAL-TIME METRIC
======================================== */

export function generateRealtimeMockMetric(
  agentId,
  previousMetrics = [],
  range = "5m"
) {
  const intervalMap = {
    "1m":  1000,
    "5m":  5000,
    "1h":  60000,
    "24h": 300000,
  };

  const interval = intervalMap[range] ?? 5000;
  const last = previousMetrics.at(-1);

  const timestamp = last
    ? last.timestamp + interval
    : Math.floor(now() / interval) * interval;

  let cpu = last?.cpu ?? 45;
  let memory = last?.memory ?? 60;

  cpu += (Math.random() - 0.5) * 4;
  memory += (Math.random() - 0.5) * 2;

  cpu = Math.max(5, Math.min(95, cpu));
  memory = Math.max(10, Math.min(90, memory));

  return {
    agentId,
    cpu: Math.round(cpu),
    memory: Math.round(memory),
    timestamp,
    createdAt: new Date(timestamp).toISOString(),
  };
}

/* ========================================
   MOCK ALERTS (20) — MUTABLE STORE
======================================== */

const ALERT_TYPES = ["CPU_HIGH", "MEMORY_HIGH", "AGENT_OFFLINE"];
const SEVERITIES = ["P1", "P2", "P3"];

function createInitialAlerts() {
  return Array.from({ length: 20 }, (_, i) => {
    const ts = now() - i * 4 * 60000;
    const type = pick(ALERT_TYPES, i);

    return {
      _id: `alert-${i + 1}`,
      agentId: MOCK_AGENTS[i % MOCK_AGENTS.length]._id,
      type,
      severity: pick(SEVERITIES, i),
      message:
        type === "CPU_HIGH"
          ? "CPU usage high"
          : type === "MEMORY_HIGH"
          ? "Memory usage high"
          : "Agent offline",
      createdAt: new Date(ts).toISOString(),
      acknowledgedAt: null,
      resolvedAt: null,
    };
  });
}

let ALERT_STORE = createInitialAlerts();

export function getMockAlerts() {
  return ALERT_STORE;
}

export function acknowledgeMockAlert(id) {
  ALERT_STORE = ALERT_STORE.map((alert) =>
    alert._id === id && !alert.resolvedAt
      ? { ...alert, acknowledgedAt: new Date().toISOString() }
      : alert
  );
}

export function resolveMockAlert(id) {
  ALERT_STORE = ALERT_STORE.map((alert) =>
    alert._id === id
      ? {
          ...alert,
          acknowledgedAt: alert.acknowledgedAt ?? new Date().toISOString(),
          resolvedAt: new Date().toISOString(),
        }
      : alert
  );
}

/* ========================================
   MOCK INCIDENTS (20) — MUTABLE STORE
======================================== */

const INCIDENT_STATUSES = ["OPEN", "INVESTIGATING", "RESOLVED"];

function createInitialIncidents() {
  return Array.from({ length: 20 }, (_, i) => {
    const ts = now() - i * 10 * 60000;

    return {
      _id: `incident-${i + 1}`,
      agentId: MOCK_AGENTS[i % MOCK_AGENTS.length]._id,
      title: `Service Incident ${i + 1}`,
      severity: pick(SEVERITIES, i),
      status: pick(INCIDENT_STATUSES, i),
      createdAt: new Date(ts).toISOString(),
      updatedAt: new Date(ts + 120000).toISOString(),
    };
  });
}

let INCIDENT_STORE = createInitialIncidents();

export function getMockIncidents() {
  return INCIDENT_STORE;
}

export function resolveMockIncident(id) {
  INCIDENT_STORE = INCIDENT_STORE.map((incident) =>
    incident._id === id
      ? {
          ...incident,
          status: "RESOLVED",
          updatedAt: new Date().toISOString(),
        }
      : incident
  );
}

export function acknowledgeMockIncident(id) {
  INCIDENT_STORE = INCIDENT_STORE.map((incident) =>
    incident._id === id && incident.status === "OPEN"
      ? {
          ...incident,
          status: "INVESTIGATING",
          updatedAt: new Date().toISOString(),
        }
      : incident
  );
}

/* ========================================
   MOCK SLO
======================================== */

export function generateMockSLOData(hoursBack = 24, intervalMinutes = 5) {
  const points = Math.floor((hoursBack * 60) / intervalMinutes);
  const startTime = now() - (points - 1) * intervalMinutes * 60_000;

  return Array.from({ length: points }, (_, i) => {
    const ts = startTime + i * intervalMinutes * 60_000;

    let uptime = 99.8 + Math.random() * 0.2;
    if (Math.random() < 0.02) uptime = 95 + Math.random() * 3;

    return {
      timestamp: ts,
      uptime: Number(uptime.toFixed(2)),
      createdAt: new Date(ts).toISOString(),
    };
  });
}

/* ========================================
   DEFAULT EXPORT
======================================== */

export default {
  shouldUseMockData,
  MOCK_USER,
  MOCK_AGENTS,
  generateMockMetrics,
  generateRealtimeMockMetric,
  getMockAlerts,
  acknowledgeMockAlert,
  resolveMockAlert,
  getMockIncidents,
  resolveMockIncident,
  acknowledgeMockIncident,
  generateMockSLOData,
};
