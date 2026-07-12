import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, ExternalLink, Zap } from "lucide-react";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({ meta: [{ title: "Billing · AssetFlow" }] }),
  component: BillingPage,
});

function BillingPage() {
  const invoices = [
    { id: "INV-2026-007", date: "Jul 1, 2026", amount: "$499.00", status: "Paid" },
    { id: "INV-2026-006", date: "Jun 1, 2026", amount: "$499.00", status: "Paid" },
    { id: "INV-2026-005", date: "May 1, 2026", amount: "$499.00", status: "Paid" },
    { id: "INV-2026-004", date: "Apr 1, 2026", amount: "$499.00", status: "Paid" },
  ];

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your enterprise plan, payment methods, and invoices."
      />

      <div className="grid gap-6 mt-6 md:grid-cols-3">
        {/* Current Plan */}
        <div className="md:col-span-2 rounded-2xl border bg-card card-elevated p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Enterprise Plan</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              You are currently on the Enterprise plan, which includes unlimited assets, advanced audit reporting, and priority 24/7 support.
            </p>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Billing Cycle</div>
                <div className="font-medium">Monthly</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Next Payment</div>
                <div className="font-medium">August 1, 2026</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Amount</div>
                <div className="font-medium">$499.00</div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <Button>Manage Subscription</Button>
            <Button variant="outline">Compare plans</Button>
          </div>
        </div>

        {/* Payment Method */}
        <div className="rounded-2xl border bg-card card-elevated p-6">
          <h3 className="text-base font-semibold mb-4">Payment Method</h3>
          <div className="rounded-lg border bg-secondary/30 p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-12 place-items-center rounded bg-background border">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">•••• •••• •••• 4242</div>
                <div className="text-xs text-muted-foreground">Expires 12/28</div>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full">Update payment method</Button>
        </div>
      </div>

      {/* Invoice History */}
      <div className="mt-6 rounded-2xl border bg-card card-elevated overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold">Invoice History</h3>
          <Button variant="ghost" size="sm" className="text-xs">
            <ExternalLink className="h-3 w-3 mr-2" />
            View all in Stripe
          </Button>
        </div>
        <div className="divide-y divide-border">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{inv.id}</div>
                  <div className="text-xs text-muted-foreground">{inv.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-sm font-medium">{inv.amount}</div>
                <div className="hidden sm:flex items-center text-xs font-medium text-success bg-success/10 px-2 py-1 rounded">
                  {inv.status}
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
