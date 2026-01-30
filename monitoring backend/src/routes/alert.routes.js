const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");

const auth = require("../middleware/auth");
const allow = require("../middleware/allow");

const { tryResolveIncident } = require("../services/incidentMatcher");

/**
 * GET /alerts
 * Query:
 *  - limit (default 50, max 200)
 *  - status = active | resolved | all
 *  - agentId
 */
router.get("/", auth, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const status = req.query.status || "active";

    const filter = {};
    if (status === "active") filter.resolvedAt = null;
    if (status === "resolved") filter.resolvedAt = { $ne: null };

    const alerts = await Alert.find(filter)
      .populate({
        path: "agentId",
        select: "name status",
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    /* 🔥 UI COMPATIBILITY LAYER */
    const data = alerts.map(a => ({
      ...a,
      agent: a.agentId || null, // frontend expects alert.agent.name
    }));

    res.json({
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("❌ Failed to load alerts:", err);
    res.status(500).json({ message: "Failed to load alerts" });
  }
});


/**
 * POST /alerts/:id/ack
 * Acknowledge an alert
 */
router.post(
  "/:id/ack",
  auth,
  allow("admin", "sre"),
  async (req, res) => {
    try {
      const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        {
          acknowledgedAt: new Date(),
          acknowledgedBy: req.user.email,
        },
        { new: true }
      );

      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      res.json(alert);
    } catch (err) {
      console.error("❌ Ack failed:", err);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  }
);

/**
 * POST /alerts/:id/resolve
 * Resolve an alert
 */
router.post(
  "/:id/resolve",
  auth,
  allow("admin", "sre"),
  async (req, res) => {
    try {
      const alert = await Alert.findByIdAndUpdate(
        req.params.id,
        {
          resolvedAt: new Date(),
        },
        { new: true }
      );

      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      /* ================= INCIDENT AUTO-RESOLVE ================= */
      if (alert.incident) {
        await tryResolveIncident(alert.incident);
      }

      res.json(alert);
    } catch (err) {
      console.error("❌ Resolve failed:", err);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  }
);

router.get("/agent/:agentId", async (req, res) => {
  const { agentId } = req.params;
  const { range = "5m" } = req.query;

  const ranges = {
    "5m": 5 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
  };

  const since = new Date(Date.now() - ranges[range]);

  const alerts = await Alert.find({
    agentId,
    createdAt: { $gte: since },
  }).sort({ createdAt: 1 });

  res.json(alerts);
});



module.exports = router;
