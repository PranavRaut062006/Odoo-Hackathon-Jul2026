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
import { AlertTriangle, ArrowRightLeft, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_app/allocation")({
  head: () => ({ meta: [{ title: "Allocation & Transfer · AssetFlow" }] }),
  component: AllocationPage,
});

function AllocationPage() {
  const queryClient = useQueryClient();
  const [assetId, setAssetId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [handoverCondition, setHandoverCondition] = useState("Good");

  // Transfer state
  const [transferReason, setTransferReason] = useState("");

  // Queries
  const { data: assetsData } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets", { params: { limit: 100 } });
      return res.data.data.assets || [];
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data.employees || [];
    },
  });

  const { data: transfersData, isLoading: transfersLoading } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const res = await api.get("/transfers");
      return res.data.data.transfers || [];
    },
  });

  // Find active allocation for selected asset if it is allocated
  const selectedAsset = (assetsData || []).find((a: any) => a._id === assetId);
  const conflict = selectedAsset?.status === "Allocated";

  const { data: activeAllocations } = useQuery({
    queryKey: ["asset-allocation-active", assetId],
    queryFn: async () => {
      if (!assetId || !conflict) return null;
      const res = await api.get(`/allocations`, { params: { asset: assetId, status: "Active" } });
      return res.data.data.allocations?.[0] || null;
    },
    enabled: !!assetId && conflict,
  });

  const currentOwner = activeAllocations?.employee?.name || "another employee";

  // Mutations
  const allocateMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/allocations", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Asset allocated successfully");
      setAssetId("");
      setEmployeeId("");
      setExpectedReturnDate("");
      setConditionNotes("");
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/transfers", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer request submitted successfully");
      setAssetId("");
      setEmployeeId("");
      setTransferReason("");
    },
  });

  const approveTransferMutation = useMutation({
    mutationFn: async (id: string) => api.put(`/transfers/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer request approved");
    },
  });

  const rejectTransferMutation = useMutation({
    mutationFn: async (id: string) => api.put(`/transfers/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer request rejected");
    },
  });

  const handleAllocate = () => {
    allocateMutation.mutate({
      asset: assetId,
      employee: employeeId,
      expectedReturnDate: expectedReturnDate || undefined,
      conditionNotes: conditionNotes || undefined,
    });
  };

  const handleTransferRequest = () => {
    if (!transferReason) {
      toast.error("Please provide a transfer reason");
      return;
    }
    transferMutation.mutate({
      asset: assetId,
      toEmployee: employeeId,
      reason: transferReason,
    });
  };

  // Mapped Data list for transfers
  const mappedTransfers = (transfersData || []).map((t: any) => ({
    ...t,
    id: t._id,
    assetTag: t.asset?.assetTag || "—",
    assetName: t.asset?.name || "—",
    fromEmpName: t.fromEmployee?.name || "—",
    toEmpName: t.toEmployee?.name || "—",
    formattedDate: new Date(t.createdAt).toLocaleDateString(),
  }));

  const cols: Column<any>[] = [
    { key: "assetTag", header: "Asset", render: (t) => <span className="font-mono text-primary">{t.assetTag}</span> },
    { key: "assetName", header: "Item" },
    { key: "fromEmpName", header: "From" },
    { key: "toEmpName", header: "To" },
    { key: "reason", header: "Reason" },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    { key: "formattedDate", header: "Requested" },
    { key: "actions", header: "Actions", render: (t) => (
      t.status === "Requested" || t.status === "Pending" ? (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => approveTransferMutation.mutate(t._id)}>
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => rejectTransferMutation.mutate(t._id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null
    )},
  ];

  const activeAssets = (assetsData || []).filter((a: any) => a.status === "Available" || a.status === "Allocated");
  const activeEmployees = employeesData || [];

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
                  <SelectContent>
                    {activeAssets.map((a: any) => (
                      <SelectItem key={a._id} value={a._id}>{a.assetTag} — {a.name} ({a.status})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Employee</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e: any) => (
                      <SelectItem key={e._id} value={e._id}>{e.name} · {e.department || "No Department"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!conflict && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Expected return date</Label>
                    <Input type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Condition on handover</Label>
                    <Select value={handoverCondition} onValueChange={setHandoverCondition}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Excellent","Good","Fair","Poor"].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Condition notes</Label>
                  <Textarea rows={3} placeholder="Serial verified, charger and case included…" value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} />
                </div>
              </>
            )}

            {conflict && selectedAsset && (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-warning/20 text-warning-foreground shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">Asset is already allocated</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-mono">{selectedAsset.assetTag}</span> is currently assigned to{" "}
                      <span className="font-medium text-foreground">{currentOwner}</span>. You can raise a transfer request instead.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <div className="w-full space-y-2">
                        <Label>Transfer Reason</Label>
                        <Input placeholder="Enter transfer reason..." value={transferReason} onChange={(e) => setTransferReason(e.target.value)} />
                        <Button size="sm" onClick={handleTransferRequest} disabled={!transferReason || !employeeId}>
                          <ArrowRightLeft className="h-4 w-4 mr-2" /> Request transfer
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" onClick={() => { setAssetId(""); setEmployeeId(""); }}>Cancel</Button>
              <Button disabled={conflict || !assetId || !employeeId} onClick={handleAllocate}>
                <Check className="h-4 w-4 mr-2" /> Allocate asset
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card card-elevated p-6">
          <h3 className="font-semibold mb-4">Approval timeline</h3>
          <ol className="relative border-l border-border ml-3 space-y-6">
            {[
              { label: "Request submitted", by: "Initiated by user", done: true },
              { label: "Manager approval", by: "Automated routing", done: true },
              { label: "Asset transfer/handover", by: "Done on approval", done: false },
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
        {transfersLoading ? (
          <div className="flex h-[20vh] items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <DataTable data={mappedTransfers} columns={cols} searchKeys={["assetName","assetTag","fromEmpName","toEmpName"]} />
        )}
      </div>
    </div>
  );
}
