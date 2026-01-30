module.exports.escalate = function (alerts) {
  if (alerts.some(a => a.severity === "P1")) return "P1";
  if (alerts.some(a => a.severity === "P2")) return "P2";
  if (alerts.some(a => a.severity === "P3")) return "P3";
  return "P4";
};
