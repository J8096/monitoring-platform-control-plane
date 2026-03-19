require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app       = require("./app");
const connectDB = require("./config/db");
const runOfflineCheck = require("./utils/offlineChecker");

/* ─── HTTP Server ────────────────────────────── */
const httpServer = http.createServer(app);

/* ─── Socket.IO ──────────────────────────────── */
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isLocal    = origin.startsWith("http://localhost");
      const isVercel   = origin.endsWith(".vercel.app");
      const isExplicit = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;

      if (isLocal || isVercel || isExplicit) return callback(null, true);

      console.error("❌ Socket.IO blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 WS connected:", socket.id);

  socket.on("subscribe:metrics", (agentId) => {
    if (!agentId) return;
    socket.join(agentId.toString());
    console.log(`📡 ${socket.id} → room ${agentId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 WS disconnected:", socket.id);
  });
});

/* ─── Expose io to routes ────────────────────── */
app.set("io", io);

/* ─── Bootstrap ──────────────────────────────── */
const PORT = process.env.PORT || 5000;

let offlineCheckStarted = false; // module-level flag — no global needed

async function startServer() {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    if (!offlineCheckStarted) {
      offlineCheckStarted = true;
      setInterval(async () => {
        try {
          await runOfflineCheck(io);
        } catch (err) {
          console.error("❌ Offline checker error:", err.message);
        }
      }, 10_000);
    }

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Sentinel running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

startServer();

module.exports = { io };
