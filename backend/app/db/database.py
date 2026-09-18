import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from backend.app.config import settings

def get_db_path() -> str:
    db_file = settings.DATABASE_PATH
    # Ensure directory exists if path contains a folder
    dir_name = os.path.dirname(db_file)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    return db_file

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    
    with get_db_connection() as conn:
        conn.executescript(schema_sql)
        conn.commit()

# Database helper queries
def get_all_ticket_embeddings() -> List[Dict[str, Any]]:
    query = """
        SELECT t.id, t.ticket_number, t.title, t.raw_complaint, t.category, t.location, t.status, te.vector_json
        FROM tickets t
        JOIN ticket_embeddings te ON t.id = te.ticket_id
        WHERE t.status != 'CLOSED'
    """
    with get_db_connection() as conn:
        rows = conn.execute(query).fetchall()
        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "ticket_number": r["ticket_number"],
                "title": r["title"],
                "raw_complaint": r["raw_complaint"],
                "category": r["category"],
                "location": r["location"],
                "status": r["status"],
                "vector": json.loads(r["vector_json"])
            })
        return result

def get_all_sop_documents() -> List[Dict[str, Any]]:
    query = """
        SELECT id, code, title, category, equipment_type, symptoms, action_steps_json, vector_json
        FROM sop_documents
    """
    with get_db_connection() as conn:
        rows = conn.execute(query).fetchall()
        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "code": r["code"],
                "title": r["title"],
                "category": r["category"],
                "equipment_type": r["equipment_type"],
                "symptoms": r["symptoms"],
                "action_steps": json.loads(r["action_steps_json"]),
                "vector": json.loads(r["vector_json"])
            })
        return result

def insert_ticket(
    ticket_number: str,
    title: str,
    raw_complaint: str,
    category: str,
    location: str,
    priority: str,
    sla_hours: int,
    is_duplicate: bool,
    duplicate_of_id: Optional[int],
    vector: List[float]
) -> int:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO tickets (
                ticket_number, title, raw_complaint, category, location, 
                priority, sla_hours, status, is_duplicate, duplicate_of_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
            """,
            (ticket_number, title, raw_complaint, category, location, priority, sla_hours, 1 if is_duplicate else 0, duplicate_of_id)
        )
        ticket_id = cursor.lastrowid
        cursor.execute(
            """
            INSERT INTO ticket_embeddings (ticket_id, vector_json)
            VALUES (?, ?)
            """,
            (ticket_id, json.dumps(vector))
        )
        conn.commit()
        return ticket_id

def get_ticket_by_id(ticket_id: int) -> Optional[Dict[str, Any]]:
    query = """
        SELECT id, ticket_number, title, raw_complaint, category, location, 
               priority, sla_hours, status, is_duplicate, duplicate_of_id, 
               technician_notes, created_at, resolved_at 
        FROM tickets WHERE id = ?
    """
    with get_db_connection() as conn:
        row = conn.execute(query, (ticket_id,)).fetchone()
        if not row:
            return None
        return dict(row)

def update_ticket_status(ticket_id: int, status: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if status.upper() == "RESOLVED":
            cursor.execute(
                "UPDATE tickets SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?",
                (status.upper(), ticket_id)
            )
        else:
            cursor.execute(
                "UPDATE tickets SET status = ? WHERE id = ?",
                (status.upper(), ticket_id)
            )
        conn.commit()
        return cursor.rowcount > 0

def add_ticket_notes(ticket_id: int, note: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        current = conn.execute("SELECT technician_notes FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        if not current:
            return False
        existing_notes = current["technician_notes"] or ""
        new_notes = f"{existing_notes}\n{note}".strip() if existing_notes else note.strip()
        cursor.execute("UPDATE tickets SET technician_notes = ? WHERE id = ?", (new_notes, ticket_id))
        conn.commit()
        return True

def delete_ticket(ticket_id: int) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Delete related embeddings first if any
        cursor.execute("DELETE FROM ticket_embeddings WHERE ticket_id = ?", (ticket_id,))
        # Delete the ticket
        cursor.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
        conn.commit()
        return cursor.rowcount > 0

def get_analytics_summary() -> Dict[str, Any]:

    with get_db_connection() as conn:
        cursor = conn.cursor()
        total = cursor.execute("SELECT COUNT(*) FROM tickets").fetchone()[0]
        open_cnt = cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'OPEN'").fetchone()[0]
        in_prog_cnt = cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'IN_PROGRESS'").fetchone()[0]
        resolved_cnt = cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'RESOLVED'").fetchone()[0]
        high_prio_cnt = cursor.execute("SELECT COUNT(*) FROM tickets WHERE priority IN ('High', 'Critical')").fetchone()[0]
        duplicate_cnt = cursor.execute("SELECT COUNT(*) FROM tickets WHERE is_duplicate = 1").fetchone()[0]
        
        avg_sla_row = cursor.execute("SELECT AVG(sla_hours) FROM tickets").fetchone()[0]
        avg_sla = round(float(avg_sla_row), 1) if avg_sla_row else 12.0
        
        category_rows = cursor.execute("SELECT category, COUNT(*) as cnt FROM tickets GROUP BY category").fetchall()
        cat_dist = {r["category"]: r["cnt"] for r in category_rows}
        
        return {
            "total_tickets": total,
            "open_tickets": open_cnt,
            "in_progress": in_prog_cnt,
            "resolved": resolved_cnt,
            "high_priority_count": high_prio_cnt,
            "duplicate_count": duplicate_cnt,
            "avg_sla_hours": avg_sla,
            "category_distribution": cat_dist
        }

