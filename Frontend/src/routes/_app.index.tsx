import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Package,
  CheckCircle2,
  Wrench,
  CalendarCheck,
  ArrowRightLeft,
  AlertTriangle,
  Plus,
  CalendarPlus,
  Boxes,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Dashboard · AssetFlow" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  // Fetch Dashboard Metrics
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await api.get("/dashboard");
      return response.data.data;
    },
  });

  // Fetch Notifications
  const { data: notificationsData, isLoading: isNotificationsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notifications");
      return response.data.data;
    },
  });

  if (isDashboardLoading || isNotificationsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const k = dashboardData?.kpis || {
    availableAssets: 0,
    allocatedAssets: 0,
    assetsUnderMaintenance: 0,
    activeAllocations: 0,
    pendingTransfers: 0,
    upcomingReturns: 0,
    overdueReturns: 0,
    totalAssets: 0,
    totalEmployees: 0,
    totalDepartments: 0,
  };

  const statusMap: Record<string, string> = {
    "Available": "var(--success)",
    "Allocated": "var(--primary)",
    "Under Maintenance": "var(--warning)",
    "Disposed": "var(--danger)",
    "Reserved": "var(--info)",
  };

  const statusData = (dashboardData?.charts?.assetsByStatus || []).map((s: any) => ({
    name: s.status,
    value: s.count,
    color: statusMap[s.status] || "var(--primary)",
  }));

  const categoryData = (dashboardData?.charts?.assetsByCategory || []).map((c: any) => ({
    name: c.category,
    value: c.count,
  }));

  const trend = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    allocations: 8 + Math.round(Math.sin(i / 2) * 6 + i / 1.5),
  }));

  const recentActivities = dashboardData?.recentActivities || [];
  const recentNotifications = (notificationsData || []).slice(0, 4);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name ? user.name.split(" ")[0] : "User"}`}
        description="Here's what's happening across your asset portfolio today."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/booking">
                <CalendarPlus className="h-4 w-4" /> Book resource
              </Link>
            </Button>
            <Button asChild>
              <Link to="/assets">
                <Plus className="h-4 w-4" /> Register asset
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assets Available" value={k.availableAssets} icon={CheckCircle2} tone="success" />
        <StatCard label="Assets Allocated" value={k.allocatedAssets} icon={Package} tone="default" />
        <StatCard label="Under Maintenance" value={k.assetsUnderMaintenance} icon={Wrench} tone="warning" />
        <StatCard label="Pending Transfers" value={k.pendingTransfers} icon={ArrowRightLeft} tone="info" hint="Awaiting approval" />
        <StatCard label="Upcoming Returns" value={k.upcomingReturns} icon={Boxes} tone="default" hint="Next 7 days" />
        <StatCard label="Overdue Assets" value={k.overdueReturns} icon={AlertTriangle} tone="danger" hint="Escalate to owner" />
        <StatCard label="Total Inventory" value={k.totalAssets} icon={Package} tone="default" hint={`Across ${k.totalDepartments} departments`} />
        <StatCard label="Total Employees" value={k.totalEmployees} icon={Users} tone="default" hint="Active team members" />
      </div>

      <div className="mt-6 grid gap-4 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border bg-card card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Monthly allocation trend</h3>
              <p className="text-xs text-muted-foreground">Assets allocated per month</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="allocations" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card card-elevated p-5">
          <h3 className="font-semibold">Status distribution</h3>
          <p className="text-xs text-muted-foreground">Current asset status</p>
          <div className="h-52 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((s: any, i: number) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {statusData.map((s: any) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.name}</span>
                <span className="ml-auto font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border bg-card card-elevated p-5">
          <h3 className="font-semibold">Assets by category</h3>
          <p className="text-xs text-muted-foreground">Inventory distribution</p>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card card-elevated p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent activity</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/audit">View all</Link></Button>
          </div>
          <div className="space-y-3">
            {recentActivities.map((e: any) => (
              <div key={e._id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/9.x/notionists/svg?seed=${e.user?.name || "System"}`} />
                  <AvatarFallback>{e.user?.name?.slice(0,2) || "SY"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-sm">
                  <div className="truncate">
                    <span className="font-medium">{e.user?.name || "System"}</span>{" "}
                    <span className="text-muted-foreground">{e.action}</span>{" "}
                    <span className="font-medium text-primary">{e.target}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-card card-elevated p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent notifications</h3>
          <Button asChild variant="ghost" size="sm"><Link to="/notifications">Notification center</Link></Button>
        </div>
        <div className="divide-y">
          {recentNotifications.map((n: any) => (
            <div key={n._id} className="py-3 flex items-start gap-3">
              <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-muted" : "bg-primary"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{n.title}</span>
                  <StatusBadge status={n.type === "Error" ? "high" : "low"} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              </div>
              <div className="text-[11px] text-muted-foreground shrink-0">
                {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
          {recentNotifications.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">No notifications</div>
          )}
        </div>
      </div>
    </div>
  );
}
