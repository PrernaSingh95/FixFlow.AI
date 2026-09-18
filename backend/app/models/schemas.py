from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class CategoryEnum(str, Enum):
    HVAC = "HVAC"
    ELECTRICAL = "Electrical"
    PLUMBING = "Plumbing"
    IT = "IT"
    INFRASTRUCTURE = "Infrastructure"

class PriorityEnum(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class StatusEnum(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

# Request Schema for Ingesting/Processing Complaint
class ComplaintProcessRequest(BaseModel):
    complaint: str = Field(..., min_length=3, description="Raw unstructured complaint text")
    reporter: Optional[str] = Field(default="Facility User", description="Optional reporter name or email")
    auto_create_ticket: Optional[bool] = Field(default=False, description="If True, saves as an active ticket")

class MatchedSOP(BaseModel):
    code: str
    title: str
    category: str
    similarity: float = 0.0

# Response Schema for /api/complaint/process
class ComplaintProcessResponse(BaseModel):
    category: str = Field(..., description="Category: HVAC, Electrical, Plumbing, IT, Infrastructure")
    location: str = Field(..., description="Parsed room/building location")
    priority: str = Field(..., description="Priority: Low, Medium, High, Critical")
    sla_hours: int = Field(..., description="SLA target response/resolution hours")
    summary: str = Field(..., description="Structured summary / clean title")
    is_duplicate: bool = Field(default=False, description="True if similarity > 0.80")
    duplicate_ticket_id: Optional[int] = Field(default=None, description="Matched existing ticket ID")
    duplicate_score: float = Field(default=0.0, description="Cosine similarity score against matched ticket")
    matched_ticket_title: Optional[str] = Field(default=None, description="Title of duplicate ticket if matched")
    suggested_resolution_sop: List[str] = Field(
        default_factory=list, 
        description="2-3 step actionable technician resolution steps"
    )
    matched_sop: Optional[MatchedSOP] = Field(default=None, description="Best matching SOP metadata")
    created_ticket_id: Optional[int] = Field(default=None, description="Ticket ID if persisted")

# Standard Ticket schemas for DB CRUD
class TicketSchema(BaseModel):
    id: int
    ticket_number: str
    title: str
    raw_complaint: str
    category: str
    location: str
    priority: str
    sla_hours: int
    status: str
    is_duplicate: bool
    duplicate_of_id: Optional[int] = None
    technician_notes: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Status: OPEN, IN_PROGRESS, RESOLVED, CLOSED")

class NotesUpdateRequest(BaseModel):
    note: str = Field(..., min_length=1, description="Diagnostic note or resolution remark")

class AnalyticsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress: int
    resolved: int
    high_priority_count: int
    duplicate_count: int
    avg_sla_hours: float
    category_distribution: dict

