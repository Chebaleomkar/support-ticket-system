"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createTicket, classifyTicket } from "@/lib/api";
import type {
    Ticket,
    TicketCategory,
    TicketPriority,
    TicketCreatePayload,
} from "@/lib/types";

interface TicketFormProps {
    onTicketCreated: (ticket: Ticket) => void;
}

export default function TicketForm({ onTicketCreated }: TicketFormProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<TicketCategory>("general");
    const [priority, setPriority] = useState<TicketPriority>("medium");
    const [isClassifying, setIsClassifying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [classified, setClassified] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClassify = useCallback(async () => {
        if (!description.trim() || description.trim().length < 10) return;

        setIsClassifying(true);
        setError(null);

        try {
            const result = await classifyTicket(description);
            setCategory(result.suggested_category);
            setPriority(result.suggested_priority);
            setClassified(true);
        } catch (err) {
            console.error("Classification failed:", err);
            // Silently fail — user can still set manually
        } finally {
            setIsClassifying(false);
        }
    }, [description]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim() || !description.trim()) {
            setError("Title and description are required.");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload: TicketCreatePayload = {
                title: title.trim(),
                description: description.trim(),
                category,
                priority,
            };

            const newTicket = await createTicket(payload);
            onTicketCreated(newTicket);

            // Clear form on success
            setTitle("");
            setDescription("");
            setCategory("general");
            setPriority("medium");
            setClassified(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                    </span>
                    Submit a Ticket
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                            Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            placeholder="Brief summary of your issue..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={200}
                            required
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {title.length}/200
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">
                            Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your issue in detail..."
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                setClassified(false);
                            }}
                            rows={4}
                            required
                            className="resize-none transition-all focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* AI Classify Button */}
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClassify}
                            disabled={isClassifying || description.trim().length < 10}
                            className="gap-2 transition-all"
                        >
                            {isClassifying ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Classifying...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" /><circle cx="12" cy="15" r="2" /></svg>
                                    AI Auto-Classify
                                </>
                            )}
                        </Button>
                        {classified && (
                            <Badge variant="secondary" className="text-xs animate-in fade-in slide-in-from-left-2">
                                ✨ AI suggestions applied — feel free to override
                            </Badge>
                        )}
                    </div>

                    {/* Category & Priority row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-sm font-medium">
                                Category
                            </Label>
                            <Select
                                value={category}
                                onValueChange={(v) => setCategory(v as TicketCategory)}
                            >
                                <SelectTrigger id="category" className="transition-all">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="billing">💳 Billing</SelectItem>
                                    <SelectItem value="technical">🔧 Technical</SelectItem>
                                    <SelectItem value="account">👤 Account</SelectItem>
                                    <SelectItem value="general">📋 General</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority" className="text-sm font-medium">
                                Priority
                            </Label>
                            <Select
                                value={priority}
                                onValueChange={(v) => setPriority(v as TicketPriority)}
                            >
                                <SelectTrigger id="priority" className="transition-all">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">🟢 Low</SelectItem>
                                    <SelectItem value="medium">🟡 Medium</SelectItem>
                                    <SelectItem value="high">🟠 High</SelectItem>
                                    <SelectItem value="critical">🔴 Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={isSubmitting || !title.trim() || !description.trim()}
                        className="w-full font-medium transition-all"
                        size="lg"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Submitting...
                            </span>
                        ) : (
                            "Submit Ticket"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
