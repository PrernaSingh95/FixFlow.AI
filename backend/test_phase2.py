import sys
import os
import json

# Ensure project root is in sys.path
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
    print(" FixFlow AI - Phase 2 AI Pipeline & Vector Engine Verification Suite")
    print("=" * 80)
    
    # 1. Reset and re-seed database with baseline records
    print("\n[STEP 1] Initializing and seeding SQLite database with test baseline...")
    seed_database(reset=True)
    
    client = TestClient(app)
    
    # Verify health
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(f"  [OK] Health Check Passed: {res.json()}")

    
    test_cases = [
        {
            "name": "TEST CASE 1: Baseline New Issue (Non-Duplicate)",
            "payload": {
                "complaint": "Projector light out in Room 102, unable to display slides for lecture."
            },
            "expectations": {
                "category": "IT",
                "location": "Room 102",
                "priority": "Medium",
                "sla_hours": 24,
                "is_duplicate": False,
                "sop_code": "SOP-IT-01"
            }
        },
        {
            "name": "TEST CASE 2: Duplicate Incident Check (AC Leak in Lab 3 vs TKT-1001)",
            "payload": {
                "complaint": "AC leaking water in Lab 3, dripping onto desk."
            },
            "expectations": {
                "category": "HVAC",
                "location": "Lab 3",
                "priority": "High",
                "sla_hours": 4,
                "is_duplicate": True,
                "sop_code": "SOP-HVAC-01"
            }
        },
        {
            "name": "TEST CASE 3: Paraphrased Duplicate AC Report (Laboratory 3)",
            "payload": {
                "complaint": "Water dripping from air conditioner in Laboratory 3, floor getting wet."
            },
            "expectations": {
                "category": "HVAC",
                "location": "Lab 3",
                "priority": "High",
                "sla_hours": 4,
                "is_duplicate": True,
                "sop_code": "SOP-HVAC-01"
            }
        }
    ]
    
    all_passed = True
    
    for i, test in enumerate(test_cases, 1):
        print("\n" + "-" * 80)
        print(f" {test['name']}")
        print(f" Input Complaint: \"{test['payload']['complaint']}\"")
        print("-" * 80)
        
        response = client.post("/api/complaint/process", json=test["payload"])
        if response.status_code != 200:
            print(f"❌ FAILED with status {response.status_code}: {response.text}")
            all_passed = False
            continue
            
        data = response.json()
        print(json.dumps(data, indent=2))
        
        # Validation
        exp = test["expectations"]
        assert_cat = (data["category"] == exp["category"])
        assert_loc = (exp["location"].lower() in data["location"].lower())
        assert_prio = (data["priority"] == exp["priority"])
        assert_sla = (data["sla_hours"] == exp["sla_hours"])
        assert_dup = (data["is_duplicate"] == exp["is_duplicate"])
        assert_sop = (data.get("matched_sop") is not None and data["matched_sop"]["code"] == exp["sop_code"])
        assert_steps = (len(data.get("suggested_resolution_sop", [])) >= 2)
        
        print("\n  Verification Checks:")
        print(f"   [{'PASS' if assert_cat else 'FAIL'}] Category: {data['category']} (Expected: {exp['category']})")
        print(f"   [{'PASS' if assert_loc else 'FAIL'}] Location: {data['location']} (Expected containing: {exp['location']})")
        print(f"   [{'PASS' if assert_prio else 'FAIL'}] Priority: {data['priority']} (Expected: {exp['priority']})")
        print(f"   [{'PASS' if assert_sla else 'FAIL'}] SLA Hours: {data['sla_hours']}h (Expected: {exp['sla_hours']}h)")
        print(f"   [{'PASS' if assert_dup else 'FAIL'}] Duplicate Flag: {data['is_duplicate']} (Similarity: {data['duplicate_score']}, Matched ID: {data['duplicate_ticket_id']})")
        print(f"   [{'PASS' if assert_sop else 'FAIL'}] RAG Matched SOP: {data['matched_sop']['code'] if data.get('matched_sop') else 'None'} (Expected: {exp['sop_code']})")
        print(f"   [{'PASS' if assert_steps else 'FAIL'}] Suggested Resolution Steps: {len(data.get('suggested_resolution_sop', []))} steps generated")
        
        if not (assert_cat and assert_loc and assert_prio and assert_sla and assert_dup and assert_sop and assert_steps):
            all_passed = False
            print("  [FAIL] ONE OR MORE CHECKS FAILED IN THIS TEST CASE")
        else:
            print("  [PASS] ALL CHECKS PASSED PERFECTLY")
            
    print("\n" + "=" * 80)
    if all_passed:
        print(" [SUCCESS] PHASE 2 VERIFICATION COMPLETE: ALL 3 TEST CASES PASSED WITH 100% ACCURACY!")
    else:
        print(" [ERROR] SOME TESTS FAILED. CHECK LOGS ABOVE.")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()

