import os
import uuid
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.db.database import (
    init_db, 
    get_db_connection, 
    insert_ticket,
    get_ticket_by_id,
    update_ticket_status,
    add_ticket_notes,
    delete_ticket,
    get_analytics_summary
)

from backend.app.seeds.seed_data import seed_database
from backend.app.models.schemas import (
    ComplaintProcessRequest,
    ComplaintProcessResponse,
    TicketSchema,
    MatchedSOP,
    StatusUpdateRequest,
    NotesUpdateRequest,
    AnalyticsResponse
)
from backend.app.services.embedding import EmbeddingService
from backend.app.services.triage import TriageService
from backend.app.services.duplicate import DuplicateDetectionService
from backend.app.services.sop import SOPService

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure database initialized and seeded
    init_db()
    seed_database(reset=False)
    yield
    # Shutdown logic if any

app = FastAPI(
    title="FixFlow AI Backend API",
    description="AI-Powered Complaint Triage, Duplicate Detection & Technician Resolution Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FixFlow AI",
        "version": "1.0.0",
        "database": settings.DATABASE_PATH
    }

@app.post("/api/complaint/process", response_model=ComplaintProcessResponse)
def process_complaint(payload: ComplaintProcessRequest):
    """
    Unified AI Pipeline:
    1. Triage extraction (category, location, priority, sla_hours, summary)
    2. Dense semantic vector embedding
    3. Vector cosine similarity duplicate detection (>0.80)
    4. RAG SOP retrieval for 2-3 step technician resolution playbook
    """
    complaint_text = payload.complaint.strip()
    if not complaint_text:
        raise HTTPException(status_code=400, detail="Complaint text cannot be empty.")
        
    # 1. AI Triage Extraction
    triage_data = TriageService.triage_complaint(complaint_text)
    
    # 2. Vector Embedding
    vector = EmbeddingService.get_embedding(complaint_text)
    
    # 3. Vector Similarity & Duplicate Check
    dup_result = DuplicateDetectionService.check_for_duplicates(
        incoming_vector=vector,
        threshold=settings.DUPLICATE_SIMILARITY_THRESHOLD
    )
    
    # 4. RAG SOP Solution Suggestion
    sop_result = SOPService.get_resolution_suggestion(
        complaint_vector=vector,
        category=triage_data["category"]
    )
    
    matched_sop_obj = None
    if sop_result.get("matched_sop"):
        matched_sop_obj = MatchedSOP(**sop_result["matched_sop"])
        
    created_id = None
    if payload.auto_create_ticket:
        ticket_num = f"TKT-{uuid.uuid4().hex[:6].upper()}"
        created_id = insert_ticket(
            ticket_number=ticket_num,
            title=triage_data["summary"],
            raw_complaint=complaint_text,
            category=triage_data["category"],
            location=triage_data["location"],
            priority=triage_data["priority"],
            sla_hours=triage_data["sla_hours"],
            is_duplicate=dup_result["is_duplicate"],
            duplicate_of_id=dup_result["duplicate_ticket_id"],
            vector=vector
        )
        
    return ComplaintProcessResponse(
        category=triage_data["category"],
        location=triage_data["location"],
        priority=triage_data["priority"],
        sla_hours=triage_data["sla_hours"],
        summary=triage_data["summary"],
        is_duplicate=dup_result["is_duplicate"],
        duplicate_ticket_id=dup_result["duplicate_ticket_id"],
        duplicate_score=dup_result["duplicate_score"],
        matched_ticket_title=dup_result["matched_ticket_title"],
        suggested_resolution_sop=sop_result["suggested_resolution_sop"],
        matched_sop=matched_sop_obj,
        created_ticket_id=created_id
    )

