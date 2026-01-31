// ========================================
// MOCK DATA SERVICE
// Complete mock data matching your backend
// ========================================

export const MOCK_AGENTS = [
  {
    _id: "674a1b2c3d4e5f6g7h8i9j0k",
    name: "ax",
    status: "HEALTHY",
    token: "mock-token-ax-abc123def456",
    lastHeartbeat: new Date(Date.now() - 25000).toISOString(), // 25 seconds ago
    heartbeatAgeSec: 25,
    missedHeartbeats: 0,
    cpu: 45.2,
    memory: 62.8,
    metadata: {
      os: "Linux",
      version: "1.0.0",
      environment: "production",
      hostname: "server-ax-01"
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 25000).toISOString()
  },
  {
    _id: "674b2c3d4e5f6g7h8i9j0k1l",
    name: "vcs",
    status: "HEALTHY",
    token: "mock-token-vcs-xyz789ghi012",
    lastHeartbeat: new Date(Date.now() - 18000).toISOString(), // 18 seconds ago
    heartbeatAgeSec: 18,
    missedHeartbeats: 0,
    cpu: 32.5,
    memory: 58.3,
    metadata: {
      os: "Linux",
      version: "1.0.0",
      environment: "production",
      hostname: "server-vcs-01"
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 18000).toISOString()
  },
  {
    _id: "674c3d4e5f6g7h8i9j0k1l2m",
    name: "tgr",
    status: "HEALTHY",
    token: "mock-token-tgr-mno345pqr678",
    lastHeartbeat: new Date(Date.now() - 12000).toISOString(), // 12 seconds ago
    heartbeatAgeSec: 12,
    missedHeartbeats: 0,
    cpu: 28.7,
    memory: 51.2,
    metadata: {
      os: "Linux",
      version: "1.0.0",
      environment: "staging",
      hostname: "server-tgr-01"
    },
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 12000).toISOString()
  },
  {
    _id: "674d4e5f6g7h8i9j0k1l2m3n",
    name: "toadaa",
    status: "DEGRADED",
    token: "mock-token-toadaa-stu901vwx234",
    lastHeartbeat: new Date(Date.now() - 90000).toISOString(), // 90 seconds ago
    heartbeatAgeSec: 90,
    missedHeartbeats: 3,
    cpu: 87.3,
    memory: 78.9,
    metadata: {
      os: "Linux",
      version: "1.0.0",
      environment: "production",
      hostname: "server-toadaa-01"
    },
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 90000).toISOString()
  },
  {
    _id: "674e5f6g7h8i9j0k1l2m3n4o",
    name: "dash",
    status: "HEALTHY",
    token: "mock-token-dash-yza567bcd890",
    lastHeartbeat: new Date(Date.now() - 8000).toISOString(), // 8 seconds ago
    heartbeatAgeSec: 8,
    missedHeartbeats: 0,
    cpu: 38.1,
    memory: 55.6,
    metadata: {
      os: "Linux",
      version: "1.0.0",
      environment: "production",
      hostname: "server-dash-01"
    },
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date(Date.now() - 8000).toISOString()
  }
];

// Generate realistic time-series metrics
export function generateMockMetrics(agentId, range = "5m") {
  const metrics = [];
  const now = Date.now();
  
  const ranges = {
    "5m": { duration: 5 * 60 * 1000, interval: 5000, points: 60 },      // 5 second intervals
    "1h": { duration: 60 * 60 * 1000, interval: 60000, points: 60 },    // 1 minute intervals
    "24h": { duration: 24 * 60 * 60 * 1000, interval: 300000, points: 288 } // 5 minute intervals
  };
  
  const config = ranges[range] || ranges["5m"];
  const startTime = now - config.duration;
  
  // Base values that vary by agent
  const agentProfiles = {
    "674a1b2c3d4e5f6g7h8i9j0k": { baseCpu: 45, baseMemory: 63 },  // ax
    "674b2c3d4e5f6g7h8i9j0k1l": { baseCpu: 33, baseMemory: 58 },  // vcs
    "674c3d4e5f6g7h8i9j0k1l2m": { baseCpu: 29, baseMemory: 51 },  // tgr
    "674d4e5f6g7h8i9j0k1l2m3n": { baseCpu: 85, baseMemory: 79 },  // toadaa (degraded)
    "674e5f6g7h8i9j0k1l2m3n4o": { baseCpu: 38, baseMemory: 56 }   // dash
  };
  
  const profile = agentProfiles[agentId] || { baseCpu: 40, baseMemory: 60 };
  let currentCpu = profile.baseCpu;
  let currentMemory = profile.baseMemory;
  
  for (let i = 0; i < config.points; i++) {
    const timestamp = new Date(startTime + (i * config.interval));
    
    // Add realistic variations
    const cpuDelta = (Math.random() - 0.5) * 8;
    const memoryDelta = (Math.random() - 0.5) * 4;
    
    currentCpu = Math.max(5, Math.min(98, currentCpu + cpuDelta));
    currentMemory = Math.max(10, Math.min(95, currentMemory + memoryDelta));
    
    // Occasional spikes (5% chance)
    if (Math.random() > 0.95) {
      currentCpu = Math.min(95, currentCpu + 15);
    }
    
    metrics.push({
      cpu: Math.round(currentCpu * 10) / 10,
      memory: Math.round(currentMemory * 10) / 10,
      timestamp: timestamp.toISOString(),
      createdAt: timestamp.toISOString()
    });
  }
  
  return metrics;
}

