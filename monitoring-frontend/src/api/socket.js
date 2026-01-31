import { io } from "socket.io-client";

/**
 * Shared Socket.IO client (singleton)
 * - Cookie-based auth compatible
 * - Manual connect (controlled from Dashboard)
 * - WebSocket only (stable, low latency)
 * - Auto-reconnect safe
 */

const WS_URL =
  import.meta.env.VITE_WS_URL || "http://localhost:5000";

export const socket = io(WS_URL, {
  withCredentials: true,        // 🔐 send httpOnly cookies
  transports: ["websocket"],    // 🚀 force WebSocket
  autoConnect: false,           // ❗ connect manually
  reconnection: true,           // ♻️ recover from drops
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
