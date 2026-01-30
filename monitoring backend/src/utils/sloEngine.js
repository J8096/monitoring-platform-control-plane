module.exports.calculateSLO = function ({
  totalMinutes,
  downtimeMinutes,
}) {
  const uptimePct =
    ((totalMinutes - downtimeMinutes) / totalMinutes) * 100;

  return {
    uptimePct: uptimePct.toFixed(2),
    errorBudgetRemaining: Math.max(0, 100 - uptimePct),
  };
};
