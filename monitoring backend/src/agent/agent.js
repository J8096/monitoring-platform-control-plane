const os = require("os");
const axios = require("axios");

// ================= CONFIG =================
const AGENT_ID = "507f1f77bcf86cd799439011";
const BACKEND_URL =
  "https://monitoring-platform-control-plane-3.onrender.com/agents";
const INTERVAL = 5000;
// =========================================

function getCPU() {
  return Math.floor(Math.random() * 100);
}

function getMemory() {
  const used = (os.totalmem() - os.freemem()) / os.totalmem();
  return Math.floor(used * 100);
}

async function sendHeartbeat() {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/${AGENT_ID}/heartbeat`,
      {
        cpu: getCPU(),
        memory: getMemory(),
        hostname: os.hostname(),
      },
      {
        timeout: 5000,
      }
    );

    console.log("✅ Heartbeat sent", res.status);
  } catch (err) {
    if (err.response) {
      console.error(
        "❌ Backend error:",
        err.response.status,
        err.response.data
      );
    } else {
      console.error("❌ Network error:", err.message);
    }
  }
}

sendHeartbeat();
setInterval(sendHeartbeat, INTERVAL);
