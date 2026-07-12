import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Plus, GripVertical, Paperclip } from "lucide-react";
import { maintenance as initial } from "@/lib/mock-data";
import type { MaintenanceRequest } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance · AssetFlow" }] }),
  component: MaintenancePage,
});

const columns: { id: MaintenanceRequest["status"]; label: string; accent: string }[] = [
  { id: "pending", label: "Pending", accent: "bg-muted-foreground" },
  { id: "approved", label: "Approved", accent: "bg-info" },
  { id: "assigned", label: "Technician Assigned", accent: "bg-primary" },
  { id: "in-progress", label: "In Progress", accent: "bg-warning" },
  { id: "resolved", label: "Resolved", accent: "bg-success" },
];

function MaintenancePage() {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  function handleDrop(status: MaintenanceRequest["status"]) {
    if (!dragId) return;
    setItems(items.map(i => (i.id === dragId ? { ...i, status } : i)));
    toast.success("Card moved");
    setDragId(null);
  }

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Track maintenance requests from creation through resolution."
        actions={<Button><Plus className="h-4 w-4" /> New request</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {columns.map(col => (
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
                {items.filter(i => i.status === col.id).length}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {items.filter(i => i.status === col.id).map(m => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={() => setDragId(m.id)}
                  onClick={() => setSelected(m)}
                  className="rounded-xl border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-primary">{m.assetTag}</div>
                      <div className="font-medium text-sm truncate">{m.asset}</div>
                    </div>
                    <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.issue}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge status={m.priority} />
                    {m.technician && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://api.dicebear.com/9.x/notionists/svg?seed=${m.technician}`} />
                        <AvatarFallback>{m.technician.slice(0,2)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.asset}</SheetTitle>
            <SheetDescription>{selected?.assetTag} · Requested by {selected?.requester}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="p-6 space-y-4 text-sm">
              <div className="flex gap-2"><StatusBadge status={selected.status} /><StatusBadge status={selected.priority} /></div>
              <div>
                <div className="text-xs text-muted-foreground">Issue</div>
                <div className="mt-1">{selected.issue}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Technician</div>
                <div className="mt-1">{selected.technician ?? "Unassigned"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Attachments</div>
                <div className="mt-2 flex gap-2">
                  <div className="rounded-lg border p-3 flex items-center gap-2 text-xs"><Paperclip className="h-4 w-4" /> screenshot.png</div>
                  <div className="rounded-lg border p-3 flex items-center gap-2 text-xs"><Paperclip className="h-4 w-4" /> diagnostic.pdf</div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground mb-3">Timeline</div>
                <ol className="relative border-l ml-3 space-y-4">
                  {["Requested","Approved","Technician assigned"].map((s, i) => (
                    <li key={i} className="ml-6">
                      <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="text-sm font-medium">{s}</div>
                      <div className="text-xs text-muted-foreground">2 hours ago</div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
