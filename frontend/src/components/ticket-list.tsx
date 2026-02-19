"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { fetchTickets } from "@/lib/api";
import type { Ticket, TicketFilters } from "@/lib/types";
import TicketCard from "./ticket-card";

interface TicketListProps {
    tickets: Ticket[];
    setTickets: (tickets: Ticket[]) => void;
    refreshKey: number;
}

export default function TicketList({
    tickets,
    setTickets,
    refreshKey,
}: TicketListProps) {
    const [filters, setFilters] = useState<TicketFilters>({});
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const loadTickets = useCallback(async () => {
        setIsLoading(true);
        try {
            const activeFilters: TicketFilters = {};
            if (filters.category) activeFilters.category = filters.category;
            if (filters.priority) activeFilters.priority = filters.priority;
            if (filters.status) activeFilters.status = filters.status;
            if (search.trim()) activeFilters.search = search.trim();

            const data = await fetchTickets(activeFilters);
            setTickets(data);
        } catch (err) {
            console.error("Failed to load tickets:", err);
        } finally {
            setIsLoading(false);
        }
    }, [filters, search, setTickets]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets, refreshKey]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            loadTickets();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTicketUpdate = (updatedTicket: Ticket) => {
        setTickets(
            tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
        );
    };

    const clearFilters = () => {
        setFilters({});
        setSearch("");
    };

    const hasActiveFilters =
        filters.category || filters.priority || filters.status || search;

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <Input
                        placeholder="Search tickets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select
                    value={filters.category || "all"}
                    onValueChange={(v) =>
                        setFilters({ ...filters, category: v === "all" ? "" : (v as TicketFilters["category"]) })
                    }
                >
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="billing">💳 Billing</SelectItem>
                        <SelectItem value="technical">🔧 Technical</SelectItem>
                        <SelectItem value="account">👤 Account</SelectItem>
                        <SelectItem value="general">📋 General</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.priority || "all"}
                    onValueChange={(v) =>
                        setFilters({ ...filters, priority: v === "all" ? "" : (v as TicketFilters["priority"]) })
                    }
                >
                    <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status || "all"}
                    onValueChange={(v) =>
                        setFilters({ ...filters, status: v === "all" ? "" : (v as TicketFilters["status"]) })
                    }
                >
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                        ✕ Clear
                    </Button>
                )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {isLoading ? "Loading..." : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`}
                </p>
            </div>

            {/* Ticket cards */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-32 rounded-lg bg-muted/50 animate-pulse"
                        />
                    ))}
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <svg
                        className="mx-auto h-12 w-12 mb-3 opacity-50"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M7 15h0M2 9.5h20" />
                    </svg>
                    <p className="font-medium">No tickets found</p>
                    <p className="text-sm mt-1">
                        {hasActiveFilters
                            ? "Try adjusting your filters"
                            : "Submit your first ticket above"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tickets.map((ticket) => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onUpdate={handleTicketUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
