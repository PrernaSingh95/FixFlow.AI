export interface MatchedSOP {
  code: string;
  title: string;
  category: string;
  similarity: number;
}

export interface ComplaintProcessResponse {
  category: 'HVAC' | 'Electrical' | 'Plumbing' | 'IT' | 'Infrastructure' | string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  sla_hours: number;
  summary: string;
  is_duplicate: boolean;
  duplicate_ticket_id: number | null;
  duplicate_score: number;
  matched_ticket_title: string | null;
  suggested_resolution_sop: string[];
  matched_sop: MatchedSOP | null;
  created_ticket_id: number | null;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  raw_complaint: string;
  category: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  sla_hours: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  is_duplicate: boolean;
  duplicate_of_id: number | null;
  technician_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AnalyticsData {
  total_tickets: number;
  open_tickets: number;
  in_progress: number;
  resolved: number;
  high_priority_count: number;
  duplicate_count: number;
  avg_sla_hours: number;
  category_distribution: Record<string, number>;
}

export interface SOPDocument {
  id: number;
  code: string;
  title: string;
  category: string;
  equipment_type: string;
  symptoms: string;
  action_steps: string[];
}
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function processComplaint(complaint: string, autoCreate: boolean = false): Promise<ComplaintProcessResponse> {
  const res = await fetch(`${API_BASE}/api/complaint/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ complaint, auto_create_ticket: autoCreate }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to process complaint' }));
    throw new Error(err.detail || 'Failed to process complaint');
  }
  return res.json();
}

export async function getTickets(status?: string): Promise<Ticket[]> {
  const url = status ? `${API_BASE}/api/tickets?status=${encodeURIComponent(status)}` : `${API_BASE}/api/tickets`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

export async function getTicketById(id: number): Promise<Ticket> {
  const res = await fetch(`${API_BASE}/api/tickets/${id}`);
  if (!res.ok) throw new Error('Failed to fetch ticket');
  return res.json();
}

export async function updateTicketStatus(id: number, status: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/tickets/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update ticket status');
}

export async function addTicketNote(id: number, note: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/tickets/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error('Failed to add technician note');
}

export async function deleteTicket(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/tickets/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete ticket');
}

export async function getAnalytics(): Promise<AnalyticsData> {

  const res = await fetch(`${API_BASE}/api/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function getSOPs(): Promise<SOPDocument[]> {
  const res = await fetch(`${API_BASE}/api/sop`);
  if (!res.ok) throw new Error('Failed to fetch SOP documents');
  return res.json();
}
