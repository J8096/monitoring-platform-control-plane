// ========================================
// SOCKET SERVICE WITH MOCK SUPPORT
// Real-time metrics with fallback
// ========================================

import { io } from "socket.io-client";
import { shouldUseMockData, generateRealtimeMockMetric } from "../services/mockData";

const USE_MOCK = shouldUseMockData();

/**
 * ✅ Correct WebSocket URL resolution
 * Priority:
 * 1. VITE_WS_URL (explicit)
 * 2. VITE_API_URL (backend base)
 * 3. window.location.origin (same host)
 */
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  import.meta.env.VITE_API_URL ||
  window.location.origin;

// ========================================
// MOCK SOCKET IMPLEMENTATION
// ========================================

class MockSocket {
  constructor() {
    this.connected = false;
    this.handlers = {};
    this.subscriptions = new Map();
    this.metricsCache = new Map();
  }

  connect() {
    console.log("🔌 Mock WebSocket connecting...");
    setTimeout(() => {
      this.connected = true;
      console.log("✅ Mock WebSocket connected");
      this._trigger("connect");
    }, 100);
    return this;
  }

  disconnect() {
    console.log("📴 Mock WebSocket disconnecting...");
    this.connected = false;

    for (const interval of this.subscriptions.values()) {
      clearInterval(interval);
    }
    this.subscriptions.clear();
    this.metricsCache.clear();

    this._trigger("disconnect");
  }

  on(event, handler) {
    if (!this.handlers[event]) this.handlers[event] = [];
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
    if (event === "subscribe:metrics") this._handleSubscribe(data);
    if (event === "unsubscribe:metrics") this._handleUnsubscribe(data);
  }

  _trigger(event, data) {
    (this.handlers[event] || []).forEach(h => h(data));
  }

  _handleSubscribe(agentId) {
    if (!agentId || this.subscriptions.has(agentId)) return;

    if (!this.metricsCache.has(agentId)) {
      this.metricsCache.set(agentId, []);
    }

    const interval = setInterval(() => {
      const prev = this.metricsCache.get(agentId) || [];
      const metric = generateRealtimeMockMetric(agentId, prev);
      this.metricsCache.set(agentId, [...prev, metric].slice(-10));

      this._trigger("metrics:update", metric);
    }, 5000);

    this.subscriptions.set(agentId, interval);
  }

  _handleUnsubscribe(agentId) {
    const interval = this.subscriptions.get(agentId);
    if (!interval) return;
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
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });

// ========================================
// LOGGING
// ========================================

console.log(
  USE_MOCK
    ? "🔧 Using MOCK WebSocket"
    : `🔌 Using REAL WebSocket → ${WS_URL}`
);

export default socket;
