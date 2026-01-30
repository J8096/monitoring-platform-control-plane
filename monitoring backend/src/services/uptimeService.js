const Agent = require("../models/Agent");

const HEARTBEAT_OK_SEC = 15;

function isUp(agent, now) {
  if (!agent.lastHeartbeat) return false;
  const ageSec = (now - agent.lastHeartbeat.getTime()) / 1000;
  return ageSec <= HEARTBEAT_OK_SEC;
}

async function getUptimeBuckets({ hours, bucketMinutes }) {
  const now = Date.now();
  const buckets = [];

  const bucketMs = bucketMinutes * 60 * 1000;
  const totalBuckets = Math.floor((hours * 60) / bucketMinutes);

  for (let i = totalBuckets - 1; i >= 0; i--) {
    const bucketTime = now - i * bucketMs;
    const agents = await Agent.find({}, "lastHeartbeat").lean();

    let up = 0;
    agents.forEach(a => {
      if (a.lastHeartbeat && isUp(a, bucketTime)) up++;
    });

    const total = agents.length || 1;

    buckets.push({
      timestamp: new Date(bucketTime),
      uptime: Math.round((up / total) * 100),
    });
  }

  return buckets;
}

module.exports = {
  getUptimeBuckets,
};
