const os = require("os");
const axios = require("axios");

// ================= CONFIG =================
const AGENT_ID = "507f1f77bcf86cd799439011"; // valid ObjectId
const AGENT_NAME = "Local-Agent";
const BACKEND_URL = "http://localhost:5000/agents/heartbeat";
const INTERVAL = 5000; // 5 seconds
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
    const response = await axios.post(BACKEND_URL, {
      agentId: AGENT_ID,
      name: AGENT_NAME,
      cpu: getCPU(),
      memory: getMemory(),
    });

    console.log("✅ Heartbeat sent", response.status);
  } catch (err) {
    // 🔍 SHOW REAL ERROR (CRITICAL)
    if (err.response) {
      console.error(
        "❌ Backend error:",
        err.response.status,
        err.response.data
      );
    } else if (err.request) {
      console.error("❌ No response from backend (is server running?)");
    } else {
      console.error("❌ Axios error:", err.message);
    }
  }
}

// Send immediately, then every interval
sendHeartbeat();
setInterval(sendHeartbeat, INTERVAL);
