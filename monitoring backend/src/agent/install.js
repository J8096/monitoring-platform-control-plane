const os = require("os");
const axios = require("axios");

/* ================= CONFIG ================= */
const BACKEND_URL = "https://<your-render-backend>.onrender.com";
const AGENT_TOKEN = "PASTE_TOKEN_FROM_UI";
/* ========================================= */

async function heartbeat() {
  try {
    await axios.post(
      `${BACKEND_URL}/agents/heartbeat`,
      {
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        metadata: {
          hostname: os.hostname(),
          os: os.platform(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${AGENT_TOKEN}`,
        },
      }
    );

    console.log("✅ Heartbeat sent");
  } catch (err) {
    console.error("❌ Heartbeat failed");
  }
}

setInterval(heartbeat, 5000);
heartbeat();
