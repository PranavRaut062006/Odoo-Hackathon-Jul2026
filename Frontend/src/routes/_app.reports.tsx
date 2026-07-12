import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports · AssetFlow" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  // Queries
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard-reports"],
    queryFn: async () => {
      const res = await api.get("/dashboard");
      return res.data.data;
    },
  });

  const { data: departmentsData, isLoading: deptsLoading } = useQuery({
    queryKey: ["departments-reports-list"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data.data.departments || [];
    },
  });

  const { data: categoriesData, isLoading: catsLoading } = useQuery({
    queryKey: ["categories-reports-list"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data.data.categories || [];
    },
  });

  const { data: maintenanceData, isLoading: maintLoading } = useQuery({
    queryKey: ["maintenance-reports-list"],
    queryFn: async () => {
      const res = await api.get("/maintenance");
      return res.data.data.maintenanceRequests || [];
    },
  });

  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ["assets-reports-list"],
    queryFn: async () => {
      const res = await api.get("/assets", { params: { limit: 100 } });
      return res.data.data.assets || [];
    },
  });

  if (dashboardLoading || deptsLoading || catsLoading || maintLoading || assetsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeAssets = assetsData || [];
  const activeDepts = departmentsData || [];
  const activeCats = categoriesData || [];
  const activeMaint = maintenanceData || [];

  const deptData = activeDepts.map((d: any) => ({
    name: d.code,
    assets: activeAssets.filter((a: any) => a.department?._id === d._id).length,
    allocated: activeAssets.filter((a: any) => a.department?._id === d._id && a.status === "Allocated").length,
  }));

  const utilData = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    utilization: 55 + Math.round(Math.sin(i / 2) * 15 + i),
  }));

  const priorities = ["Low", "Medium", "High", "Critical"];
  const priorityColors: Record<string, string> = {
    Low: "var(--muted-foreground)",
    Medium: "var(--info)",
    High: "var(--warning)",
    Critical: "var(--destructive)",
  };

  const maintData = priorities.map(p => ({
    name: p,
    value: activeMaint.filter((m: any) => m.priority === p).length,
    color: priorityColors[p],
  }));

  const heat = Array.from({ length: 7 }, (_, d) => Array.from({ length: 10 }, (_, h) => Math.round(Math.random() * 8)));

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Analytics across your asset portfolio, utilization, and maintenance."
        actions={<>
          <Button variant="outline" onClick={() => toast.success("CSV exported")}><Download className="h-4 w-4" /> CSV</Button>
          <Button onClick={() => toast.success("PDF exported")}><FileText className="h-4 w-4" /> PDF</Button>
        </>}
      />

      <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border bg-card card-elevated p-5">
          <h3 className="font-semibold">Department summary</h3>
          <p className="text-xs text-muted-foreground">Assets by department</p>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="assets" fill="var(--primary)" radius={[6,6,0,0]} />
                <Bar dataKey="allocated" fill="var(--info)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card card-elevated p-5">
          <h3 className="font-semibold">Maintenance frequency</h3>
          <p className="text-xs text-muted-foreground">By priority</p>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={maintData} innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                  {maintData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {maintData.map(m => (
              <div key={m.name} className="flex items-center gap-2 capitalize">
                <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                <span className="text-muted-foreground">{m.name}</span>
                <span className="ml-auto font-semibold">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 grid-cols-1 xl:grid-cols-2">
        <div className="rounded-2xl border bg-card card-elevated p-5">
          <h3 className="font-semibold">Asset utilization trend</h3>
          <p className="text-xs text-muted-foreground">Monthly utilization %</p>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={utilData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="utilization" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card card-elevated p-5">
          <h3 className="font-semibold">Booking heatmap</h3>
          <p className="text-xs text-muted-foreground">Bookings by day and hour</p>
          <div className="mt-4 overflow-x-auto">
            <div className="grid" style={{ gridTemplateColumns: "40px repeat(10, minmax(28px, 1fr))" }}>
              <div />
              {Array.from({ length: 10 }, (_, h) => (
                <div key={h} className="text-[10px] text-muted-foreground text-center">{h+8}</div>
              ))}
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, di) => (
                <div key={d} className="contents">
                  <div className="text-[10px] text-muted-foreground pr-1">{d}</div>
                  {heat[di].map((v, hi) => (
                    <div key={`${di}-${hi}`} className="h-6 m-0.5 rounded"
                      style={{ background: `color-mix(in oklab, var(--primary) ${v * 12}%, transparent)` }}
                      title={`${v} bookings`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-card card-elevated p-5">
        <h3 className="font-semibold mb-3">Category breakdown</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {activeCats.map((c: any) => {
            const count = activeAssets.filter((a: any) => a.category?._id === c._id).length;
            const pct = activeAssets.length > 0 ? Math.round((count / activeAssets.length) * 100) : 0;
            return (
              <div key={c._id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs font-semibold">{count}</div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{pct}% of inventory</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
