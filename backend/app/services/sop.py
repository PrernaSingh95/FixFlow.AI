from typing import Dict, Any, List, Optional
from backend.app.db.database import get_all_sop_documents
from backend.app.services.embedding import cosine_similarity

class SOPService:
    @staticmethod
    def get_resolution_suggestion(
        complaint_vector: List[float],
        category: str
    ) -> Dict[str, Any]:
        """
        Retrieves the most relevant SOP from SQLite knowledge base
        and formats a 2-3 step actionable technician resolution protocol.
        """
        sops = get_all_sop_documents()
        
        if not sops:
            return {
                "suggested_resolution_sop": [
                    "Step 1: Conduct visual on-site inspection and isolate power if fluids are present.",
                    "Step 2: Check manufacturer diagnostics code and log telemetry.",
                    "Step 3: Document findings, replace faulty subcomponent, and verify normal operation."
                ],
                "matched_sop": None
            }
            
        best_sop = None
        max_score = -1.0
        
        for sop in sops:
            sim = cosine_similarity(complaint_vector, sop["vector"])
            # Category match bonus to prioritize domain-correct SOP
            if sop["category"].lower() == category.lower():
                sim += 0.25
                
            if sim > max_score:
                max_score = sim
                best_sop = sop
                
        if best_sop and best_sop.get("action_steps"):
            steps = best_sop["action_steps"][:3]
            return {
                "suggested_resolution_sop": steps,
                "matched_sop": {
                    "code": best_sop["code"],
                    "title": best_sop["title"],
                    "category": best_sop["category"],
                    "similarity": round(min(1.0, max_score), 3)
                }
            }
            
        # Default safety protocol fallback
        return {
            "suggested_resolution_sop": [
                "Step 1: Inspect immediate area for safety hazards and deploy caution barriers.",
                "Step 2: Perform diagnostic checks according to facility standard procedures.",
                "Step 3: Resolve root cause, test equipment cycle, and update maintenance log."
            ],
            "matched_sop": None
        }
