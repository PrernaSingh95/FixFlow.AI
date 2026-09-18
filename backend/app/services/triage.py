import re
from typing import Dict, Any, Tuple
from backend.app.config import settings

# Predefined category rules & keywords
CATEGORY_KEYWORDS = {
    "HVAC": [
        "ac", "air conditioner", "air conditioning", "hvac", "chiller", "cooling", 
        "heating", "heater", "ventilation", "thermostat", "duct", "airflow", "refrigerant", "condensate"
    ],
    "Electrical": [
        "electrical", "outlet", "socket", "light", "lighting", "bulb", "lamp", 
        "spark", "sparking", "breaker", "fuse", "power", "switch", "wiring", "voltage"
    ],
    "Plumbing": [
        "plumbing", "pipe", "drain", "sink", "toilet", "faucet", "restroom", 
        "sewage", "flush", "water pressure", "leak", "leaking", "dripping"
    ],
    "IT": [
        "it", "projector", "screen", "display", "monitor", "server", "wifi", 
        "network", "cable", "hdmi", "computer", "router", "printer", "audio"
    ],
    "Infrastructure": [
        "door", "window", "lock", "ceiling", "floor", "wall", "roof", 
        "elevator", "lift", "stairs", "furniture", "railing", "tiles"
    ]
}

# Location extraction patterns
LOCATION_PATTERNS = [
    r"\b(lab(?:oratory)?\s*(?:[0-9]+|[a-zA-Z]))\b",
    r"\b(room\s*(?:[0-9]+|[a-zA-Z]+))\b",
    r"\b(rm\s*[0-9]+)\b",
    r"\b(building\s*[a-zA-Z0-9]+)\b",
    r"\b(floor\s*[0-9]+)\b",
    r"\b(server\s*room)\b",
    r"\b(breakroom\s*[a-zA-Z0-9]*)\b",
    r"\b(conference\s*room\s*[a-zA-Z0-9]*)\b",
    r"\b(auditorium\s*[a-zA-Z0-9]*)\b",
    r"\b(restroom\s*[a-zA-Z0-9]*)\b"
]

def extract_location(text: str) -> str:
    for pattern in LOCATION_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw_loc = match.group(1).strip()
            # Clean up and normalize aliases (e.g. "laboratory 3" -> "Lab 3", "rm 102" -> "Room 102")
            raw_loc = re.sub(r"^laboratory\b", "Lab", raw_loc, flags=re.IGNORECASE)
            raw_loc = re.sub(r"^rm\b", "Room", raw_loc, flags=re.IGNORECASE)
            return " ".join([w.capitalize() for w in raw_loc.split()])
    return "Main Facility"


def classify_category(text: str) -> str:
    lower_text = text.lower()
    
    # Priority check for specific equipment overlaps
    # "projector light out" -> IT
    if "projector" in lower_text:
        return "IT"
    # "ac leaking" -> HVAC (even though "leaking" is in plumbing)
    if any(k in lower_text for k in ["ac", "air condition", "hvac", "cooling", "chiller"]):
        return "HVAC"
        
    scores = {cat: 0 for cat in CATEGORY_KEYWORDS}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw) + r"\b", lower_text):
                scores[cat] += 2 if len(kw) > 3 else 1
                
    best_cat = max(scores, key=scores.get)
    if scores[best_cat] > 0:
        return best_cat
    return "Infrastructure"

def determine_priority_and_sla(text: str, category: str) -> Tuple[str, int]:
    lower_text = text.lower()
    
    # Critical: immediate safety hazards, fire risk, server room water/overheating
    if any(w in lower_text for w in ["spark", "fire", "smoke", "flood", "shock", "collapse", "gas leak", "server room"]):
        return ("Critical", 2)
        
    # High: Active water leaks, elevator stuck, HVAC failure in sensitive labs
    if any(w in lower_text for w in ["leaking", "dripping", "stuck", "overflow", "emergency", "no power", "lab"]):
        if category in ["HVAC", "Plumbing", "Electrical"]:
            return ("High", 4)
            
    # Medium: Non-emergency equipment failure (projector light, slow drain, loose door)
    if any(w in lower_text for w in ["out", "broken", "not working", "flicker", "loose", "dead"]):
        return ("Medium", 24)
        
    # Low: minor aesthetic / non-blocking issues
    return ("Low", 48)

def generate_summary(text: str, category: str, location: str) -> str:
    cleaned = text.strip()
    if len(cleaned) <= 60 and not cleaned.endswith("."):
        return cleaned.capitalize()
        
    lower = cleaned.lower()
    if "ac" in lower or "air condition" in lower:
        if "leak" in lower or "water" in lower or "drip" in lower:
            return f"HVAC Unit Water Leakage reported in {location}"
        return f"HVAC Malfunction reported in {location}"
        
    if "projector" in lower:
        return f"Projector Display / Lamp Failure in {location}"
        
    if "pipe" in lower or "sink" in lower:
        return f"Plumbing Issue reported in {location}"
        
    if "light" in lower:
        return f"Lighting Fixture Issue in {location}"
        
    # Fallback to truncated first sentence
    first_sentence = cleaned.split(".")[0].strip()
    return first_sentence[:75].capitalize()

class TriageService:
    @staticmethod
    def triage_complaint(complaint_text: str) -> Dict[str, Any]:
        """
        Extracts structured operational fields from raw complaint text:
        - Category
        - Location
        - Priority
        - SLA hours
        - Structured Summary
        """
        location = extract_location(complaint_text)
        category = classify_category(complaint_text)
        priority, sla_hours = determine_priority_and_sla(complaint_text, category)
        summary = generate_summary(complaint_text, category, location)
        
        return {
            "category": category,
            "location": location,
            "priority": priority,
            "sla_hours": sla_hours,
            "summary": summary
        }
