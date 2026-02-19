// Ticket types matching the Django model
export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
}

export type TicketCategory = "billing" | "technical" | "account" | "general";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface TicketCreatePayload {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface TicketUpdatePayload {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
}

export interface ClassifyResponse {
  suggested_category: TicketCategory;
  suggested_priority: TicketPriority;
}

export interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  avg_tickets_per_day: number;
  priority_breakdown: Record<TicketPriority, number>;
  category_breakdown: Record<TicketCategory, number>;
}

export interface TicketFilters {
  category?: TicketCategory | "";
  priority?: TicketPriority | "";
  status?: TicketStatus | "";
  search?: string;
}
