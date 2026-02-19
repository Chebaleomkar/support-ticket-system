"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchStats, fetchTickets } from "@/lib/api";
import type { TicketStats, Ticket } from "@/lib/types";

interface StatsDashboardProps {
  refreshKey: number;
}

/* ───────────────────────── SVG Donut Chart ───────────────────────── */
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function DonutChart({
  segments,
  size = 180,
  strokeWidth = 22,
  label,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted/30"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map((seg, i) => {
            const pct = seg.value / total;
            const segLen = pct * circumference;
            const offset = cumulativeOffset;
            cumulativeOffset += segLen;
            return (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  animationDelay: `${i * 120}ms`,
                  filter: `drop-shadow(0 0 6px ${seg.color}40)`,
                }}
              />
            );
          })}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums">{total}</span>
          {label && (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              {label}
            </span>
          )}
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="capitalize text-muted-foreground">{seg.label}</span>
            <span className="font-semibold tabular-nums">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Stat Card ───────────────────────── */
function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  delay = "0ms",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  delay?: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
      style={{ animationDelay: delay }}
    >
      {/* Gradient border */}
      <div className={`absolute inset-0 rounded-2xl ${gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
      {/* Card body */}
      <div className="relative rounded-2xl bg-background/90 backdrop-blur-xl p-5 sm:p-6 h-full">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-4xl font-extrabold tabular-nums tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div
            className={`flex items-center justify-center w-11 h-11 rounded-xl ${gradient} text-white shadow-lg`}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Progress Bar (enhanced) ───────────────────────── */
function EnhancedBar({
  label,
  value,
  total,
  color,
  emoji,
  delay,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  emoji: string;
  delay: number;
}) {
  const pct = total > 0 ? Math.max((value / total) * 100, 3) : 0;
  return (
    <div
      className="group flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/30 transition-all duration-300 cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-base w-6 text-center">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium capitalize">{label}</span>
          <span className="text-sm font-bold tabular-nums">{value}</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}, ${color}cc)`,
              boxShadow: `0 0 12px ${color}40`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Activity Item ───────────────────────── */
function ActivityItem({ ticket }: { ticket: Ticket }) {
  const statusColors: Record<string, string> = {
    open: "bg-sky-500",
    in_progress: "bg-indigo-500",
    resolved: "bg-emerald-500",
    closed: "bg-gray-400",
  };

  const priorityEmoji: Record<string, string> = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    critical: "🔴",
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000
    );
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="flex items-start gap-3 py-3 group">
      <div className="relative mt-1">
        <div
          className={`w-2.5 h-2.5 rounded-full ${statusColors[ticket.status] || "bg-gray-400"} ring-4 ring-background`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {ticket.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
          <span>{priorityEmoji[ticket.priority]} {ticket.priority}</span>
          <span>·</span>
          <span className="capitalize">{ticket.category}</span>
          <span>·</span>
          <span>{timeAgo(ticket.created_at)}</span>
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── Main Dashboard ───────────────────────── */
export default function StatsDashboard({ refreshKey }: StatsDashboardProps) {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsData, ticketsData] = await Promise.all([
        fetchStats(),
        fetchTickets(),
      ]);
      setStats(statsData);
      setRecentTickets(ticketsData.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  /* Loading skeleton */
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/40" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 rounded-2xl bg-muted/40" />
          <div className="h-80 rounded-2xl bg-muted/40" />
          <div className="h-80 rounded-2xl bg-muted/40" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const resolvedCount =
    stats.total_tickets - stats.open_tickets;
  const resolutionRate =
    stats.total_tickets > 0
      ? Math.round((resolvedCount / stats.total_tickets) * 100)
      : 0;

  /* Donut segment configs */
  const prioritySegments: DonutSegment[] = [
    { label: "Low", value: stats.priority_breakdown.low, color: "#10b981" },
    { label: "Medium", value: stats.priority_breakdown.medium, color: "#f59e0b" },
    { label: "High", value: stats.priority_breakdown.high, color: "#f97316" },
    { label: "Critical", value: stats.priority_breakdown.critical, color: "#ef4444" },
  ];

  const categorySegments: DonutSegment[] = [
    { label: "Billing", value: stats.category_breakdown.billing, color: "#3b82f6" },
    { label: "Technical", value: stats.category_breakdown.technical, color: "#8b5cf6" },
    { label: "Account", value: stats.category_breakdown.account, color: "#f59e0b" },
    { label: "General", value: stats.category_breakdown.general, color: "#6b7280" },
  ];

  return (
    <div className="space-y-8">
      {/* ─── Hero Stats Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={stats.total_tickets}
          subtitle="All time submissions"
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15h0M2 9.5h20" /></svg>
          }
        />
        <StatCard
          title="Open Tickets"
          value={stats.open_tickets}
          subtitle="Awaiting resolution"
          gradient="bg-gradient-to-br from-sky-500 to-blue-600"
          delay="80ms"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          }
        />
        <StatCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          subtitle={`${resolvedCount} resolved`}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
          delay="160ms"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          }
        />
        <StatCard
          title="Avg / Day"
          value={stats.avg_tickets_per_day}
          subtitle="Tickets per day"
          gradient="bg-gradient-to-br from-orange-500 to-amber-600"
          delay="240ms"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg>
          }
        />
      </div>

      {/* ─── Charts + Activity Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Donut */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-red-500" />
            Priority Breakdown
          </h3>
          <DonutChart segments={prioritySegments} label="Total" />
          {/* Detail bars below donut */}
          <div className="mt-6 space-y-0.5">
            <EnhancedBar label="Low" value={stats.priority_breakdown.low} total={stats.total_tickets} color="#10b981" emoji="🟢" delay={0} />
            <EnhancedBar label="Medium" value={stats.priority_breakdown.medium} total={stats.total_tickets} color="#f59e0b" emoji="🟡" delay={80} />
            <EnhancedBar label="High" value={stats.priority_breakdown.high} total={stats.total_tickets} color="#f97316" emoji="🟠" delay={160} />
            <EnhancedBar label="Critical" value={stats.priority_breakdown.critical} total={stats.total_tickets} color="#ef4444" emoji="🔴" delay={240} />
          </div>
        </div>

        {/* Category Donut */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-blue-500 to-amber-500" />
            Category Breakdown
          </h3>
          <DonutChart segments={categorySegments} label="Total" />
          {/* Detail bars below donut */}
          <div className="mt-6 space-y-0.5">
            <EnhancedBar label="Billing" value={stats.category_breakdown.billing} total={stats.total_tickets} color="#3b82f6" emoji="💳" delay={0} />
            <EnhancedBar label="Technical" value={stats.category_breakdown.technical} total={stats.total_tickets} color="#8b5cf6" emoji="🔧" delay={80} />
            <EnhancedBar label="Account" value={stats.category_breakdown.account} total={stats.total_tickets} color="#f59e0b" emoji="👤" delay={160} />
            <EnhancedBar label="General" value={stats.category_breakdown.general} total={stats.total_tickets} color="#6b7280" emoji="📋" delay={240} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500" />
            Recent Activity
          </h3>
          {recentTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15h0M2 9.5h20" /></svg>
              <p className="text-sm">No tickets yet</p>
              <p className="text-xs mt-1">Submit your first ticket!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentTickets.map((ticket) => (
                <ActivityItem key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}

          {/* Quick summary footer */}
          {stats.total_tickets > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2.5 rounded-xl bg-muted/30">
                  <p className="text-lg font-bold tabular-nums text-sky-500">
                    {stats.open_tickets}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Open
                  </p>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-muted/30">
                  <p className="text-lg font-bold tabular-nums text-emerald-500">
                    {resolvedCount}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Resolved
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
