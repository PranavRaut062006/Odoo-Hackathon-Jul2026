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
import { kpis, categories, assets, activity, notifications } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Dashboard · AssetFlow" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const k = kpis();

  const categoryData = categories.map((c) => ({
    name: c.name,
    value: assets.filter((a) => a.category === c.name).length,
  }));
  const statusData = [
    { name: "Available", value: k.available, color: "var(--success)" },
    { name: "Allocated", value: k.allocated, color: "var(--primary)" },
    { name: "Maintenance", value: k.maintenance, color: "var(--warning)" },
    { name: "Reserved", value: k.reserved, color: "var(--info)" },
  ];
  const trend = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    allocations: 8 + Math.round(Math.sin(i / 2) * 6 + i / 1.5),
  }));

  return (
    <div>
      <PageHeader
        title="Welcome back, Rushikesh"
        description="Here's what's happening across your asset portfolio today."
        actions={
          <>
            <Button variant="outline"><CalendarPlus className="h-4 w-4" /> Book resource</Button>
            <Button><Plus className="h-4 w-4" /> Register asset</Button>
          </>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assets Available" value={k.available} change={4} icon={CheckCircle2} tone="success" />
        <StatCard label="Assets Allocated" value={k.allocated} change={8} icon={Package} tone="default" />
        <StatCard label="Under Maintenance" value={k.maintenance} change={-2} icon={Wrench} tone="warning" />
        <StatCard label="Active Bookings" value={k.activeBookings} change={12} icon={CalendarCheck} tone="info" />
        <StatCard label="Pending Transfers" value={k.pendingTransfers} icon={ArrowRightLeft} tone="info" hint="Awaiting approval" />
        <StatCard label="Upcoming Returns" value={7} icon={Boxes} tone="default" hint="Next 14 days" />
        <StatCard label="Overdue Assets" value={k.overdue} change={-1} icon={AlertTriangle} tone="danger" hint="Escalate to owner" />
        <StatCard label="Total Inventory" value={k.total} icon={Package} tone="default" hint="Across 10 departments" />
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
                  {statusData.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {statusData.map((s) => (
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
            <Button asChild variant="ghost" size="sm"><Link to="/notifications">View all</Link></Button>
          </div>
          <div className="space-y-3">
            {activity.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/9.x/notionists/svg?seed=${e.actor}`} />
                  <AvatarFallback>{e.actor.slice(0,2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-sm">
                  <div className="truncate">
                    <span className="font-medium">{e.actor}</span>{" "}
                    <span className="text-muted-foreground">{e.action}</span>{" "}
                    <span className="font-medium text-primary">{e.target}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(e.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-card card-elevated p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent notifications</h3>
          <Button asChild variant="ghost" size="sm"><Link to="/notifications">Notification center</Link></Button>
        </div>
        <div className="divide-y">
          {notifications.slice(0, 4).map((n) => (
            <div key={n.id} className="py-3 flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{n.title}</span>
                  <StatusBadge status={n.priority} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              </div>
              <div className="text-[11px] text-muted-foreground shrink-0">
                {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
