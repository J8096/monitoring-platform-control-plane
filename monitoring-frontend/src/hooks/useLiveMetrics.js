import { useEffect, useState } from "react";
import { socket } from "../api/socket";

/**
 * Subscribe to live metrics for a specific agent via Socket.IO.
 * Uses the shared socket instance (real or mock).
 */
export default function useLiveMetrics(agentId) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (!agentId) return;

    socket.emit("subscribe:metrics", agentId);
    socket.on("metrics:update", setMetrics);

    return () => {
      socket.emit("unsubscribe:metrics", agentId);
      socket.off("metrics:update", setMetrics);
    };
  }, [agentId]);

  return metrics;
}
