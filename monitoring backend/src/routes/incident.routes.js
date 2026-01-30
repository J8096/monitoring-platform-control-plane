const express = require("express");
const router = express.Router();

const Incident = require("../models/Incident");
const IncidentEvent = require("../models/IncidentEvent");
const auth = require("../middleware/auth");

/**
 * ===============================
 * GET /incidents
 * ?status=OPEN | RESOLVED | ALL
 * ===============================
 */
router.get("/", auth, async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status && status !== "ALL") {
      query.status = status;
    }

    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(incidents);
  } catch (err) {
    console.error("❌ Failed to load incidents:", err);
    res.status(500).json({ message: "Failed to load incidents" });
  }
});

/**
 * ===============================
 * GET /incidents/:id   ✅ FIXED
 * ===============================
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).lean();

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.json(incident);
  } catch (err) {
    console.error("❌ Failed to load incident:", err);
    res.status(500).json({ message: "Failed to load incident" });
  }
});

/**
 * ===============================
 * POST /incidents
 * Create incident (manual / frontend / mock)
 * ===============================
 */
router.post("/", auth, async (req, res) => {
  try {
    const {
      agentId = null,
      severity,
      title,
      message,
      type = "CUSTOM",
    } = req.body;

    if (!severity || !title) {
      return res.status(400).json({
        message: "severity and title are required",
      });
    }

    // Prevent duplicate OPEN incident
    const existing = await Incident.findOne({
      agentId,
      title,
      status: "OPEN",
    });

    if (existing) {
      return res.json(existing);
    }

    const incident = await Incident.create({
      agentId,
      severity,
      title,
      message,
      type,
      status: "OPEN",
    });

    // Event log
    await IncidentEvent.create({
      incidentId: incident._id,
      type: "CREATED",
      actor: req.user?.id || "system",
      message: "Incident created",
    });

    res.status(201).json(incident);
  } catch (err) {
    console.error("❌ Failed to create incident:", err);
    res.status(500).json({ message: "Failed to create incident" });
  }
});

/**
 * ===============================
 * POST /incidents/:id/acknowledge   ✅ FIXED
 * ===============================
 */
router.post("/:id/acknowledge", auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (incident.acknowledged) {
      return res.json(incident);
    }

    incident.acknowledged = true;
    incident.acknowledgedAt = new Date();
    incident.acknowledgedBy = req.user?.id || "system";
    await incident.save();

    await IncidentEvent.create({
      incidentId: incident._id,
      type: "ACKNOWLEDGED",
      actor: req.user?.id || "system",
      message: "Incident acknowledged",
    });

    res.json(incident);
  } catch (err) {
    console.error("❌ Failed to acknowledge incident:", err);
    res.status(500).json({ message: "Failed to acknowledge incident" });
  }
});

/**
 * ===============================
 * POST /incidents/:id/resolve   ✅ OK
 * ===============================
 */
router.post("/:id/resolve", auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (incident.status === "RESOLVED") {
      return res.json(incident);
    }

    incident.status = "RESOLVED";
    incident.resolvedAt = new Date();
    incident.resolvedBy = req.user?.id || "system";
    await incident.save();

    await IncidentEvent.create({
      incidentId: incident._id,
      type: "RESOLVED",
      actor: req.user?.id || "system",
      message: "Incident resolved",
    });

    res.json(incident);
  } catch (err) {
    console.error("❌ Failed to resolve incident:", err);
    res.status(500).json({ message: "Failed to resolve incident" });
  }
});

module.exports = router;
