const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const agentRoutes = require("./routes/agent.routes");
const incidentRoutes = require("./routes/incident.routes");
const alertRoutes = require("./routes/alert.routes");
const metricsRoutes = require("./routes/metric.routes");

const app = express();

/* ================= CORS ================= */

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isLocal = origin.startsWith("http://localhost");
      const isVercel = origin.endsWith(".vercel.app");
      const isExplicit =
        process.env.FRONTEND_URL &&
        origin === process.env.FRONTEND_URL;

      if (isLocal || isVercel || isExplicit) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/metrics", metricsRoutes); // ✅ THIS FIXES 404

/* ================= HEALTH ================= */

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================= 404 ================= */

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;