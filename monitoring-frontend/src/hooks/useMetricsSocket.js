import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  withCredentials: true,
});

export function useMetricsSocket(agentId, onMetric) {
  useEffect(() => {
    if (!agentId) return;

    socket.emit("subscribe:metrics", agentId);
    socket.on("metric", onMetric);

    return () => socket.off("metric", onMetric);
  }, [agentId, onMetric]);
}
