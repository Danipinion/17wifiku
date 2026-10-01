import { Suspense } from "react";
import { CreateTicketForm } from "@/components/modules/support/create-ticket-form";
import { WhatsAppButton } from "@/components/modules/support/whatsapp-button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Support - Nionify",
  description: "Get help and track your tickets.",
};

async function TicketList() {
  const session = await getSession();
  if (!session.userId) return null;

  const userTickets = await db.query.tickets.findMany({
    where: eq(tickets.userId, session.userId),
    orderBy: [desc(tickets.createdAt)],
    limit: 5, // Last 5 tickets
  });

  if (userTickets.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-muted/20">
        <CardContent className="pt-6 text-center text-muted-foreground">
          No tickets found. Need help? Create one above.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {userTickets.map((ticket) => (
        <Card key={ticket.id} className="border-none shadow-sm overflow-hidden">
          <CardHeader className="p-4 bg-muted/30">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm font-medium line-clamp-1">
                  {ticket.subject}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(ticket.createdAt)}
                </p>
              </div>
              <Badge
                variant={ticket.status === "open" ? "default" : "secondary"}
              >
                {ticket.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 text-sm text-balance">
            {ticket.message}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
        <p className="text-muted-foreground">We are here to help you 24/7.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Form */}
        <CreateTicketForm />

        {/* Recent Tickets */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Tickets</h2>
          <Suspense
            fallback={
              <div className="h-20 bg-muted animate-pulse rounded-lg" />
            }
          >
            <TicketList />
          </Suspense>
        </div>
      </div>

      <WhatsAppButton />
    </div>
  );
}
