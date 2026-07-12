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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assets/")({
  head: () => ({ meta: [{ title: "Asset Directory · AssetFlow" }] }),
  component: AssetsPage,
});

function AssetsPage() {
  const queryClient = useQueryClient();
  const [drawer, setDrawer] = useState(false);
  const [cat, setCat] = useState("all");
  const [dep, setDep] = useState("all");
  const [stat, setStat] = useState("all");

  // Form states
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("");
  const [assetDepartment, setAssetDepartment] = useState("");
  const [assetSerial, setAssetSerial] = useState("");
  const [assetLocation, setAssetLocation] = useState("");
  const [assetAcqDate, setAssetAcqDate] = useState("");
  const [assetCost, setAssetCost] = useState("");
  const [assetCondition, setAssetCondition] = useState("Good");
  const [assetNotes, setAssetNotes] = useState("");

  // Queries
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-all-list"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data.data.categories || [];
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments-all-list"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data.data.departments || [];
    },
  });

  // Query assets based on filters
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ["assets-all-list", cat, dep, stat],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (cat !== "all") params.category = cat;
      if (dep !== "all") params.department = dep;
      if (stat !== "all") params.status = stat;

      const res = await api.get("/assets", { params });
      return res.data.data.assets || [];
    },
  });

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/assets", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets-all-list"] });
      toast.success("Asset registered successfully");
      setDrawer(false);
      // Reset form
      setAssetName("");
      setAssetCategory("");
      setAssetDepartment("");
      setAssetSerial("");
      setAssetLocation("");
      setAssetAcqDate("");
      setAssetCost("");
      setAssetNotes("");
    },
  });

  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCategory) {
      toast.error("Please select a category");
      return;
    }
    const payload = {
      name: assetName,
      serialNumber: assetSerial,
      category: assetCategory,
      location: assetLocation,
      condition: assetCondition,
      acquisitionDate: assetAcqDate || new Date().toISOString(),
      acquisitionCost: parseFloat(assetCost) || 0,
      department: assetDepartment || undefined,
      bookable: true, // Make bookable by default
    };
    createAssetMutation.mutate(payload);
  };

  const activeCategories = categoriesData || [];
  const activeDepartments = departmentsData || [];

  const mappedAssets = (assetsData || []).map((a: any) => ({
    ...a,
    id: a._id,
    tag: a.assetTag,
    categoryName: a.category?.name || "—",
    departmentName: a.department?.name || "—",
    serial: a.serialNumber,
  }));

  const columns: Column<any>[] = [
    { key: "tag", header: "Asset Tag", sortable: true, render: (a) => (
      <Link to="/assets/$id" params={{ id: a.id }} className="font-mono text-primary hover:underline">{a.tag}</Link>
    )},
    { key: "name", header: "Asset", sortable: true, render: (a) => (
      <div>
        <div className="font-medium">{a.name}</div>
        <div className="text-xs text-muted-foreground">{a.serial}</div>
      </div>
    )},
    { key: "categoryName", header: "Category" },
    { key: "departmentName", header: "Department" },
    { key: "location", header: "Location" },
    { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
    { key: "assignedTo", header: "Assigned to", render: (a) => a.assignedTo ?? <span className="text-muted-foreground">—</span> },
    { key: "action", header: "", render: () => <Button variant="ghost" size="icon"><QrCode className="h-4 w-4" /></Button> },
  ];

  return (
    <div>
      <PageHeader
        title="Asset Directory"
        description={`${mappedAssets.length} assets across ${activeDepartments.length} departments`}
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
            {activeCategories.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dep} onValueChange={setDep}>
          <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {activeDepartments.map((d: any) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stat} onValueChange={setStat}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["Available","Allocated","Under Maintenance","Reserved","Lost","Retired","Disposed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

      {assetsLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DataTable data={mappedAssets} columns={columns} searchKeys={["tag","name","serial","assignedTo"]} pageSize={10} />
      )}

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <form onSubmit={handleRegisterAsset}>
            <SheetHeader>
              <SheetTitle>Register new asset</SheetTitle>
              <SheetDescription>Provide asset details. QR tag will be auto-generated.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4 px-4">
              <div className="grid gap-2">
                <Label htmlFor="assetName">Asset name</Label>
                <Input id="assetName" placeholder="e.g. MacBook Pro 16&quot;" value={assetName} onChange={(e) => setAssetName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="assetCategory">Category</Label>
                  <Select value={assetCategory} onValueChange={setAssetCategory}>
                    <SelectTrigger id="assetCategory"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {activeCategories.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assetDepartment">Department</Label>
                  <Select value={assetDepartment} onValueChange={setAssetDepartment}>
                    <SelectTrigger id="assetDepartment"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {activeDepartments.map((d: any) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="assetSerial">Serial number</Label>
                  <Input id="assetSerial" value={assetSerial} onChange={(e) => setAssetSerial(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assetLocation">Location</Label>
                  <Input id="assetLocation" placeholder="HQ · Floor 3" value={assetLocation} onChange={(e) => setAssetLocation(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="assetAcqDate">Purchase date</Label>
                  <Input id="assetAcqDate" type="date" value={assetAcqDate} onChange={(e) => setAssetAcqDate(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assetCost">Purchase price</Label>
                  <Input id="assetCost" type="number" placeholder="0.00" value={assetCost} onChange={(e) => setAssetCost(e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assetNotes">Notes</Label>
                <Textarea id="assetNotes" rows={3} value={assetNotes} onChange={(e) => setAssetNotes(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Attachments</Label>
                <div className="rounded-xl border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
                  <UploadCloud className="h-6 w-6 mx-auto mb-2" />
                  Drop photos or documents here
                </div>
              </div>
            </div>
            <SheetFooter className="px-4">
              <Button type="button" variant="ghost" onClick={() => setDrawer(false)}>Cancel</Button>
              <Button type="submit" disabled={createAssetMutation.isPending}>
                {createAssetMutation.isPending ? "Registering..." : "Register asset"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
