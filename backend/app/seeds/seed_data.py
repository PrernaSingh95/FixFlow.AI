import json
from backend.app.db.database import get_db_connection, init_db
from backend.app.services.embedding import EmbeddingService

INITIAL_SOPS = [
    {
        "code": "SOP-HVAC-01",
        "title": "HVAC Water Leakage & Condensate Drain Protocol",
        "category": "HVAC",
        "equipment_type": "Air Conditioner / Rooftop Chiller",
        "symptoms": "Water dripping, ac leak, condensate pan overflow, wet floor, cooling unit leak",
        "action_steps": [
            "Step 1: Disconnect HVAC unit power at local disconnect switch and place drip containment pads beneath unit.",
            "Step 2: Inspect primary condensate drain line and P-trap for algae or dust clogs; clear with nitrogen or wet-vac.",
            "Step 3: Test pan float switch functionality and confirm unimpeded gravity drainage before restoring power."
        ]
    },
    {
        "code": "SOP-IT-01",
        "title": "Classroom & Conference Projector / Display Lamp Failure",
        "category": "IT",
        "equipment_type": "Ceiling Projector / AV Display",
        "symptoms": "Projector light out, no display, lamp burned, bulb blown, screen dark, av projector",
        "action_steps": [
            "Step 1: Check power cabling, HDMI handshake status, and verify LED status indicator code on projector chassis.",
            "Step 2: Allow unit to cool down 15 minutes, remove lamp enclosure cover, and inspect bulb filament for burnout.",
            "Step 3: Replace with OEM lamp cartridge, reset the internal lamp timer counter, and verify test pattern projection."
        ]
    },
    {
        "code": "SOP-ELEC-01",
        "title": "Electrical Power Socket & Circuit Breaker Overload",
        "category": "Electrical",
        "equipment_type": "Wall Outlet / Distribution Panel",
        "symptoms": "Sparks, outlet smoking, circuit breaker trip, power socket dead, electric smell",
        "action_steps": [
            "Step 1: Disengage main sub-panel circuit breaker, lockout/tagout (LOTO), and test voltage with calibrated multimeter.",
            "Step 2: Inspect receptacle terminals for thermal discoloration, arcing marks, or loose wiring screws.",
            "Step 3: Replace receptacle with industrial grade outlet, torque terminals to specification, and reset breaker."
        ]
    },
    {
        "code": "SOP-PLUMB-01",
        "title": "Commercial Pipe Leak & Restroom Drainage Overflows",
        "category": "Plumbing",
        "equipment_type": "Piping / Sink / Restroom Fixture",
        "symptoms": "Pipe burst, water leak, drain clog, toilet overflow, faucet drip",
        "action_steps": [
            "Step 1: Shut off local fixture isolation valve and deploy wet vacuum / absorbent booms to mitigate standing water.",
            "Step 2: Snaking drainage pipe to clear downstream obstruction or replace compromised pipe fitting/coupling gasket.",
            "Step 3: Re-pressurize supply line, inspect joints under operating pressure for 5 minutes, and sanitize surrounding floor."
        ]
    },
    {
        "code": "SOP-INFRA-01",
        "title": "Automatic Door & Mechanical Access Entryway Malfunctions",
        "category": "Infrastructure",
        "equipment_type": "Automated Sliding Door / Turnstile",
        "symptoms": "Door jammed, access gate stuck, entrance sliding door stuck, lock failure",
        "action_steps": [
            "Step 1: Toggle door operator to manual hold-open mode and inspect motion sensor alignment and obstacle beams.",
            "Step 2: Clear dirt/debris from bottom floor guide track and lubricate top roller assembly.",
            "Step 3: Recalibrate electronic control unit travel limits and verify emergency break-out latch."
        ]
    }
]

INITIAL_TICKETS = [
    {
        "ticket_number": "TKT-1001",
        "title": "AC unit leaking water onto floor in Lab 3",
        "raw_complaint": "The ceiling AC unit in Lab 3 is leaking water continuously onto the workstations and floor.",
        "category": "HVAC",
        "location": "Lab 3",
        "priority": "High",
        "sla_hours": 4,
        "status": "OPEN"
    },
    {
        "ticket_number": "TKT-1002",
        "title": "Electrical outlet smoking in Breakroom B",
        "raw_complaint": "Wall electrical outlet near the microwave started smoking and sparking when plugged in.",
        "category": "Electrical",
        "location": "Breakroom B",
        "priority": "Critical",
        "sla_hours": 2,
        "status": "OPEN"
    },
    {
        "ticket_number": "TKT-1003",
        "title": "Main entrance sliding doors jammed open",
        "raw_complaint": "Glass sliding doors at building front lobby are stuck half open and won't cycle.",
        "category": "Infrastructure",
        "location": "Front Lobby",
        "priority": "Medium",
        "sla_hours": 24,
        "status": "OPEN"
    }
]

def seed_database(reset: bool = False):
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        if reset:
            cursor.execute("DELETE FROM ticket_embeddings")
            cursor.execute("DELETE FROM tickets")
            cursor.execute("DELETE FROM sop_documents")
            conn.commit()
            
        # Check if SOPs already seeded
        existing_sop_count = cursor.execute("SELECT COUNT(*) FROM sop_documents").fetchone()[0]
        if existing_sop_count == 0:
            print("[Seed] Inserting SOP Knowledge Base...")
            for sop in INITIAL_SOPS:
                # Combine title, equipment, and symptoms for rich semantic embedding
                embed_text = f"{sop['title']} {sop['category']} {sop['equipment_type']} {sop['symptoms']}"
                vec = EmbeddingService.get_embedding(embed_text)
                cursor.execute(
                    """
                    INSERT INTO sop_documents (code, title, category, equipment_type, symptoms, action_steps_json, vector_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        sop["code"], 
                        sop["title"], 
                        sop["category"], 
                        sop["equipment_type"], 
                        sop["symptoms"], 
                        json.dumps(sop["action_steps"]), 
                        json.dumps(vec)
                    )
                )
            conn.commit()
            print(f"[Seed] Inserted {len(INITIAL_SOPS)} SOP documents.")
            
        # Check if Tickets already seeded
        existing_ticket_count = cursor.execute("SELECT COUNT(*) FROM tickets").fetchone()[0]
        if existing_ticket_count == 0:
            print("[Seed] Inserting Initial Tickets...")
            for tkt in INITIAL_TICKETS:
                vec = EmbeddingService.get_embedding(f"{tkt['raw_complaint']} {tkt['category']} {tkt['location']}")
                cursor.execute(
                    """
                    INSERT INTO tickets (
                        ticket_number, title, raw_complaint, category, location, priority, sla_hours, status, is_duplicate
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
                    """,
                    (
                        tkt["ticket_number"], 
                        tkt["title"], 
                        tkt["raw_complaint"], 
                        tkt["category"], 
                        tkt["location"], 
                        tkt["priority"], 
                        tkt["sla_hours"], 
                        tkt["status"]
                    )
                )
                t_id = cursor.lastrowid
                cursor.execute(
                    """
                    INSERT INTO ticket_embeddings (ticket_id, vector_json)
                    VALUES (?, ?)
                    """,
                    (t_id, json.dumps(vec))
                )
            conn.commit()
            print(f"[Seed] Inserted {len(INITIAL_TICKETS)} baseline tickets with vector embeddings.")

if __name__ == "__main__":
    seed_database(reset=True)
