# ⚡ FixFlow AI — Intelligent Incident Triage, Vector Duplicate Detection & SOP Copilot

> **FixFlow AI** is an AI-powered facility incident triage, duplicate detection, and technician resolution copilot. It turns natural language complaints into categorized work orders, prevents duplicate ticket clutter using 128-dimensional dense semantic vector similarity, and delivers actionable RAG standard operating procedure (SOP) playbooks directly to field technicians.

---

## 🏛️ System Architecture

```
                                  ┌─────────────────────────────────────────┐
                                  │     React 19 + Vite + Tailwind CSS UI   │
                                  │   Role Switcher: Student | Admin | Tech │
                                  └────────────────────┬────────────────────┘
                                                       │ REST / JSON (HTTP)
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │         FastAPI Backend (Port 8000)     │
                                  │   CORS, Pydantic v2, Static SPA Serving │
                                  └──────┬─────────────┬─────────────┬──────┘
                                         │             │             │
                   ┌─────────────────────┴──┐          │          ┌──┴──────────────────────┐
                   ▼                        ▼          ▼          ▼                         ▼
          ┌──────────────────┐    ┌──────────────┐ ┌────────┐ ┌────────────────┐ ┌────────────────┐
          │  Domain Triage   │    │ Dense Vector │ │ Ticket │ │ RAG SOP Engine │ │ SQLite Database│
          │  Category & Loc  │    │ Cosine Sim   │ │ CRUD & │ │ Playbook Guide │ │ Tickets, SOPs, │
          │  Priority & SLA  │    │ Duplicates   │ │ Status │ │ & Action Steps │ │ Embeddings     │
          └──────────────────┘    └──────────────┘ └────────┘ └────────────────┘ └────────────────┘
```

---

## ✨ Key Features

1. **Student / Reporter Persona**:
   - Natural language complaint submission with live AI triage preview.
   - Real-time categorization (**HVAC**, **Electrical**, **Plumbing**, **IT**, **Infrastructure**).
   - Accurate location extraction (e.g. *Lab 3*, *Room 102*, *Server Room*).
   - Instant Duplicate Incident modal with similarity percentage and matched ticket reference.

2. **Admin Operations Persona**:
   - Live KPI dashboard: Active Backlog, Critical Incidents, Duplicate Suppression Rate, Average SLA.
   - Incident distribution breakdown by facility domain.
   - Search & multi-filter table (Category, Priority, Status).
   - One-click ticket status transitions.

3. **Technician Field Terminal & Copilot**:
   - Prioritized work order dispatch queue.
   - **RAG SOP Copilot Checklist**: Dynamic step-by-step diagnostic and resolution protocol.
   - Status controls (`Start Work`, `Mark Resolved`, `Reopen`).
   - Field remarks and diagnostic note logger.

---

## 🚀 Deployment Options

### Option 1: 🐳 Docker & Docker Compose (Recommended for Containers)

Run the full-stack container (frontend + backend + database) on port 8000 with a single command:

```bash
docker compose up --build
```
Access the application at **http://localhost:8000**.

To run with standalone Docker:
```bash
docker build -t fixflow-ai .
docker run -p 8000:8000 fixflow-ai
```

---

### Option 2: ⚡ Single-Server Monolith (`python run.py`)

Run both the built React UI and FastAPI backend together on a single port:

```bash
# 1. Install backend requirements
pip install -r backend/requirements.txt

# 2. Build frontend assets (or run.py will do it automatically)
cd frontend && npm install && npm run build && cd ..

# 3. Start unified server
python run.py
```
Open **http://localhost:8000** in your browser.

---

### Option 3: ☁️ Cloud PaaS Deployment (Render / Railway / Fly.io)

#### Deploying on Render (Free Web Service)
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** ➔ **Blueprint** (or **Web Service**).
3. Connect your repository. Render will automatically detect [`render.yaml`](./render.yaml) and [`Dockerfile`](./Dockerfile).
4. Set Environment Variables (optional):
   - `PORT`: `8000`
   - `DUPLICATE_SIMILARITY_THRESHOLD`: `0.80`
5. Click **Apply / Deploy**.

---

### Option 4: 🌐 Split Deployment (Vercel Frontend + Render/Railway Backend)

#### Deploy Backend:
1. Deploy `backend/` to Render/Railway/Fly.io using `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`.
2. Note your backend URL (e.g., `https://fixflow-api.onrender.com`).

#### Deploy Frontend on Vercel:
1. Import the `frontend` folder into [Vercel](https://vercel.com).
2. Set the Environment Variable:
   - `VITE_API_BASE_URL`: `https://fixflow-api.onrender.com`
3. Click **Deploy**.

---

## 🛠️ Local Development (Hot Reload)

To develop with live hot-reloading for both backend and frontend:

**Terminal 1 — Backend (Port 8000):**
```bash
uvicorn backend.app.main:app --reload --port 8000
```

**Terminal 2 — Frontend (Port 5173):**
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server automatically proxies `/api` and `/health` requests to `http://127.0.0.1:8000`.

---

## 🧪 Automated Verification & Testing

Run the included end-to-end verification test suites:

```bash
# Verify AI Pipeline, Dense Vectors & Duplicate Calibration
python backend/test_phase2.py

# Verify All REST Endpoints & Ticket Lifecycle
python backend/test_phase3_api.py
```

---

## 📚 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health check & database path |
| `POST` | `/api/complaint/process` | Unified AI triage, vector duplicate check, and RAG SOP matching |
| `GET` | `/api/tickets` | List tickets with optional `?status=` query filter |
| `GET` | `/api/tickets/{id}` | Get ticket details by ID |
| `PATCH` | `/api/tickets/{id}/status` | Update ticket status (`OPEN`, `IN_PROGRESS`, `RESOLVED`) |
| `POST` | `/api/tickets/{id}/notes` | Add technician work log / diagnostic note |
| `GET` | `/api/analytics` | Operational KPI metrics and category distribution |
| `GET` | `/api/sop` | Retrieve all Standard Operating Procedure documents |
| `GET` | `/docs` | Interactive Swagger / OpenAPI Documentation |

---

## 📄 License
MIT License. Built for modern campus facilities and enterprise maintenance operations.
