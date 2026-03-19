const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes     = require("./routes/auth.routes");
const agentRoutes    = require("./routes/agent.routes");
const incidentRoutes = require("./routes/incident.routes");
const alertRoutes    = require("./routes/alert.routes");
const metricsRoutes  = require("./routes/metric.routes");
const sloRoutes      = require("./routes/slo.routes");
const auditRoutes    = require("./routes/audit.route");
const healthRoutes   = require("./routes/health.routes");
const rateLimiter    = require("./middleware/rateLimit");

const app = express();

/* ─── CORS ──────────────────────────────────── */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // curl / Postman / server-to-server

      const isLocal    = origin.startsWith("http://localhost");
      const isVercel   = origin.endsWith(".vercel.app");
      const isExplicit = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;

      if (isLocal || isVercel || isExplicit) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ─── MIDDLEWARE ─────────────────────────────── */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimiter);

/* ─── ROUTES ─────────────────────────────────── */
app.use("/api/auth",      authRoutes);
app.use("/api/agents",    agentRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/alerts",    alertRoutes);
app.use("/api/metrics",   metricsRoutes);
app.use("/api/slo",       sloRoutes);
app.use("/api/audit",     auditRoutes);
app.use("/api/health",    healthRoutes);

/* ─── 404 ───────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

/* ─── GLOBAL ERROR HANDLER ──────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
});

module.exports = app;
