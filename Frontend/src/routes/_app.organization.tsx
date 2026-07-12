import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, Tags, Plus, Filter, Download, Trash2, Edit2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_app/organization")({
  head: () => ({ meta: [{ title: "Organization · AssetFlow" }] }),
  component: OrgPage,
});

function OrgPage() {
  const { user } = useAuth();

  if (user?.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">Access Denied</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          You do not have permission to view or manage organization settings. Please contact your system administrator.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const [tab, setTab] = useState("departments");
  const queryClient = useQueryClient();

  // Dialog & Form states
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptHead, setDeptHead] = useState("");
  const [parentDept, setParentDept] = useState("");

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");

  // Queries
  const { data: deptsData, isLoading: deptsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data.data;
    },
  });

  const { data: catsData, isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data.data;
    },
  });

  const { data: empsData, isLoading: empsLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data;
    },
  });

  // Mutations
  const createDeptMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/departments", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
      setDeptModalOpen(false);
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => api.put(`/departments/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
      setDeptModalOpen(false);
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department status updated to inactive");
    },
  });

  const createCatMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/categories", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
      setCatModalOpen(false);
    },
  });

  const updateCatMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => api.put(`/categories/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully");
      setCatModalOpen(false);
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category status updated to inactive");
    },
  });

  const promoteEmployeeMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => api.put(`/employees/${id}/promote`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee role updated successfully");
    },
  });

  // Event Handlers
  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: deptName,
      code: deptCode,
      departmentHead: deptHead || null,
      parentDepartment: parentDept || null,
    };
    if (editingDept) {
      updateDeptMutation.mutate({ id: editingDept._id, payload });
    } else {
      createDeptMutation.mutate(payload);
    }
  };

  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: catName,
      description: catDescription,
    };
    if (editingCat) {
      updateCatMutation.mutate({ id: editingCat._id, payload });
    } else {
      createCatMutation.mutate(payload);
    }
  };

  const openEditDept = (dept: any) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptHead(dept.departmentHead?._id || "");
    setParentDept(dept.parentDepartment?._id || "");
    setDeptModalOpen(true);
  };

  const openNewDept = () => {
    setEditingDept(null);
    setDeptName("");
    setDeptCode("");
    setDeptHead("");
    setParentDept("");
    setDeptModalOpen(true);
  };

  const openEditCat = (cat: any) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDescription(cat.description || "");
    setCatModalOpen(true);
  };

  const openNewCat = () => {
    setEditingCat(null);
    setCatName("");
    setCatDescription("");
    setCatModalOpen(true);
  };

  // Mapped Data lists
  const rawDepts = deptsData?.departments || [];
  const mappedDepts = rawDepts.map((d: any) => ({
    ...d,
    id: d._id,
    headName: d.departmentHead?.name || "—",
    parentName: d.parentDepartment?.name || "—",
  }));

  const rawCats = catsData?.categories || [];
  const mappedCats = rawCats.map((c: any) => ({
    ...c,
    id: c._id,
    code: c.name.slice(0, 3).toUpperCase(),
  }));

  const rawEmps = empsData?.employees || [];
  const mappedEmps = rawEmps.map((e: any) => ({
    ...e,
    id: e._id,
    avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${e.name}`,
  }));

  // Column Configurations
  const deptCols: Column<any>[] = [
    { key: "name", header: "Department", sortable: true, render: (d) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold">{d.code}</div>
        <div>
          <div className="font-medium">{d.name}</div>
          <div className="text-xs text-muted-foreground">Head: {d.headName}</div>
        </div>
      </div>
    )},
    { key: "parentName", header: "Parent", render: (d) => d.parentName },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
    { key: "actions", header: "Actions", render: (d) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDept(d)}>
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        {d.status === "Active" && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteDeptMutation.mutate(d._id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )},
  ];

  const catCols: Column<any>[] = [
    { key: "name", header: "Category", sortable: true, render: (c) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-info/10 text-info text-xs font-bold">{c.code}</div>
        <div>
          <div className="font-medium">{c.name}</div>
          <div className="text-xs text-muted-foreground truncate max-w-xs">{c.description}</div>
        </div>
      </div>
    )},
    { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
    { key: "actions", header: "Actions", render: (c) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCat(c)}>
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        {c.status === "Active" && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteCatMutation.mutate(c._id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )},
  ];

  const empCols: Column<any>[] = [
    { key: "name", header: "Employee", sortable: true, render: (e) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9"><AvatarImage src={e.avatar} /><AvatarFallback>{e.name.slice(0,2)}</AvatarFallback></Avatar>
        <div>
          <div className="font-medium">{e.name}</div>
          <div className="text-xs text-muted-foreground">{e.email}</div>
        </div>
      </div>
    )},
    { key: "department", header: "Department", sortable: true, render: (e) => e.department || "—" },
    { key: "role", header: "Role", render: (e) => (
      <Select defaultValue={e.role} onValueChange={(val) => promoteEmployeeMutation.mutate({ id: e._id, role: val })}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {["Admin", "Asset Manager", "Department Head", "Employee"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>
    )},
    { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
  ];

  if (deptsLoading || catsLoading || empsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Organization"
        description="Manage departments, asset categories, and employees. Admin only."
        actions={<>
          <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
          <Button onClick={tab === "departments" ? openNewDept : openNewCat} disabled={tab === "employees"}><Plus className="h-4 w-4" /> New</Button>
        </>}
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="departments"><Building2 className="h-4 w-4" /> Departments</TabsTrigger>
          <TabsTrigger value="categories"><Tags className="h-4 w-4" /> Asset Categories</TabsTrigger>
          <TabsTrigger value="employees"><Users className="h-4 w-4" /> Employee Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DataTable data={mappedDepts} columns={deptCols} searchKeys={["name","code","headName"]}
            toolbar={<><Button variant="outline" size="sm"><Filter className="h-4 w-4" /> Filter</Button><Button size="sm" onClick={openNewDept}><Plus className="h-4 w-4" /> Department</Button></>} />
        </TabsContent>
        <TabsContent value="categories">
          <DataTable data={mappedCats} columns={catCols} searchKeys={["name"]}
            toolbar={<Button size="sm" onClick={openNewCat}><Plus className="h-4 w-4" /> Category</Button>} />
        </TabsContent>
        <TabsContent value="employees">
          <DataTable data={mappedEmps} columns={empCols} searchKeys={["name","email","department"]} />
        </TabsContent>
      </Tabs>

      <div className="mt-4 text-xs text-muted-foreground"><Link to="/assets" className="hover:text-foreground">→ Manage assets in Directory</Link></div>

      {/* Department Dialog */}
      <Dialog open={deptModalOpen} onOpenChange={setDeptModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "New Department"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDept} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="deptName">Department Name</Label>
              <Input id="deptName" value={deptName} onChange={(e) => setDeptName(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="deptCode">Department Code</Label>
              <Input id="deptCode" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} required placeholder="e.g. ENG" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="deptHead">Department Head</Label>
              <Select value={deptHead} onValueChange={setDeptHead}>
                <SelectTrigger id="deptHead"><SelectValue placeholder="Select Head" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {mappedEmps.map((e: any) => (
                    <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="parentDept">Parent Department</Label>
              <Select value={parentDept} onValueChange={setParentDept}>
                <SelectTrigger id="parentDept"><SelectValue placeholder="Select Parent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {mappedDepts.filter((d: any) => d._id !== editingDept?._id).map((d: any) => (
                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setDeptModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createDeptMutation.isPending || updateDeptMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCat} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="catName">Category Name</Label>
              <Input id="catName" value={catName} onChange={(e) => setCatName(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="catDescription">Description</Label>
              <Textarea id="catDescription" value={catDescription} onChange={(e) => setCatDescription(e.target.value)} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setCatModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createCatMutation.isPending || updateCatMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
