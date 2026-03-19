/**
 * Sentinel — End-to-End API Test Suite
 * 40 tests covering the full user + agent + alert + incident + SLO flow
 *
 * Run:  npm test
 * Needs: MongoDB running locally (or set MONGO_URI env var)
 */

process.env.NODE_ENV  = "test";
process.env.JWT_SECRET = "test-jwt-secret-sentinel-e2e";
process.env.MONGO_URI  = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sentinel-test";

const request  = require("supertest");
const mongoose = require("mongoose");
const app      = require("../src/app");

const User      = require("../src/models/User");
const Agent     = require("../src/models/Agent");
const Alert     = require("../src/models/Alert");
const Incident  = require("../src/models/Incident");
const Metric    = require("../src/models/Metric");

/* ─── shared test state ─────────────────────────────── */
const agent = request.agent(app); // persists cookies between requests

let agentId    = "";
let agentToken = "";
let alertId    = "";
let incidentId = "";
let manualIncidentId = "";

/* ─── DB lifecycle ──────────────────────────────────── */

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([
    User.deleteMany({}),
    Agent.deleteMany({}),
    Alert.deleteMany({}),
    Incident.deleteMany({}),
    Metric.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
});

/* ══════════════════════════════════════════════════════
   1. HEALTH CHECK
══════════════════════════════════════════════════════ */
describe("Health", () => {
  test("GET /api/health → 200 OK, no auth needed", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
    expect(res.body).toHaveProperty("time");
  });

  test("GET /api/unknown-route → 404", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
  });
});

/* ══════════════════════════════════════════════════════
   2. AUTH
══════════════════════════════════════════════════════ */
describe("Auth — signup", () => {
  test("POST /api/auth/signup → 400 when body empty", async () => {
    const res = await request(app).post("/api/auth/signup").send({});
    expect(res.status).toBe(400);
  });

  test("POST /api/auth/signup → 400 password missing", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "nopw@test.com" });
    expect(res.status).toBe(400);
  });

  test("POST /api/auth/signup → 201 creates user", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "admin@sentinel.test", password: "Test1234!" });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/created/i);
  });

  test("POST /api/auth/signup → 400 duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "admin@sentinel.test", password: "Test1234!" });
    expect(res.status).toBe(400);
  });
});

