import {
    Ticket,
    TicketCreatePayload,
    TicketUpdatePayload,
    ClassifyResponse,
    TicketStats,
    TicketFilters,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
        ...options,
    });

    if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`API Error ${res.status}: ${errorBody}`);
    }

    return res.json();
}

// --- Ticket CRUD ---

export async function fetchTickets(filters?: TicketFilters): Promise<Ticket[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set("category", filters.category);
    if (filters?.priority) params.set("priority", filters.priority);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.search) params.set("search", filters.search);

    const query = params.toString();
    return request<Ticket[]>(`/api/tickets/${query ? `?${query}` : ""}`);
}

export async function createTicket(
    data: TicketCreatePayload
): Promise<Ticket> {
    return request<Ticket>("/api/tickets/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateTicket(
    id: number,
    data: TicketUpdatePayload
): Promise<Ticket> {
    return request<Ticket>(`/api/tickets/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

// --- LLM Classify ---

export async function classifyTicket(
    description: string
): Promise<ClassifyResponse> {
    return request<ClassifyResponse>("/api/tickets/classify/", {
        method: "POST",
        body: JSON.stringify({ description }),
    });
}

// --- Stats ---

export async function fetchStats(): Promise<TicketStats> {
    return request<TicketStats>("/api/tickets/stats/");
}
