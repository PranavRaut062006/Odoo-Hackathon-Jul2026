import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notifications as data } from "@/lib/mock-data";
import { Search, Bell, Package, Wrench, CalendarClock, ClipboardCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications · AssetFlow" }] }),
  component: NotificationsPage,
});

const iconMap = {
  asset: Package,
  maintenance: Wrench,
  booking: CalendarClock,
  audit: ClipboardCheck,
  system: Settings,
} as const;

function NotificationsPage() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const filtered = data.filter(n => {
    if (tab === "unread" && n.read) return false;
    if (tab === "read" && !n.read) return false;
    if (tab === "high" && n.priority !== "high") return false;
    if (q && !n.title.toLowerCase().includes(q.toLowerCase()) && !n.message.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Activity across your workspace, from asset lifecycle to audits."
        actions={<Button variant="outline">Mark all as read</Button>}
      />

      <div className="rounded-2xl border bg-card card-elevated overflow-hidden">
        <div className="flex flex-col gap-3 p-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
              <TabsTrigger value="high">High priority</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notifications…" className="pl-9 h-9" />
          </div>
        </div>

        <ol className="divide-y">
          {filtered.length === 0 ? (
            <li className="p-12 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <div>No notifications</div>
            </li>
          ) : filtered.map(n => {
            const Icon = iconMap[n.type];
            return (
              <li key={n.id} className={cn(
                "flex items-start gap-4 p-4 transition hover:bg-accent/40",
                !n.read && "bg-primary/5",
              )}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm truncate", !n.read ? "font-semibold" : "font-medium")}>{n.title}</span>
                    <StatusBadge status={n.priority} />
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
