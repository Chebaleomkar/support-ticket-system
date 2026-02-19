"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateTicket } from "@/lib/api";
import type { Ticket, TicketStatus } from "@/lib/types";
import { useState } from "react";

interface TicketCardProps {
    ticket: Ticket;
    onUpdate: (ticket: Ticket) => void;
}

const categoryConfig: Record<string, { emoji: string; color: string }> = {
    billing: { emoji: "💳", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    technical: { emoji: "🔧", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    account: { emoji: "👤", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    general: { emoji: "📋", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: "Low", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    high: { label: "High", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    critical: { label: "Critical", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: "Open", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
    in_progress: { label: "In Progress", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
    resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    closed: { label: "Closed", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function TicketCard({ ticket, onUpdate }: TicketCardProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const cat = categoryConfig[ticket.category] || categoryConfig.general;
    const pri = priorityConfig[ticket.priority] || priorityConfig.medium;
    const stat = statusConfig[ticket.status] || statusConfig.open;

    const handleStatusChange = async (newStatus: TicketStatus) => {
        setIsUpdating(true);
        try {
            const updated = await updateTicket(ticket.id, { status: newStatus });
            onUpdate(updated);
        } catch (err) {
            console.error("Failed to update status:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card className="group border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md hover:border-border transition-all duration-200">
            <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-3">
                    {/* Header row: title + time */}
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-1 flex-1">
                            {ticket.title}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {timeAgo(ticket.created_at)}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {ticket.description}
                    </p>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`text-xs font-medium ${cat.color}`}>
                            {cat.emoji} {ticket.category}
                        </Badge>
                        <Badge variant="outline" className={`text-xs font-medium ${pri.color}`}>
                            {pri.label}
                        </Badge>
                        <Badge variant="outline" className={`text-xs font-medium ${stat.color}`}>
                            {stat.label}
                        </Badge>
                    </div>

                    {/* Status change */}
                    <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-muted-foreground">Status:</span>
                        <Select
                            value={ticket.status}
                            onValueChange={(v) => handleStatusChange(v as TicketStatus)}
                            disabled={isUpdating}
                        >
                            <SelectTrigger className="h-7 w-[140px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        {isUpdating && (
                            <svg className="animate-spin h-3 w-3 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