@app.get("/api/tickets", response_model=List[TicketSchema])
def list_tickets(status: Optional[str] = None):
    """Retrieve all tickets from SQLite database with optional status filter"""
    query = "SELECT id, ticket_number, title, raw_complaint, category, location, priority, sla_hours, status, is_duplicate, duplicate_of_id, technician_notes, created_at, resolved_at FROM tickets"
    params = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    query += " ORDER BY id DESC"
    
    with get_db_connection() as conn:
        rows = conn.execute(query, params).fetchall()
        return [
            TicketSchema(
                id=r["id"],
                ticket_number=r["ticket_number"],
                title=r["title"],
                raw_complaint=r["raw_complaint"],
                category=r["category"],
                location=r["location"],
                priority=r["priority"],
                sla_hours=r["sla_hours"],
                status=r["status"],
                is_duplicate=bool(r["is_duplicate"]),
                duplicate_of_id=r["duplicate_of_id"],
                technician_notes=r["technician_notes"],
                created_at=str(r["created_at"]),
                resolved_at=str(r["resolved_at"]) if r["resolved_at"] else None
            )
            for r in rows
        ]

@app.get("/api/tickets/{ticket_id}", response_model=TicketSchema)
def get_ticket(ticket_id: int):
    """Retrieve details for a single ticket"""
    tkt = get_ticket_by_id(ticket_id)
    if not tkt:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketSchema(
        id=tkt["id"],
        ticket_number=tkt["ticket_number"],
        title=tkt["title"],
        raw_complaint=tkt["raw_complaint"],
        category=tkt["category"],
        location=tkt["location"],
        priority=tkt["priority"],
        sla_hours=tkt["sla_hours"],
        status=tkt["status"],
        is_duplicate=bool(tkt["is_duplicate"]),
        duplicate_of_id=tkt["duplicate_of_id"],
        technician_notes=tkt["technician_notes"],
        created_at=str(tkt["created_at"]),
        resolved_at=str(tkt["resolved_at"]) if tkt["resolved_at"] else None
    )

@app.patch("/api/tickets/{ticket_id}/status")
def update_status(ticket_id: int, payload: StatusUpdateRequest):
    """Update ticket lifecycle status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)"""
    valid_statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
    status_upper = payload.status.upper()
    if status_upper not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
    success = update_ticket_status(ticket_id, status_upper)
    if not success:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"status": "success", "ticket_id": ticket_id, "new_status": status_upper}

@app.post("/api/tickets/{ticket_id}/notes")
def add_notes(ticket_id: int, payload: NotesUpdateRequest):
    """Log technician diagnostic or resolution note"""
    success = add_ticket_notes(ticket_id, payload.note)
    if not success:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"status": "success", "ticket_id": ticket_id, "note_added": payload.note}

@app.delete("/api/tickets/{ticket_id}")
def remove_ticket(ticket_id: int):
    """Permanently delete a ticket and its vector embeddings"""
    success = delete_ticket(ticket_id)
    if not success:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"status": "success", "deleted_ticket_id": ticket_id}

@app.get("/api/analytics", response_model=AnalyticsResponse)

def get_analytics():
    """Retrieve operational KPIs and category breakdown"""
    summary = get_analytics_summary()
    return AnalyticsResponse(**summary)

@app.get("/api/sop")
def list_sops():
    """Retrieve all standard operating procedure documents"""
    with get_db_connection() as conn:
        rows = conn.execute("SELECT id, code, title, category, equipment_type, symptoms, action_steps_json FROM sop_documents").fetchall()
        import json
        return [
            {
                "id": r["id"],
                "code": r["code"],
                "title": r["title"],
                "category": r["category"],
                "equipment_type": r["equipment_type"],
                "symptoms": r["symptoms"],
                "action_steps": json.loads(r["action_steps_json"])
            }
            for r in rows
        ]

# Mount Built Frontend Assets & SPA Fallback (for single container / monolithic deployment)
frontend_dist_candidates = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "dist"),
    os.path.join(os.getcwd(), "frontend", "dist"),
    os.path.join(os.getcwd(), "dist")
]

dist_dir = next((p for p in frontend_dist_candidates if os.path.isdir(p)), None)

if dist_dir:
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Do not intercept API, health, docs, or openapi routes
        if full_path.startswith("api/") or full_path in ("health", "docs", "openapi.json", "redoc"):
            raise HTTPException(status_code=404, detail="Not Found")

        candidate_file = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(candidate_file):
            return FileResponse(candidate_file)

        index_file = os.path.join(dist_dir, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)

        raise HTTPException(status_code=404, detail="Not Found")

