import { Suspense } from "react";
import { getInvoices } from "@/actions/billing";
import { InvoiceList } from "@/components/modules/billing/invoice-list";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Billing - Nionify",
  description: "Manage your invoices and payments.",
};

export default async function BillsPage() {
  const invoices = await getInvoices();

  // Convert decimal string to number/string as needed by component, actually DB returns string for decimal
  // Drizzle returns decimal as string.
  // We need to cast types properly if needed or updated component.
  // invoice.amount is string in schema, component expects string. Perfect.
  // invoice.createdAt is Date. Component expects Date. Perfect.

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Bills</h1>
        <p className="text-muted-foreground">
          Manage invoices and payment history.
        </p>
      </div>

      <Suspense fallback={<BillingSkeleton />}>
        <InvoiceList invoices={invoices} />
      </Suspense>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-48 rounded-xl border bg-card text-card-foreground shadow-sm animate-pulse"
        />
      ))}
    </div>
  );
}
