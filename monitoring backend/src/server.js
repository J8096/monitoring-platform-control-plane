require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const runOfflineCheck = require("./utils/offlineChecker");

/* ================= HTTP SERVER ================= */

const httpServer = http.createServer(app);

/* ================= ALLOWED ORIGINS ================= */
/**
 * IMPORTANT:
 * - Must match EXACT frontend URLs
 * - No trailing slashes
 */
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://monitoring-platform-control-plane-u.vercel.app",
];



/* ================= SOCKET.IO ================= */

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow server-to-server & Postman
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      console.error("❌ Socket.IO blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

/* ================= SOCKET EVENTS ================= */

io.on("connection", (socket) => {
  console.log("🟢 WS connected:", socket.id);

  socket.on("subscribe:metrics", (agentId) => {
    if (!agentId) return;

    socket.join(agentId.toString());
    console.log(`📡 Socket ${socket.id} subscribed → ${agentId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 WS disconnected:", socket.id);
  });
});

/* ================= BOOTSTRAP ================= */

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    /* ---------- DB ---------- */
    await connectDB();
    console.log("✅ MongoDB connected");

    /* ---------- OFFLINE CHECKER (ONCE) ---------- */
    if (!global.__offlineIntervalStarted) {
      global.__offlineIntervalStarted = true;

      setInterval(async () => {
        try {
          await runOfflineCheck(io); // 👈 pass io for live updates
        } catch (err) {
          console.error("❌ Offline checker failed:", err.message);
        }
      }, 10_000);
    }

    /* ---------- HTTP + WS ---------- */
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server + WebSocket running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
}

startServer();

/* ================= EXPORT ================= */
module.exports = { io };
