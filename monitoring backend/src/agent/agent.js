/**
 * Sentinel Agent
 * Run this on any machine you want to monitor.
 *
 * Usage:
 *   AGENT_ID=<id> AGENT_TOKEN=<token> BACKEND_URL=https://your-api.com node agent.js
 *
 * Or create a .env file next to this file with:
 *   AGENT_ID=...
 *   AGENT_TOKEN=...
 *   BACKEND_URL=https://your-api.com/api
 */

require("dotenv").config();

const os    = require("os");
const axios = require("axios");

const AGENT_ID    = process.env.AGENT_ID;
const AGENT_TOKEN = process.env.AGENT_TOKEN;
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:5000/api").replace(/\/$/, "");
const INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS) || 5000;

if (!AGENT_ID || !AGENT_TOKEN) {
  console.error("❌ AGENT_ID and AGENT_TOKEN must be set as environment variables.");
  console.error("   Create the agent via the dashboard, then copy the credentials.");
  process.exit(1);
}

function getCPU() {
  const cpus = os.cpus();
  const total = cpus.reduce((acc, cpu) => {
    const t = Object.values(cpu.times).reduce((s, v) => s + v, 0);
    return acc + t;
  }, 0);
  const idle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  return Math.round(((total - idle) / total) * 100);
}

function getMemory() {
  const used = os.totalmem() - os.freemem();
  return Math.round((used / os.totalmem()) * 100);
}

async function sendHeartbeat() {
  try {
    const res = await axios.post(
      `${BACKEND_URL}/agents/${AGENT_ID}/heartbeat`,
      {
        cpu: getCPU(),
        memory: getMemory(),
        metadata: {
          hostname: os.hostname(),
          os: `${os.type()} ${os.release()}`,
        },
      },
      {
        headers: { Authorization: `Bearer ${AGENT_TOKEN}` },
        timeout: 5000,
      }
    );
    console.log(`✅ [${new Date().toISOString()}] Heartbeat sent — ${res.status}`);
  } catch (err) {
    const msg = err.response
      ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
      : err.message;
    console.error(`❌ [${new Date().toISOString()}] Heartbeat failed — ${msg}`);
  }
}

console.log(`🚀 Sentinel agent starting (ID: ${AGENT_ID})`);
console.log(`   Backend : ${BACKEND_URL}`);
console.log(`   Interval: ${INTERVAL_MS}ms`);

sendHeartbeat();
setInterval(sendHeartbeat, INTERVAL_MS);
