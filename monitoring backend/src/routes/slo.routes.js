const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getUptimeBuckets } = require("../services/uptimeService");

/**
 * GET /slo/uptime/24h
 */
router.get("/uptime/24h", auth, async (req, res) => {
  const data = await getUptimeBuckets({
    hours: 24,
    bucketMinutes: 5,
  });
  res.json(data);
});

/**
 * GET /slo/uptime/7d
 */
router.get("/uptime/7d", auth, async (req, res) => {
  const data = await getUptimeBuckets({
    hours: 24 * 7,
    bucketMinutes: 60,
  });
  res.json(data);
});

module.exports = router;
