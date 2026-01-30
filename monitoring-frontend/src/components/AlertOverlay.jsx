export function buildAlertLines(alerts = [], metricKey) {
  return alerts
    .filter(a => a.type?.toLowerCase() === metricKey)
    .map(a => ({
      xAxis: a.createdAt,
      label: {
        formatter: a.severity,
        color: "#ef4444",
      },
      lineStyle: {
        color: "#ef4444",
        width: 1,
        type: "dashed",
      },
    }));
}
