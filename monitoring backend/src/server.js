require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const runOfflineCheck = require("./utils/offlineChecker");

/* ================= HTTP SERVER ================= */

const httpServer = http.createServer(app);

/* ================= ALLOWED ORIGINS ================= */

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://monitoring-platform-control-plane-u24u-eg30q4sv6.vercel.app",
];

/* ================= SOCKET.IO ================= */

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // allow requests with no origin (Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

/**
 * Socket.IO connection lifecycle
 */
io.on("connection", (socket) => {
  console.log("🟢 WS connected:", socket.id);

  socket.on("subscribe:metrics", (agentId) => {
    if (!agentId) return;

    socket.join(agentId);
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
    // ✅ CONNECT DATABASE FIRST
    await connectDB();
    console.log("✅ MongoDB connected");

    // ✅ RUN BACKGROUND JOB ONLY ONCE
    if (!global.__offlineIntervalStarted) {
      global.__offlineIntervalStarted = true;

      setInterval(async () => {
        try {
          await runOfflineCheck();
        } catch (err) {
          console.error("❌ Offline checker failed:", err);
        }
      }, 10_000);
    }

    // ✅ START HTTP + WS SERVER
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server + WebSocket running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
}

startServer();

/* ================= EXPORT ================= */
// Allows emitting from controllers / services
module.exports = { io };
