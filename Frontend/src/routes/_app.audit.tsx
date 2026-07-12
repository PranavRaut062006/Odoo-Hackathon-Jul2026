import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DataTable, type Column } from "@/components/common/DataTable";
import { departments, employees, assets } from "@/lib/mock-data";
import { ClipboardCheck, Plus, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "Audit · AssetFlow" }] }),
  component: AuditPage,
});

interface VerifyRow { id: string; tag: string; name: string; department: string; assignedTo: string; status: "verified" | "missing" | "damaged" | "pending"; }

function AuditPage() {
  const cycles = [
    { id: "Q4-2025", name: "Q4 2025 Audit", scope: "All departments", progress: 64, auditors: 4, discrepancies: 5, status: "in-progress" },
    { id: "Q3-2025", name: "Q3 2025 Audit", scope: "Engineering & Ops", progress: 100, auditors: 3, discrepancies: 2, status: "completed" },
    { id: "Q2-2025", name: "Q2 2025 Audit", scope: "All departments", progress: 100, auditors: 5, discrepancies: 8, status: "completed" },
  ];

  const rows: VerifyRow[] = assets.slice(0, 15).map((a, i) => ({
    id: a.id,
    tag: a.tag,
    name: a.name,
    department: a.department,
    assignedTo: a.assignedTo ?? "—",
    status: (["verified","verified","pending","missing","damaged"] as const)[i % 5],
  }));

  const cols: Column<VerifyRow>[] = [
    { key: "tag", header: "Tag", render: (r) => <span className="font-mono text-primary">{r.tag}</span> },
    { key: "name", header: "Asset" },
    { key: "department", header: "Department" },
    { key: "assignedTo", header: "Owner" },
    { key: "status", header: "Verification", render: (r) => <StatusBadge status={r.status} /> },
    { key: "action", header: "", render: () => <Button variant="ghost" size="sm">Verify</Button> },
  ];

  return (
    <div>
      <PageHeader
        title="Audit"
        description="Run audit cycles, verify assets, and resolve discrepancies."
        actions={<Button><Plus className="h-4 w-4" /> New audit cycle</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {cycles.map(c => (
          <div key={c.id} className="rounded-2xl border bg-card card-elevated p-5">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck className="h-5 w-5" /></div>
              <StatusBadge status={c.status} />
            </div>
            <div className="mt-3 font-semibold">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.scope}</div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted-foreground">Progress</span><span className="font-medium">{c.progress}%</span></div>
              <Progress value={c.progress} />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <div className="flex -space-x-2">
                {employees.slice(0, c.auditors).map(e => (
                  <Avatar key={e.id} className="h-6 w-6 ring-2 ring-card"><AvatarImage src={e.avatar}/><AvatarFallback>{e.name.slice(0,2)}</AvatarFallback></Avatar>
                ))}
              </div>
              <div className="text-destructive font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" />{c.discrepancies} discrepancies</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <h3 className="font-semibold mb-3">Verification queue — Q4 2025</h3>
          <DataTable data={rows} columns={cols} searchKeys={["tag","name","department"]} pageSize={6}
            toolbar={
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-success/10 text-success">{rows.filter(r=>r.status==="verified").length} verified</span>
                <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive">{rows.filter(r=>r.status==="missing").length} missing</span>
                <span className="px-2 py-1 rounded-full bg-warning/15 text-warning-foreground">{rows.filter(r=>r.status==="damaged").length} damaged</span>
              </div>
            }
          />
        </div>

        <div className="rounded-2xl border bg-card card-elevated p-5">
          <h3 className="font-semibold">Discrepancy report</h3>
          <p className="text-xs text-muted-foreground">Items requiring investigation</p>
          <div className="mt-4 space-y-3">
            {departments.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between">
                <div className="text-sm">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-destructive font-medium">{(d.employeeCount % 3) + 1}</span> discrepancies
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">Download full report</Button>
        </div>
      </div>
    </div>
  );
}
