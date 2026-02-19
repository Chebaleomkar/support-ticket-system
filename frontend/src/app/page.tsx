"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketForm from "@/components/ticket-form";
import TicketList from "@/components/ticket-list";
import StatsDashboard from "@/components/stats-dashboard";
import type { Ticket } from "@/lib/types";

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setRefreshKey((k) => k + 1); // Trigger stats & list refresh
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              ST
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Support Tickets
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                AI-powered ticket management system
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Powered by Groq LLaMA 3.3
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tickets" className="gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 15h0M2 9.5h20" /></svg>
              Tickets
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg>
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Form — left column */}
              <div className="lg:col-span-2">
                <TicketForm onTicketCreated={handleTicketCreated} />
              </div>

              {/* List — right column */}
              <div className="lg:col-span-3">
                <TicketList
                  tickets={tickets}
                  setTickets={setTickets}
                  refreshKey={refreshKey}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <StatsDashboard refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
