import sys
import os
import json

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.seeds.seed_data import seed_database

def run_tests():
    print("=" * 80)
    print(" FixFlow AI - Phase 3 Backend End-to-End API Verification Suite")
    print("=" * 80)

    # Reset and seed database
    seed_database(reset=True)
    client = TestClient(app)

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(f" [PASS] 1. Health check: {res.json()['status']}")

    # 2. Process Complaint & Auto-Create Ticket
    payload = {
        "complaint": "Main entrance automatic sliding doors are stuck and not opening.",
        "auto_create_ticket": True
    }
    res = client.post("/api/complaint/process", json=payload)
    assert res.status_code == 200, f"Process complaint failed: {res.text}"
    data = res.json()
    assert data["category"] == "Infrastructure", f"Expected Infrastructure, got {data['category']}"
    assert data["created_ticket_id"] is not None, "Expected created_ticket_id"
    ticket_id = data["created_ticket_id"]
    print(f" [PASS] 2. Process complaint & auto-create ticket ID={ticket_id} (Category={data['category']})")

    # 3. Duplicate Complaint Check
    dup_payload = {
        "complaint": "Water leaking from air conditioning unit in Lab 3, floor wet.",
        "auto_create_ticket": False
    }
    res = client.post("/api/complaint/process", json=dup_payload)
    assert res.status_code == 200
    dup_data = res.json()
    assert dup_data["is_duplicate"] is True, f"Expected duplicate, got score={dup_data['duplicate_score']}"
    assert dup_data["duplicate_score"] >= 0.80, f"Expected score >= 0.80, got {dup_data['duplicate_score']}"
    print(f" [PASS] 3. Duplicate detection verified: score={dup_data['duplicate_score']} (matched ticket={dup_data['duplicate_ticket_id']})")

    # 4. List Tickets
    res = client.get("/api/tickets")
    assert res.status_code == 200
    tickets = res.json()
    assert len(tickets) >= 4, f"Expected at least 4 tickets, got {len(tickets)}"
    print(f" [PASS] 4. List tickets returned {len(tickets)} tickets")

    # 5. Get Single Ticket
    res = client.get(f"/api/tickets/{ticket_id}")
    assert res.status_code == 200
    tkt = res.json()
    assert tkt["id"] == ticket_id
    assert tkt["status"] == "OPEN"
    print(f" [PASS] 5. Get single ticket verified: ID={ticket_id}, Status={tkt['status']}")

    # 6. Update Status to IN_PROGRESS
    res = client.patch(f"/api/tickets/{ticket_id}/status", json={"status": "IN_PROGRESS"})
    assert res.status_code == 200
    assert res.json()["new_status"] == "IN_PROGRESS"
    print(f" [PASS] 6. Updated ticket ID={ticket_id} status to IN_PROGRESS")

    # 7. Add Technician Note
    res = client.post(f"/api/tickets/{ticket_id}/notes", json={"note": "Technician on site inspecting door optical sensors."})
    assert res.status_code == 200
    print(f" [PASS] 7. Added technician note to ticket ID={ticket_id}")

    # 8. Update Status to RESOLVED
    res = client.patch(f"/api/tickets/{ticket_id}/status", json={"status": "RESOLVED"})
    assert res.status_code == 200
    assert res.json()["new_status"] == "RESOLVED"
    print(f" [PASS] 8. Resolved ticket ID={ticket_id}")

    # 9. Analytics Endpoint
    res = client.get("/api/analytics")
    assert res.status_code == 200
    analytics = res.json()
    assert analytics["total_tickets"] >= 4
    assert analytics["resolved"] >= 1
    assert "Infrastructure" in analytics["category_distribution"]
    print(f" [PASS] 9. Analytics verified: {analytics}")

    print("\n" + "=" * 80)
    print(" ALL BACKEND VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
