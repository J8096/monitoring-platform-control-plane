const express = require("express");
const AuditLog = require("../models/AuditLog");
const auth = require("../middleware/auth");
const allow = require("../middleware/allow");

const router = express.Router();

router.get("/", auth, allow("admin", "sre"), async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  res.json(logs);
});

module.exports = router;
