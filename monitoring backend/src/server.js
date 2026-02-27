require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const runOfflineCheck = require("./utils/offlineChecker");

/* ================= HTTP SERVER ================= */

const httpServer = http.createServer(app);

/* ================= SOCKET.IO ================= */
/*
  Production-safe CORS:
  - Allow localhost
  - Allow any vercel.app deployment
  - Allow specific production frontend via env
*/

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow server-to-server tools (Postman, curl)
      if (!origin) return callback(null, true);

      const isLocal = origin.startsWith("http://localhost");

      const isVercel = origin.endsWith(".vercel.app");

      const isExplicitFrontend =
        process.env.FRONTEND_URL &&
        origin === process.env.FRONTEND_URL;

      if (isLocal || isVercel || isExplicitFrontend) {
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
    await connectDB();
    console.log("✅ MongoDB connected");

    if (!global.__offlineIntervalStarted) {
      global.__offlineIntervalStarted = true;

      setInterval(async () => {
        try {
          await runOfflineCheck(io);
        } catch (err) {
          console.error("❌ Offline checker failed:", err.message);
        }
      }, 10_000);
    }

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