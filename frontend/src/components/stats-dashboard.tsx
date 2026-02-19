"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchStats } from "@/lib/api";
import type { TicketStats } from "@/lib/types";

interface StatsDashboardProps {
    refreshKey: number;
}

const priorityColors: Record<string, string> = {
    low: "bg-emerald-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
};

const categoryColors: Record<string, string> = {
    billing: "bg-blue-500",
    technical: "bg-purple-500",
    account: "bg-amber-500",
    general: "bg-gray-400",
};

function BarChart({
    data,
    colorMap,
}: {
    data: Record<string, number>;
    colorMap: Record<string, string>;
}) {
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;

    return (
        <div className="space-y-2.5">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="capitalize text-muted-foreground font-medium">{key}</span>
                        <span className="tabular-nums font-semibold">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <div
                            className={`h-full rounded-full ${colorMap[key] || "bg-primary"} transition-all duration-700 ease-out`}
                            style={{ width: `${Math.max((value / total) * 100, 2)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function StatsDashboard({ refreshKey }: StatsDashboardProps) {
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadStats = useCallback(async () => {
        try {
            const data = await fetchStats();
            setStats(data);
        } catch (err) {
            console.error("Failed to load stats:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats, refreshKey]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="border-border/50">
                        <CardContent className="p-4">
                            <div className="h-16 bg-muted/50 animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-4">
            {/* Top-level stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-4 sm:p-5">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            Total Tickets
                        </p>
                        <p className="text-3xl font-bold mt-1 tabular-nums">
                            {stats.total_tickets}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-4 sm:p-5">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            Open
                        </p>
                        <p className="text-3xl font-bold mt-1 tabular-nums text-sky-500">
                            {stats.open_tickets}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/80 backdrop-blur-sm col-span-2 lg:col-span-1">
                    <CardContent className="p-4 sm:p-5">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            Avg / Day
                        </p>
                        <p className="text-3xl font-bold mt-1 tabular-nums">
                            {stats.avg_tickets_per_day}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Breakdown charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Priority Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <BarChart data={stats.priority_breakdown} colorMap={priorityColors} />
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Category Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <BarChart data={stats.category_breakdown} colorMap={categoryColors} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
