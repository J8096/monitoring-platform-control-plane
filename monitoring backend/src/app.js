const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const healthRoutes = require("./routes/health.routes");
const agentRoutes = require("./routes/agent.routes");
const metricRoutes = require("./routes/metric.routes");
const authRoutes = require("./routes/auth.routes");
const alertRoutes = require("./routes/alert.routes");
const incidentRoutes = require("./routes/incident.routes");
const rateLimiter = require("./middleware/rateLimit");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://monitoring-platform-control-plane-u.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.options("*", cors());

app.use(express.json());
app.use(cookieParser());
app.use(rateLimiter);

app.use("/health", healthRoutes);
app.use("/agents", agentRoutes);
app.use("/metrics", metricRoutes);
app.use("/auth", authRoutes);
app.use("/alerts", alertRoutes);
app.use("/incidents", incidentRoutes);
app.use("/slo", require("./routes/slo.routes"));

module.exports = app;
