import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ArrowRightLeft, Check } from "lucide-react";
import { assets, employees, transfers } from "@/lib/mock-data";
import type { Transfer } from "@/lib/types";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_app/allocation")({
  head: () => ({ meta: [{ title: "Allocation & Transfer · AssetFlow" }] }),
  component: AllocationPage,
});

function AllocationPage() {
  const [assetId, setAssetId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const selectedAsset = assets.find(a => a.id === assetId);
  const conflict = selectedAsset?.status === "allocated";
  const currentOwner = selectedAsset?.assignedTo;

  const cols: Column<Transfer>[] = [
    { key: "assetTag", header: "Asset", render: (t) => <span className="font-mono text-primary">{t.assetTag}</span> },
    { key: "asset", header: "Item" },
    { key: "fromEmployee", header: "From" },
    { key: "toEmployee", header: "To" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    { key: "createdAt", header: "Requested" },
  ];

  return (
    <div>
      <PageHeader
        title="Allocation & Transfer"
        description="Assign assets to employees or request a transfer between owners."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card card-elevated p-6">
          <h3 className="font-semibold mb-4">New allocation</h3>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Asset</Label>
                <Select value={assetId} onValueChange={setAssetId}>
                  <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                  <SelectContent>{assets.slice(0, 20).map(a => <SelectItem key={a.id} value={a.id}>{a.tag} — {a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Employee</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} · {e.department}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Expected return date</Label><Input type="date" /></div>
              <div className="grid gap-2"><Label>Condition on handover</Label>
                <Select defaultValue="excellent"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["excellent","good","fair","poor"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid gap-2"><Label>Condition notes</Label><Textarea rows={3} placeholder="Serial verified, charger and case included…" /></div>

            {conflict && selectedAsset && (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-warning/20 text-warning-foreground shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">Asset is already allocated</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-mono">{selectedAsset.tag}</span> is currently assigned to{" "}
                      <span className="font-medium text-foreground">{currentOwner}</span>. You can raise a transfer request instead.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm"><ArrowRightLeft className="h-4 w-4" /> Request transfer</Button>
                      <Button size="sm" variant="outline">View current allocation</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost">Cancel</Button>
              <Button disabled={conflict || !assetId || !employeeId} onClick={() => toast.success("Asset allocated")}>
                <Check className="h-4 w-4" /> Allocate asset
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card card-elevated p-6">
          <h3 className="font-semibold mb-4">Approval timeline</h3>
          <ol className="relative border-l border-border ml-3 space-y-6">
            {[
              { label: "Request submitted", by: "Amelia Chen", done: true },
              { label: "Manager approval", by: "Marcus Reyes", done: true },
              { label: "IT verification", by: "Ravi Kapoor", done: false },
              { label: "Asset handover", by: "—", done: false },
            ].map((s, i) => (
              <li key={i} className="ml-6">
                <span className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full ring-4 ring-background ${s.done ? "bg-success" : "bg-muted"}`} />
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.by}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Transfer requests</h3>
        <DataTable data={transfers} columns={cols} searchKeys={["asset","assetTag","fromEmployee","toEmployee"]}
          toolbar={
            <div className="flex items-center gap-2">
              {employees.slice(0,4).map(e => <Avatar key={e.id} className="h-7 w-7 ring-2 ring-background -ml-2 first:ml-0"><AvatarImage src={e.avatar}/><AvatarFallback>{e.name.slice(0,2)}</AvatarFallback></Avatar>)}
              <span className="text-xs text-muted-foreground ml-1">Awaiting approvers</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
