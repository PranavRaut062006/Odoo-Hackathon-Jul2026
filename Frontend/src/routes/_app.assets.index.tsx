import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, QrCode, Download, UploadCloud } from "lucide-react";
import { assets, categories, departments } from "@/lib/mock-data";
import type { Asset } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assets/")({
  head: () => ({ meta: [{ title: "Asset Directory · AssetFlow" }] }),
  component: AssetsPage,
});

function AssetsPage() {
  const [drawer, setDrawer] = useState(false);
  const [cat, setCat] = useState("all");
  const [dep, setDep] = useState("all");
  const [stat, setStat] = useState("all");

  const filtered = assets.filter(a =>
    (cat === "all" || a.category === cat) &&
    (dep === "all" || a.department === dep) &&
    (stat === "all" || a.status === stat)
  );

  const columns: Column<Asset>[] = [
    { key: "tag", header: "Asset Tag", sortable: true, render: (a) => (
      <Link to="/assets/$id" params={{ id: a.id }} className="font-mono text-primary hover:underline">{a.tag}</Link>
    )},
    { key: "name", header: "Asset", sortable: true, render: (a) => (
      <div>
        <div className="font-medium">{a.name}</div>
        <div className="text-xs text-muted-foreground">{a.serial}</div>
      </div>
    )},
    { key: "category", header: "Category" },
    { key: "department", header: "Department" },
    { key: "location", header: "Location" },
    { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
    { key: "assignedTo", header: "Assigned to", render: (a) => a.assignedTo ?? <span className="text-muted-foreground">—</span> },
    { key: "action", header: "", render: () => <Button variant="ghost" size="icon"><QrCode className="h-4 w-4" /></Button> },
  ];

  return (
    <div>
      <PageHeader
        title="Asset Directory"
        description={`${assets.length} assets across ${departments.length} departments`}
        actions={<>
          <Button variant="outline"><Download className="h-4 w-4" /> Export CSV</Button>
          <Button onClick={() => setDrawer(true)}><Plus className="h-4 w-4" /> Register asset</Button>
        </>}
      />

      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dep} onValueChange={setDep}>
          <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stat} onValueChange={setStat}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["available","allocated","maintenance","reserved","retired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            <SelectItem value="hq">Headquarters</SelectItem>
            <SelectItem value="wh">Warehouse</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable data={filtered} columns={columns} searchKeys={["tag","name","serial","assignedTo"]} pageSize={10} />

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Register new asset</SheetTitle>
            <SheetDescription>Provide asset details. QR tag will be auto-generated.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4 px-4">
            <div className="grid gap-2"><Label>Asset name</Label><Input placeholder="e.g. MacBook Pro 16&quot;" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Category</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Department</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Serial number</Label><Input /></div>
              <div className="grid gap-2"><Label>Location</Label><Input placeholder="HQ · Floor 3" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2"><Label>Purchase date</Label><Input type="date" /></div>
              <div className="grid gap-2"><Label>Purchase price</Label><Input type="number" placeholder="0.00" /></div>
            </div>
            <div className="grid gap-2"><Label>Notes</Label><Textarea rows={3} /></div>
            <div className="grid gap-2">
              <Label>Attachments</Label>
              <div className="rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
                <UploadCloud className="h-6 w-6 mx-auto mb-2" />
                Drop photos or documents here
              </div>
            </div>
          </div>
          <SheetFooter className="px-4">
            <Button variant="ghost" onClick={() => setDrawer(false)}>Cancel</Button>
            <Button onClick={() => { setDrawer(false); toast.success("Asset registered"); }}>Register asset</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
