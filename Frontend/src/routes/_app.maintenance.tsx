import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, GripVertical, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance · AssetFlow" }] }),
  component: MaintenancePage,
});

const columns: { id: string; label: string; accent: string }[] = [
  { id: "Pending", label: "Pending", accent: "bg-muted-foreground" },
  { id: "Approved", label: "Approved", accent: "bg-info" },
  { id: "Technician Assigned", label: "Technician Assigned", accent: "bg-primary" },
  { id: "In Progress", label: "In Progress", accent: "bg-warning" },
  { id: "Resolved", label: "Resolved", accent: "bg-success" },
];

function MaintenancePage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  // New Request Form states
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");

  // Queries
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["maintenance-requests"],
    queryFn: async () => {
      const res = await api.get("/maintenance");
      return res.data.data.maintenanceRequests || res.data.data || [];
    },
  });

  const { data: assetsData } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets", { params: { limit: 100 } });
      return res.data.data.assets || [];
    },
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.put(`/maintenance/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      toast.success("Request status updated");
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/maintenance", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      toast.success("Maintenance request raised successfully");
      setNewRequestOpen(false);
      setAssetId("");
      setDescription("");
      setPriority("Medium");
    },
  });

  function handleDrop(status: string) {
    if (!dragId) return;
    updateStatusMutation.mutate({ id: dragId, status });
    setDragId(null);
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) {
      toast.error("Please select an asset");
      return;
    }
    createRequestMutation.mutate({
      asset: assetId,
      description,
      priority,
    });
  };

  const items = requestsData || [];

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Track maintenance requests from creation through resolution."
        actions={
          <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setNewRequestOpen(true)}><Plus className="h-4 w-4" /> New request</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Raise Maintenance Request</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="assetId">Asset</Label>
                  <Select value={assetId} onValueChange={setAssetId}>
                    <SelectTrigger id="assetId"><SelectValue placeholder="Select Asset" /></SelectTrigger>
                    <SelectContent>
                      {(assetsData || []).map((a: any) => (
                        <SelectItem key={a._id} value={a._id}>{a.name} ({a.assetTag})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Low", "Medium", "High", "Critical"].map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="description">Issue / Description</Label>
                  <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setNewRequestOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createRequestMutation.isPending}>
                    {createRequestMutation.isPending ? "Submitting..." : "Submit request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {requestsLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {columns.map(col => {
            const colItems = items.filter((i: any) => i.status === col.id);
            return (
              <div key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.id)}
                className="rounded-2xl bg-muted/40 border p-3 flex flex-col min-h-[400px]"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
                    {colItems.length}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  {colItems.map((m: any) => (
                    <div
                      key={m._id}
                      draggable
                      onDragStart={() => setDragId(m._id)}
                      onClick={() => setSelected(m)}
                      className="rounded-xl border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-mono text-primary">{m.asset?.assetTag || "AF-0000"}</div>
                          <div className="font-medium text-sm truncate">{m.asset?.name || "Asset"}</div>
                        </div>
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.description}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <StatusBadge status={m.priority} />
                        {m.requestedBy?.name && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://api.dicebear.com/9.x/notionists/svg?seed=${m.requestedBy.name}`} />
                            <AvatarFallback>{m.requestedBy.name.slice(0,2)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.asset?.name}</SheetTitle>
            <SheetDescription>{selected?.asset?.assetTag} · Requested by {selected?.requestedBy?.name || "System"}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="p-6 space-y-4 text-sm">
              <div className="flex gap-2"><StatusBadge status={selected.status} /><StatusBadge status={selected.priority} /></div>
              <div>
                <div className="text-xs text-muted-foreground">Issue</div>
                <div className="mt-1">{selected.description}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Technician</div>
                <div className="mt-1">{selected.technician || "Unassigned"}</div>
              </div>
              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground mb-3">Timeline</div>
                <ol className="relative border-l ml-3 space-y-4">
                  <li className="ml-6">
                    <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <div className="text-sm font-medium">{selected.status}</div>
                    <div className="text-xs text-muted-foreground">{new Date(selected.updatedAt).toLocaleString()}</div>
                  </li>
                  <li className="ml-6">
                    <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-muted ring-4 ring-background" />
                    <div className="text-sm font-medium">Requested</div>
                    <div className="text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</div>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