describe("Auth — login", () => {
  test("POST /api/auth/login → 401 wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@sentinel.test", password: "WRONG" });
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/login → 401 unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@nowhere.com", password: "Test1234!" });
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/login → 200 and sets cookie", async () => {
    // use the shared agent so cookie persists
    const res = await agent
      .post("/api/auth/login")
      .send({ email: "admin@sentinel.test", password: "Test1234!" });
    expect(res.status).toBe(200);
    // cookie must be set
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("GET /api/auth/me → 200 returns id + role", async () => {
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("role");
  });

  test("GET /api/auth/me → 401 without cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

/* ══════════════════════════════════════════════════════
   3. AGENTS
══════════════════════════════════════════════════════ */
describe("Agents — CRUD", () => {
  test("GET /api/agents → 401 without auth", async () => {
    const res = await request(app).get("/api/agents");
    expect(res.status).toBe(401);
  });

  test("GET /api/agents → 200 empty array initially", async () => {
    const res = await agent.get("/api/agents");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test("POST /api/agents → 400 missing name", async () => {
    const res = await agent.post("/api/agents").send({});
    expect(res.status).toBe(400);
  });

  test("POST /api/agents → 201 creates agent with token", async () => {
    const res = await agent
      .post("/api/agents")
      .send({ name: "prod-server-01" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body).toHaveProperty("token");
    expect(res.body.name).toBe("prod-server-01");

    agentId    = res.body._id;
    agentToken = res.body.token;
  });

  test("GET /api/agents → lists agent, token NOT exposed", async () => {
    const res = await agent.get("/api/agents");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id).toBe(agentId);
    expect(res.body[0].token).toBeUndefined();
  });
});

/* ══════════════════════════════════════════════════════
   4. HEARTBEAT + METRICS
══════════════════════════════════════════════════════ */
describe("Heartbeat", () => {
  test("POST /api/agents/:id/heartbeat → 401 no token", async () => {
    const res = await request(app)
      .post(`/api/agents/${agentId}/heartbeat`)
      .send({ cpu: 50, memory: 50 });
    expect(res.status).toBe(401);
  });

  test("POST /api/agents/:id/heartbeat → 401 wrong token", async () => {
    const res = await request(app)
      .post(`/api/agents/${agentId}/heartbeat`)
      .set("Authorization", "Bearer wrong-token")
      .send({ cpu: 50, memory: 50 });
    expect(res.status).toBe(401);
  });

  test("POST /api/agents/:id/heartbeat → 400 cpu out of range", async () => {
    const res = await request(app)
      .post(`/api/agents/${agentId}/heartbeat`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ cpu: 150, memory: 50 });
    expect(res.status).toBe(400);
  });

  test("POST /api/agents/:id/heartbeat → 200 normal payload", async () => {
    const res = await request(app)
      .post(`/api/agents/${agentId}/heartbeat`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ cpu: 40, memory: 55 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty("metricId");
  });

  test("Agent status is now HEALTHY", async () => {
    const res = await agent.get("/api/agents");
    const a = res.body.find(x => x._id === agentId);
    expect(a.status).toBe("HEALTHY");
    expect(a.cpu).toBe(40);
    expect(a.memory).toBe(55);
  });

  test("Metric saved to DB", async () => {
    const count = await Metric.countDocuments({ agent: agentId });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("HIGH CPU (95%) → creates P2 alert", async () => {
    await request(app)
      .post(`/api/agents/${agentId}/heartbeat`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ cpu: 95, memory: 55 });

    await new Promise(r => setTimeout(r, 300));

    const alert = await Alert.findOne({ agentId, type: "CPU_HIGH" });
    expect(alert).not.toBeNull();
    expect(alert.severity).toBe("P2");
    alertId = alert._id.toString();
  });

  test("HIGH CPU → creates incident", async () => {
    const incident = await Incident.findOne({ agentId });
    expect(incident).not.toBeNull();
    expect(["CPU", "CUSTOM"]).toContain(incident.type);
    incidentId = incident._id.toString();
  });

  test("RECOVERY (cpu=20) → resolves alert", async () => {
    await request(app)
      .post(`/api/agents/${agentId}/heartbeat`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({ cpu: 20, memory: 55 });

    await new Promise(r => setTimeout(r, 300));

    const alert = await Alert.findById(alertId);
    expect(alert.resolvedAt).not.toBeNull();
  });
});

describe("Metrics API", () => {
  test("GET /api/metrics/:agentId → 401 without auth", async () => {
    const res = await request(app).get(`/api/metrics/${agentId}`);
    expect(res.status).toBe(401);
  });

  test("GET /api/metrics/bad-id → 400 invalid ObjectId", async () => {
    const res = await agent.get("/api/metrics/not-a-valid-id");
    expect(res.status).toBe(400);
  });

  test("GET /api/metrics/:agentId → 200 array with cpu/memory/timestamp", async () => {
    const res = await agent.get(`/api/metrics/${agentId}?range=5m`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const pt = res.body[0];
    expect(pt).toHaveProperty("cpu");
    expect(pt).toHaveProperty("memory");
    expect(pt).toHaveProperty("timestamp");
  });
});

/* ══════════════════════════════════════════════════════
   5. ALERTS
══════════════════════════════════════════════════════ */
describe("Alerts API", () => {
  test("GET /api/alerts → 401 without auth", async () => {
    const res = await request(app).get("/api/alerts");
    expect(res.status).toBe(401);
  });

  test("GET /api/alerts → 200 with count + data array", async () => {
    const res = await agent.get("/api/alerts");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("count");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/alerts?status=resolved → only resolved alerts", async () => {
    const res = await agent.get("/api/alerts?status=resolved");
    expect(res.status).toBe(200);
    res.body.data.forEach(a => {
      expect(a.resolvedAt).not.toBeNull();
    });
  });
});

/* ══════════════════════════════════════════════════════
   6. INCIDENTS
══════════════════════════════════════════════════════ */
describe("Incidents API", () => {
  test("GET /api/incidents → 401 without auth", async () => {
    const res = await request(app).get("/api/incidents");
    expect(res.status).toBe(401);
  });

  test("GET /api/incidents → 200 array with at least one incident", async () => {
    const res = await agent.get("/api/incidents");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("GET /api/incidents/:id → 200 with full details", async () => {
    const res = await agent.get(`/api/incidents/${incidentId}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(incidentId);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("severity");
  });

  test("GET /api/incidents/:id → 404 for unknown id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await agent.get(`/api/incidents/${fakeId}`);
    expect(res.status).toBe(404);
  });

  test("POST /api/incidents → 400 missing severity", async () => {
    const res = await agent.post("/api/incidents").send({ title: "No severity" });
    expect(res.status).toBe(400);
  });

  test("POST /api/incidents → 201 creates manual incident", async () => {
    const res = await agent.post("/api/incidents").send({
      severity: "P3",
      title:    "Manual deploy rollback required",
      type:     "CUSTOM",
    });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.status).toBe("OPEN");
    manualIncidentId = res.body._id;
  });

  test("POST /api/incidents/:id/acknowledge → 200 acknowledged=true", async () => {
    const res = await agent.post(`/api/incidents/${incidentId}/acknowledge`);
    expect(res.status).toBe(200);
    expect(res.body.acknowledged).toBe(true);
  });

  test("POST /api/incidents/:id/acknowledge → idempotent on repeat", async () => {
    const res = await agent.post(`/api/incidents/${incidentId}/acknowledge`);
    expect(res.status).toBe(200);
    expect(res.body.acknowledged).toBe(true);
  });

  test("POST /api/incidents/:id/resolve → 200 status=RESOLVED", async () => {
    const res = await agent.post(`/api/incidents/${incidentId}/resolve`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RESOLVED");
    expect(res.body.resolvedAt).toBeTruthy();
  });

  test("POST /api/incidents/:id/resolve → idempotent on already resolved", async () => {
    const res = await agent.post(`/api/incidents/${incidentId}/resolve`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RESOLVED");
  });
});

/* ══════════════════════════════════════════════════════
   7. SLO
══════════════════════════════════════════════════════ */
describe("SLO API", () => {
  test("GET /api/slo/uptime/24h → 401 without auth", async () => {
    const res = await request(app).get("/api/slo/uptime/24h");
    expect(res.status).toBe(401);
  });

  test("GET /api/slo/uptime/24h → 200 array of {timestamp, uptime}", async () => {
    const res = await agent.get("/api/slo/uptime/24h");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("uptime");
      expect(res.body[0]).toHaveProperty("timestamp");
    }
  });

  test("GET /api/slo/uptime/7d → 200 array", async () => {
    const res = await agent.get("/api/slo/uptime/7d");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════
   8. AGENT DELETE
══════════════════════════════════════════════════════ */
describe("Agent — delete", () => {
  test("DELETE /api/agents/:id → 401 without auth", async () => {
    const res = await request(app).delete(`/api/agents/${agentId}`);
    expect(res.status).toBe(401);
  });

  test("DELETE /api/agents/:id → 200 deletes agent", async () => {
    const res = await agent.delete(`/api/agents/${agentId}`);
    expect(res.status).toBe(200);
  });

  test("GET /api/agents → agent no longer listed", async () => {
    const res = await agent.get("/api/agents");
    expect(res.status).toBe(200);
    const found = res.body.find(a => a._id === agentId);
    expect(found).toBeUndefined();
  });
});

/* ══════════════════════════════════════════════════════
   9. LOGOUT
══════════════════════════════════════════════════════ */
describe("Auth — logout", () => {
  test("POST /api/auth/logout → 200", async () => {
    const res = await agent.post("/api/auth/logout");
    expect(res.status).toBe(200);
  });

  test("GET /api/auth/me → 401 after logout", async () => {
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
