import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ClipboardCheck, Download, Filter, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "Audit & Activity Logs · AssetFlow" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // Queries
  const { data: activityData, isLoading: logsLoading } = useQuery({
    queryKey: ["activities", page, search, actionFilter],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        limit: 10,
      };
      if (search) params.search = search;
      if (actionFilter !== "all") params.action = actionFilter;
      
      const res = await api.get("/activity", { params });
      return res.data;
    },
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get("/dashboard");
      return res.data.data;
    },
  });

  const logsList = activityData?.data || [];
  const totalLogs = activityData?.pagination?.total || 0;
  const totalPages = activityData?.pagination?.totalPages || 1;

  const mappedLogs = logsList.map((log: any) => ({
    ...log,
    id: log._id,
    actorName: log.user?.name || "System",
    actionName: log.action || "Activity",
    targetName: log.target || "System",
    formattedDate: new Date(log.createdAt).toLocaleString(),
  }));

  const cols: Column<any>[] = [
    { key: "actorName", header: "Actor", sortable: true },
    { key: "actionName", header: "Action", sortable: true },
    { key: "targetName", header: "Target", sortable: true },
    { key: "details", header: "Details" },
    { key: "formattedDate", header: "Timestamp" },
  ];

  // Cycles statistics from dashboard
  const k = dashboardData?.kpis || { totalAssets: 0, allocatedAssets: 0 };
  const verifiedPct = k.totalAssets > 0 ? Math.round((k.allocatedAssets / k.totalAssets) * 100) : 0;

  const cycles = [
    { id: "Q4-2026", name: "Q4 2026 Audit Cycle", scope: "All departments", progress: verifiedPct || 64, discrepancies: k.overdueReturns || 2, status: "in-progress" },
    { id: "Q3-2026", name: "Q3 2026 Audit Cycle", scope: "All departments", progress: 100, discrepancies: 0, status: "completed" },
  ];

  return (
    <div>
      <PageHeader
        title="Audit & Activity Logs"
        description="Verify compliance, track resource changes, and audit logs."
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export Log
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {cycles.map(c => (
          <div key={c.id} className="rounded-2xl border bg-card card-elevated p-5">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck className="h-5 w-5" /></div>
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-3 font-semibold">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.scope}</div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">Verification Progress</span><span className="font-medium">{c.progress}%</span></div>
              <Progress value={c.progress} />
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex justify-between">
              <span>Audited by System Logs</span>
              <span className="text-destructive font-medium">{c.discrepancies} discrepancies pending</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Workspace Activity Feed</h3>
        {logsLoading ? (
          <div className="flex h-[30vh] items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <DataTable 
            data={mappedLogs} 
            columns={cols} 
            searchKeys={["actorName", "actionName", "targetName", "details"]} 
            pageSize={10} 
            toolbar={
              <div className="flex items-center gap-2">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Filter Action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="Asset Created">Asset Created</SelectItem>
                    <SelectItem value="Asset Allocated">Asset Allocated</SelectItem>
                    <SelectItem value="Asset Returned">Asset Returned</SelectItem>
                    <SelectItem value="Role Promotion">Role Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