// Real-time metric generation for websocket simulation
export function generateRealtimeMockMetric(agentId, previousMetrics = []) {
  const lastMetric = previousMetrics[previousMetrics.length - 1];
  
  const baseCpu = lastMetric ? lastMetric.cpu : 40;
  const baseMemory = lastMetric ? lastMetric.memory : 60;
  
  const cpuDelta = (Math.random() - 0.5) * 10;
  const memoryDelta = (Math.random() - 0.5) * 5;
  
  return {
    cpu: Math.max(5, Math.min(98, baseCpu + cpuDelta)),
    memory: Math.max(10, Math.min(95, baseMemory + memoryDelta)),
    timestamp: Date.now(),
    agentId
  };
}

// Mock alerts matching your backend structure
export const MOCK_ALERTS = [
  {
    _id: "alert-001",
    agentId: "674d4e5f6g7h8i9j0k1l2m3n", // toadaa
    agent: {
      _id: "674d4e5f6g7h8i9j0k1l2m3n",
      name: "toadaa",
      status: "DEGRADED"
    },
    type: "CPU_HIGH",
    severity: "P2",
    message: "CPU usage high (87%)",
    value: 87.3,
    threshold: 90,
    resolvedAt: null,
    acknowledgedAt: null,
    createdAt: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
    updatedAt: new Date(Date.now() - 180000).toISOString()
  },
  {
    _id: "alert-002",
    agentId: "674d4e5f6g7h8i9j0k1l2m3n", // toadaa
    agent: {
      _id: "674d4e5f6g7h8i9j0k1l2m3n",
      name: "toadaa",
      status: "DEGRADED"
    },
    type: "MEMORY_HIGH",
    severity: "P2",
    message: "Memory usage high (79%)",
    value: 78.9,
    threshold: 90,
    resolvedAt: null,
    acknowledgedAt: new Date(Date.now() - 120000).toISOString(),
    acknowledgedBy: "admin@example.com",
    createdAt: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
    updatedAt: new Date(Date.now() - 120000).toISOString()
  },
  {
    _id: "alert-003",
    agentId: "674b2c3d4e5f6g7h8i9j0k1l", // vcs
    agent: {
      _id: "674b2c3d4e5f6g7h8i9j0k1l",
      name: "vcs",
      status: "HEALTHY"
    },
    type: "CPU_HIGH",
    severity: "P2",
    message: "CPU usage high (92%)",
    value: 92.1,
    threshold: 90,
    resolvedAt: new Date(Date.now() - 1800000).toISOString(), // resolved 30 min ago
    acknowledgedAt: new Date(Date.now() - 3000000).toISOString(),
    acknowledgedBy: "admin@example.com",
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  }
];

// Mock incidents
export const MOCK_INCIDENTS = [
  {
    _id: "incident-001",
    agentId: "674d4e5f6g7h8i9j0k1l2m3n",
    title: "High Resource Usage - toadaa",
    message: "Agent toadaa showing high CPU and memory usage",
    type: "RESOURCE_HIGH",
    severity: "P2",
    status: "OPEN",
    acknowledged: true,
    acknowledgedAt: new Date(Date.now() - 120000).toISOString(),
    acknowledgedBy: "admin",
    resolvedAt: null,
    createdAt: new Date(Date.now() - 240000).toISOString(),
    updatedAt: new Date(Date.now() - 120000).toISOString()
  },
  {
    _id: "incident-002",
    agentId: "674b2c3d4e5f6g7h8i9j0k1l",
    title: "CPU Spike - vcs",
    message: "CPU usage exceeded 90% threshold",
    type: "CPU_HIGH",
    severity: "P2",
    status: "RESOLVED",
    acknowledged: true,
    acknowledgedAt: new Date(Date.now() - 3000000).toISOString(),
    acknowledgedBy: "admin",
    resolvedAt: new Date(Date.now() - 1800000).toISOString(),
    resolvedBy: "admin",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  }
];

// Mock SLO data
export function generateMockSLOData(hours = 24, bucketMinutes = 5) {
  const data = [];
  const now = Date.now();
  const interval = bucketMinutes * 60 * 1000;
  const points = Math.floor((hours * 60) / bucketMinutes);
  
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(now - ((points - i) * interval));
    
    // Base uptime around 99.9% with small variations
    const baseUptime = 99.9;
    const variation = (Math.random() - 0.5) * 0.2;
    
    // Occasional dips (2% chance)
    const dip = Math.random() > 0.98 ? -1.5 : 0;
    
    data.push({
      timestamp: timestamp.toISOString(),
      uptime: Math.max(95, Math.min(100, baseUptime + variation + dip)),
      createdAt: timestamp.toISOString()
    });
  }
  
  return data;
}

// Mock user
export const MOCK_USER = {
  id: "user-001",
  email: "admin@example.com",
  role: "ADMIN"
};

// Check if we should use mock data
export function shouldUseMockData() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const useMock = import.meta.env.VITE_USE_MOCK_DATA;
  
  // Use mock if explicitly enabled OR if no API URL is set
  return useMock === 'true' || !apiUrl || apiUrl === '';
}
