from typing import Dict, Any, List, Optional
from backend.app.config import settings
from backend.app.db.database import get_all_ticket_embeddings
from backend.app.services.embedding import cosine_similarity

class DuplicateDetectionService:
    @staticmethod
    def check_for_duplicates(
        incoming_vector: List[float], 
        threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Scans all active ticket embeddings in SQLite.
        Returns duplicate detection flags and highest matched ticket info.
        """
        min_threshold = threshold if threshold is not None else settings.DUPLICATE_SIMILARITY_THRESHOLD
        existing_tickets = get_all_ticket_embeddings()
        
        if not existing_tickets:
            return {
                "is_duplicate": False,
                "duplicate_ticket_id": None,
                "duplicate_score": 0.0,
                "matched_ticket_title": None
            }
            
        best_match = None
        max_score = 0.0
        
        for ticket in existing_tickets:
            score = cosine_similarity(incoming_vector, ticket["vector"])
            if score > max_score:
                max_score = score
                best_match = ticket
                
        is_dup = (max_score >= min_threshold) and (best_match is not None)
        
        return {
            "is_duplicate": is_dup,
            "duplicate_ticket_id": best_match["id"] if is_dup else None,
            "duplicate_score": round(max_score, 4),
            "matched_ticket_title": best_match["title"] if best_match else None
        }
