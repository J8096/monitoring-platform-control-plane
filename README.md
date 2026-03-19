# Sentinel — Infrastructure Monitoring Platform

Real-time infrastructure monitoring. Lightweight agents report CPU and memory to a central control plane. The platform detects incidents, tracks SLOs, fires alerts, and streams live data via WebSockets.

**Stack:** Node.js · Express · MongoDB · Socket.IO · React 19 · Vite · Tailwind CSS v4

---

## Architecture

```
┌──────────────────────────────────────────────┐
│         Frontend (React + Vite)              │
│  Vercel → auto-deploy on push to main        │
└─────────────────┬────────────────────────────┘
                  │ HTTPS + WebSocket
┌─────────────────▼────────────────────────────┐
│         Backend (Node.js + Express)          │
│  Render → auto-deploy on push to main        │
│  REST API · Socket.IO · Background jobs      │
└─────────────────┬────────────────────────────┘
                  │ Mongoose
┌─────────────────▼────────────────────────────┐
│              MongoDB Atlas                    │
│  Agents · Metrics (TTL 24h) · Alerts (TTL 7d)│
│  Incidents · Users · AuditLogs · SLOs        │
└──────────────────────────────────────────────┘
                  ↑ heartbeat every 5s
       ┌──────────┴──────────┐
       │   Sentinel Agent    │
       │  (any Linux/Mac)    │
       └─────────────────────┘
```

---

## Repository Structure

```
sentinel/
├── .github/workflows/ci.yml   ← CI: test backend + build frontend on every push
├── .gitignore
├── README.md
│
├── backend/
│   ├── render.yaml            ← Render deploy config
│   ├── .env.example           ← Copy to .env, fill in secrets
│   ├── package.json           ← includes: start, dev, seed, test
│   ├── tests/
│   │   └── e2e.test.js        ← 40 end-to-end API tests
│   └── src/
│       ├── server.js          ← HTTP + Socket.IO server entry
│       ├── app.js             ← Express app, routes, error handler
│       ├── agent/agent.js     ← Standalone agent script
│       ├── config/db.js       ← MongoDB connection
│       ├── middleware/        ← auth, RBAC, rate-limiting
│       ├── models/            ← Mongoose schemas
│       ├── routes/            ← Express route handlers
│       ├── scripts/           ← seedAdmin.js
│       ├── services/          ← Business logic
│       ├── socket/            ← Socket.IO auth middleware
│       └── utils/             ← Engines, checkers, helpers
│
└── frontend/
    ├── vercel.json            ← Vercel SPA routing
    ├── .env.example           ← Copy to .env.local, fill in URLs
    ├── package.json
    └── src/
        ├── App.jsx            ← Router
        ├── api/               ← Axios instance + mock layer
        ├── components/        ← Reusable UI
        ├── hooks/             ← usePageVisibility, useLiveMetrics, etc.
        ├── pages/             ← Dashboard, Agents, Incidents, SLO, ...
        ├── services/          ← Mock data (dev/demo mode)
        └── utils/             ← timeAgo, etc.
```

---

## Quick Start (Local)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGO_URI and JWT_SECRET

npm install
npm run seed      # creates admin user
npm run dev       # starts on :5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local: set VITE_USE_MOCK_DATA=false + VITE_API_URL

npm install
npm run dev       # starts on :5173
```

### 3. Run an Agent

```bash
cd backend/src/agent
AGENT_ID=<id_from_dashboard> \
AGENT_TOKEN=<token_from_dashboard> \
BACKEND_URL=http://localhost:5000/api \
node agent.js
```

### 4. Run E2E Tests

```bash
cd backend
npm test
# Requires MongoDB running locally
```

---

## Deploy to Production

### Backend → Render (Free tier)

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Set **Root Directory** = `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | your MongoDB Atlas connection string |
| `JWT_SECRET` | a long random secret (run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `FRONTEND_URL` | your Vercel frontend URL (e.g. `https://sentinel.vercel.app`) |

7. Deploy → Render auto-deploys on every push to `main`

**After first deploy, seed the admin user:**

```bash
# Run once in Render Shell (or locally with production MONGO_URI)
cd backend
MONGO_URI=<your-atlas-uri> node src/scripts/seedAdmin.js
```

Default admin: `admin@sentinel.local` / `ChangeMe123!`

---

### Frontend → Vercel (Free tier)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** = `frontend`
4. Framework preset: **Vite**
5. Add environment variables:

| Key | Value |
|-----|-------|
| `VITE_USE_MOCK_DATA` | `false` |
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |
| `VITE_WS_URL` | `https://your-backend.onrender.com` |

6. Deploy → Vercel auto-deploys on every push to `main`

---

### Auto-Deploy on Git Push

Once both are connected to your GitHub repo:

```bash
git add .
git commit -m "feat: initial deploy"
git push origin main
```

GitHub Actions runs:
1. ✅ E2E tests (40 tests against real MongoDB)
2. ✅ Frontend build check
3. ✅ Triggers Render deploy hook (if `RENDER_DEPLOY_HOOK` secret set)
4. Vercel deploys automatically via GitHub integration

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/signup` | — | Register |
| POST | `/api/auth/login` | — | Login, sets httpOnly cookie |
| GET | `/api/auth/me` | User JWT | Current user |
| POST | `/api/auth/logout` | — | Clears cookie |
| GET | `/api/agents` | User JWT | List agents |
| POST | `/api/agents` | User JWT | Create agent (returns token once) |
| DELETE | `/api/agents/:id` | User JWT | Delete agent |
| POST | `/api/agents/:id/heartbeat` | Bearer token | Report metrics |
| GET | `/api/metrics/:agentId?range=5m` | User JWT | Time-series metrics |
| GET | `/api/alerts?status=active` | User JWT | List alerts |
| POST | `/api/alerts/:id/resolve` | User JWT | Resolve alert |
| GET | `/api/incidents` | User JWT | List incidents |
| POST | `/api/incidents` | User JWT | Create manual incident |
| GET | `/api/incidents/:id` | User JWT | Incident details |
| POST | `/api/incidents/:id/acknowledge` | User JWT | Acknowledge |
| POST | `/api/incidents/:id/resolve` | User JWT | Resolve |
| GET | `/api/slo/uptime/24h` | User JWT | 24h uptime buckets |
| GET | `/api/slo/uptime/7d` | User JWT | 7d uptime buckets |
| GET | `/api/audit` | admin/sre | Audit log |

### WebSocket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `subscribe:metrics` | `agentId` |
| Server → Client | `metrics:update` | `{ agentId, cpu, memory, timestamp }` |
| Server → Client | `agent:status` | `{ agentId, status, healthScore, reasons }` |

---

## Key Design Decisions

- **httpOnly cookie JWT** — tokens never touch JavaScript, blocks XSS theft
- **TTL indexes** — metrics auto-delete after 24h, alerts after 7d
- **Agent Bearer token** — separate from user JWT, issued once at agent creation
- **RBAC middleware** — `allow("admin", "sre")` composable per route
- **Socket.IO rooms** — each agent gets its own room, clients only receive subscribed data
- **`usePageVisibility`** — polling pauses when tab hidden, reduces server load
- **Mock data layer** — `VITE_USE_MOCK_DATA=true` runs entirely client-side, no backend needed for demos

---

## License

MIT
