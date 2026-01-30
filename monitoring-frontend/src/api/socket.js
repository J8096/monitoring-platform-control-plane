import { io } from "socket.io-client";

/**
 * Shared Socket.IO client (singleton)
 * - Cookie-based auth compatible
 * - Manual connect (controlled from Dashboard)
 * - WebSocket only (stable, low latency)
 */
export const socket = io("http://localhost:5000", {
  withCredentials: true,     // 🔐 send httpOnly cookies
  transports: ["websocket"], // 🚀 force WS (no polling)
  autoConnect: false,        // ❗ connect manually
});
