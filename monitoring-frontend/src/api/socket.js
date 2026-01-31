// ========================================
// SOCKET SERVICE WITH MOCK SUPPORT
// Real-time metrics with fallback
// ========================================

import { io } from "socket.io-client";
import { shouldUseMockData, generateRealtimeMockMetric } from '../services/mockData';

const USE_MOCK = shouldUseMockData();
const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:5000";

// ========================================
// MOCK SOCKET IMPLEMENTATION
// ========================================

class MockSocket {
  constructor() {
    this.connected = false;
    this.handlers = {};
    this.subscriptions = new Map(); // agentId -> interval
    this.metricsCache = new Map(); // agentId -> metrics array
  }

  connect() {
    console.log('🔌 Mock WebSocket connecting...');
    setTimeout(() => {
      this.connected = true;
      console.log('✅ Mock WebSocket connected');
      this._trigger('connect');
    }, 100);
    return this;
  }

  disconnect() {
    console.log('📴 Mock WebSocket disconnecting...');
    this.connected = false;
    
    // Clear all subscriptions
    for (const interval of this.subscriptions.values()) {
      clearInterval(interval);
    }
    this.subscriptions.clear();
    this.metricsCache.clear();
    
    this._trigger('disconnect');
  }

  on(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  off(event, handler) {
    if (!this.handlers[event]) return;
    
    if (handler) {
      this.handlers[event] = this.handlers[event].filter(h => h !== handler);
    } else {
      delete this.handlers[event];
    }
  }

  emit(event, data) {
    if (event === 'subscribe:metrics') {
      this._handleSubscribe(data);
    } else if (event === 'unsubscribe:metrics') {
      this._handleUnsubscribe(data);
    }
  }

  _trigger(event, data) {
    const handlers = this.handlers[event] || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error('Mock socket handler error:', err);
      }
    });
  }

  _handleSubscribe(agentId) {
    if (!agentId || this.subscriptions.has(agentId)) return;

    console.log('📡 Mock subscribe to agent:', agentId);

    // Initialize metrics cache for this agent
    if (!this.metricsCache.has(agentId)) {
      this.metricsCache.set(agentId, []);
    }

    // Send metrics every 5 seconds
    const interval = setInterval(() => {
      const previousMetrics = this.metricsCache.get(agentId) || [];
      const newMetric = generateRealtimeMockMetric(agentId, previousMetrics);
      
      // Update cache (keep last 10 metrics for smoother transitions)
      const cache = [...previousMetrics, newMetric].slice(-10);
      this.metricsCache.set(agentId, cache);

      // Emit the metric
      this._trigger('metrics:update', {
        agentId: newMetric.agentId,
        cpu: newMetric.cpu,
        memory: newMetric.memory,
        timestamp: newMetric.timestamp
      });
    }, 5000);

    this.subscriptions.set(agentId, interval);

    // Send initial metric immediately
    const initialMetric = generateRealtimeMockMetric(agentId, []);
    this.metricsCache.set(agentId, [initialMetric]);
    setTimeout(() => {
      this._trigger('metrics:update', {
        agentId: initialMetric.agentId,
        cpu: initialMetric.cpu,
        memory: initialMetric.memory,
        timestamp: initialMetric.timestamp
      });
    }, 500);
  }

  _handleUnsubscribe(agentId) {
    if (!agentId || !this.subscriptions.has(agentId)) return;

    console.log('📴 Mock unsubscribe from agent:', agentId);

    const interval = this.subscriptions.get(agentId);
    clearInterval(interval);
    this.subscriptions.delete(agentId);
    this.metricsCache.delete(agentId);
  }
}

// ========================================
// CREATE SOCKET (MOCK OR REAL)
// ========================================

export const socket = USE_MOCK 
  ? new MockSocket()
  : io(WS_URL, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

// Log socket mode
if (USE_MOCK) {
  console.log('🔧 Using MOCK WebSocket');
} else {
  console.log('🔌 Using REAL WebSocket:', WS_URL);
  
  // Real socket event logging
  socket.on('connect', () => {
    console.log('✅ Real WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ Real WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('❌ Real WebSocket error:', error);
  });
}

export default socket;
