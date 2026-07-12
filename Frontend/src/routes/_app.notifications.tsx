import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Bell, Package, Wrench, CalendarClock, ClipboardCheck, Settings, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications · AssetFlow" }] }),
  component: NotificationsPage,
});

const iconMap = {
  Info: Package,
  Success: ClipboardCheck,
  Warning: CalendarClock,
  Error: Settings,
} as const;

function NotificationsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  // Queries
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data.data || [];
    },
  });

  // Mutations
  const markAllReadMutation = useMutation({
    mutationFn: async () => api.put("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("All notifications marked as read");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Notification deleted");
    },
  });

  const rawNotifications = notificationsData || [];
  const mapped = rawNotifications.map((n: any) => ({
    ...n,
    id: n._id,
    read: n.isRead,
  }));

  const filtered = mapped.filter((n: any) => {
    if (tab === "unread" && n.read) return false;
    if (tab === "read" && !n.read) return false;
    if (tab === "high" && n.type === "Error") return false; // Map error or high type
    if (q && !n.title.toLowerCase().includes(q.toLowerCase()) && !n.message.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Activity across your workspace, from asset lifecycle to audits."
        actions={
          <Button variant="outline" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
            Mark all as read
          </Button>
        }
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

        {isLoading ? (
          <div className="flex h-[30vh] items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ol className="divide-y">
            {filtered.length === 0 ? (
              <li className="p-12 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <div>No notifications</div>
              </li>
            ) : filtered.map((n: any) => {
              const Icon = iconMap[n.type as keyof typeof iconMap] || Package;
              return (
                <li key={n.id} 
                  onClick={() => !n.read && markReadMutation.mutate(n.id)}
                  className={cn(
                    "flex items-start gap-4 p-4 transition hover:bg-accent/40 cursor-pointer",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm truncate", !n.read ? "font-semibold" : "font-medium")}>{n.title}</span>
                      <StatusBadge status={n.type === "Error" ? "high" : "low"} />
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                    <div className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => {
                      e.stopPropagation();
                      deleteNotificationMutation.mutate(n.id);
                    }}>
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
