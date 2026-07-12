import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, QrCode, FileText, Wrench, UploadCloud, MapPin, ArrowRightLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/assets/$id")({
  head: ({ params }) => ({ meta: [{ title: `Asset Detail · AssetFlow` }] }),
  loader: ({ params }) => {
    return { id: params.id };
  },
  component: AssetDetail,
});

function AssetDetail() {
  const { id } = Route.useLoaderData();
  const queryClient = useQueryClient();

  // Modals state
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [allocateEmployee, setAllocateEmployee] = useState("");
  const [allocateReturnDate, setAllocateReturnDate] = useState("");
  const [allocateNotes, setAllocateNotes] = useState("");

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnNotes, setReturnNotes] = useState("");

  const [maintOpen, setMaintOpen] = useState(false);
  const [maintDesc, setMaintDesc] = useState("");
  const [maintPriority, setMaintPriority] = useState("Medium");

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferToEmp, setTransferToEmp] = useState("");
  const [transferReason, setTransferReason] = useState("");

  // Queries
  const { data: asset, isLoading, error } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const res = await api.get(`/assets/${id}`);
      return res.data.data;
    },
  });

  const { data: activeAllocations } = useQuery({
    queryKey: ["asset-allocation", id],
    queryFn: async () => {
      const res = await api.get(`/allocations`, { params: { asset: id, status: "Active" } });
      return res.data.data.allocations || [];
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data.employees || [];
    },
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ["maintenance-requests", id],
    queryFn: async () => {
      const res = await api.get("/maintenance");
      const list = res.data.data.requests || res.data.data || [];
      return list.filter((m: any) => m.asset === id || m.asset?._id === id);
    },
  });

  const activeAlloc = activeAllocations?.[0];

  // Mutations
  const allocateMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/allocations", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["asset-allocation", id] });
      toast.success("Asset allocated successfully");
      setAllocateOpen(false);
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (payload: any) => api.put(`/allocations/${activeAlloc?._id}/return`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["asset-allocation", id] });
      toast.success("Asset returned successfully");
      setReturnOpen(false);
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/maintenance", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests", id] });
      toast.success("Maintenance request raised successfully");
      setMaintOpen(false);
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/transfers", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      toast.success("Transfer request submitted successfully");
      setTransferOpen(false);
    },
  });

  const retireMutation = useMutation({
    mutationFn: async () => api.delete(`/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      toast.success("Asset retired/disposed successfully");
    },
  });

  // Handlers
  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateEmployee) {
      toast.error("Please select an employee");
      return;
    }
    allocateMutation.mutate({
      asset: id,
      employee: allocateEmployee,
      expectedReturnDate: allocateReturnDate || undefined,
      conditionNotes: allocateNotes || undefined,
    });
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    returnMutation.mutate({
      actualReturnDate: new Date().toISOString(),
      conditionNotes: returnNotes || undefined,
    });
  };

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    maintenanceMutation.mutate({
      asset: id,
      description: maintDesc,
      priority: maintPriority,
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferToEmp) {
      toast.error("Please select a target employee");
      return;
    }
    transferMutation.mutate({
      asset: id,
      toEmployee: transferToEmp,
      reason: transferReason,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <p className="text-destructive font-medium">Failed to load asset details</p>
        <Button asChild variant="outline"><Link to="/assets">Back to directory</Link></Button>
      </div>
    );
  }

  const categoryName = asset.category?.name || "—";
  const departmentName = asset.department?.name || "—";
  const assignedToName = activeAlloc?.employee?.name || "—";

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/assets">
            <ArrowLeft className="h-4 w-4" /> Back to directory
          </Link>
        </Button>
      </div>

      <PageHeader
        title={asset.name}
        description={`${asset.assetTag} · ${asset.serialNumber}`}
        actions={<>
          <Button variant="outline"><QrCode className="h-4 w-4" /> QR Code</Button>
          <Button variant="outline" onClick={() => setMaintOpen(true)}><Wrench className="h-4 w-4" /> Raise maintenance</Button>
          {asset.status === "Available" ? (
            <Button onClick={() => setAllocateOpen(true)}>Allocate</Button>
          ) : asset.status === "Allocated" ? (
            <Button variant="outline" onClick={() => setReturnOpen(true)}>Mark as returned</Button>
          ) : null}
        </>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card card-elevated p-6">
            <div className="flex items-start gap-6">
              <div className="grid h-32 w-32 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-info/10 text-primary shrink-0">
                <QrCode className="h-16 w-16" />
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1"><StatusBadge status={asset.status} /></div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Condition</div>
                  <div className="mt-1"><StatusBadge status={asset.condition} /></div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div className="mt-1 font-medium">{categoryName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Department</div>
                  <div className="mt-1 font-medium">{departmentName}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="mt-1 font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{asset.location}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Assigned to</div>
                  <div className="mt-1 font-medium">{assignedToName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Purchase price</div>
                  <div className="mt-1 font-medium">${asset.acquisitionCost ? asset.acquisitionCost.toLocaleString() : "0"}</div>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="mt-4">
              <div className="rounded-2xl border bg-card p-5 card-elevated">
                <ol className="relative border-l border-border ml-3 space-y-6">
                  {activeAllocations?.map((alloc: any) => (
                    <li key={alloc._id} className="ml-6">
                      <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="text-sm">
                        <span className="font-medium">{alloc.employee?.name}</span>{" "}
                        <span className="text-muted-foreground">allocated by</span>{" "}
                        <span className="font-medium">{alloc.allocatedBy?.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Status: <span className="font-medium">{alloc.status}</span>
                      </div>
                      <time className="text-xs text-muted-foreground">{new Date(alloc.createdAt).toLocaleString()}</time>
                    </li>
                  ))}
                  {(!activeAllocations || activeAllocations.length === 0) && (
                    <div className="text-center py-6 text-sm text-muted-foreground">No allocation history yet</div>
                  )}
                </ol>
              </div>
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <div className="rounded-2xl border-2 border-dashed p-10 text-center text-sm text-muted-foreground">
                <UploadCloud className="h-6 w-6 mx-auto mb-2" />
                Drop invoices, warranty, or manuals here
              </div>
            </TabsContent>
            <TabsContent value="maintenance" className="mt-4">
              <div className="rounded-2xl border bg-card p-5 card-elevated space-y-4">
                {maintenanceData?.map((m: any) => (
                  <div key={m._id} className="flex justify-between items-start border-b last:border-0 pb-3 last:pb-0">
                    <div>
                      <div className="font-medium text-sm">{m.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Priority: {m.priority}</div>
                      <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                ))}
                {(!maintenanceData || maintenanceData.length === 0) && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No maintenance history yet
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 card-elevated">
            <h3 className="font-semibold mb-3">Quick actions</h3>
            <div className="grid gap-2">
              {asset.status === "Allocated" && (
                <>
                  <Button variant="outline" className="justify-start" onClick={() => setTransferOpen(true)}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" /> Transfer to another employee
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => setReturnOpen(true)}>
                    Mark as returned
                  </Button>
                </>
              )}
              <Button variant="outline" className="justify-start text-destructive hover:text-destructive" onClick={() => {
                if (confirm("Are you sure you want to retire this asset?")) {
                  retireMutation.mutate();
                }
              }} disabled={asset.status === "Disposed" || asset.status === "Retired"}>
                Retire asset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Allocate Dialog */}
      <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAllocateSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="allocateEmployee">Employee</Label>
              <Select value={allocateEmployee} onValueChange={setAllocateEmployee}>
                <SelectTrigger id="allocateEmployee"><SelectValue placeholder="Select Employee" /></SelectTrigger>
                <SelectContent>
                  {(employeesData || []).map((e: any) => (
                    <SelectItem key={e._id} value={e._id}>{e.name} ({e.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="allocateReturnDate">Expected Return Date</Label>
              <Input id="allocateReturnDate" type="date" value={allocateReturnDate} onChange={(e) => setAllocateReturnDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="allocateNotes">Notes</Label>
              <Textarea id="allocateNotes" value={allocateNotes} onChange={(e) => setAllocateNotes(e.target.value)} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setAllocateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={allocateMutation.isPending}>Allocate</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="returnNotes">Condition Notes</Label>
              <Textarea id="returnNotes" placeholder="Describe the condition of the asset on return..." value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setReturnOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={returnMutation.isPending}>Mark Returned</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={maintOpen} onOpenChange={setMaintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise Maintenance Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMaintSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="maintDesc">Description</Label>
              <Textarea id="maintDesc" placeholder="Describe the issue..." value={maintDesc} onChange={(e) => setMaintDesc(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maintPriority">Priority</Label>
              <Select value={maintPriority} onValueChange={setMaintPriority}>
                <SelectTrigger id="maintPriority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High", "Critical"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setMaintOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={maintenanceMutation.isPending}>Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Asset Transfer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="transferToEmp">Transfer to Employee</Label>
              <Select value={transferToEmp} onValueChange={setTransferToEmp}>
                <SelectTrigger id="transferToEmp"><SelectValue placeholder="Select target employee" /></SelectTrigger>
                <SelectContent>
                  {(employeesData || []).filter((e: any) => e._id !== activeAlloc?.employee?._id).map((e: any) => (
                    <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="transferReason">Reason for Transfer</Label>
              <Textarea id="transferReason" value={transferReason} onChange={(e) => setTransferReason(e.target.value)} required />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setTransferOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={transferMutation.isPending}>Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
