const AuditLog = require("../models/AuditLog");

module.exports.log = async function ({
  actor,
  action,
  targetType,
  targetId,
  metadata = {},
}) {
  try {
    await AuditLog.create({
      actor,
      action,
      targetType,
      targetId,
      metadata,
    });
  } catch {}
};
