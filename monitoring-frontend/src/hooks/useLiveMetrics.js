import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
});

export default function useLiveMetrics(agentId) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (!agentId) return;

    socket.emit("subscribe:metrics", agentId);

    socket.on("metrics", setMetrics);

    return () => {
      socket.off("metrics");
    };
  }, [agentId]);

  return metrics;
}
