import api from "./api";

/**
 * Fetch alerts
 * Backend response shape:
 * {
 *   count: number,
 *   data: Alert[]
 * }
 */
export const getAlerts = async (params = {}) => {
  const res = await api.get("/alerts", { params });

  // Defensive: backend always returns { data: [] }
  if (!res?.data || !Array.isArray(res.data.data)) {
    return [];
  }

  return res.data.data;
};

/**
 * Acknowledge alert
 */
export const ackAlert = async (id) => {
  if (!id) return null;
  const res = await api.post(`/alerts/${id}/ack`);
  return res.data;
};

/**
 * Resolve alert
 */
export const resolveAlert = async (id) => {
  if (!id) return null;
  const res = await api.post(`/alerts/${id}/resolve`);
  return res.data;
};
