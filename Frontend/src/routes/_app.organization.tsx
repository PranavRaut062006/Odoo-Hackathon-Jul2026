import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { departments, categories, employees, assets } from "@/lib/mock-data";
import { Building2, Users, Tags, Plus, Filter, Download } from "lucide-react";
import type { Department, AssetCategory, Employee } from "@/lib/types";

export const Route = createFileRoute("/_app/organization")({
  head: () => ({ meta: [{ title: "Organization · AssetFlow" }] }),
  component: OrgPage,
});

function OrgPage() {
  const [tab, setTab] = useState("departments");

  const deptCols: Column<Department>[] = [
    { key: "name", header: "Department", sortable: true, render: (d) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold">{d.code}</div>
        <div>
          <div className="font-medium">{d.name}</div>
          <div className="text-xs text-muted-foreground">Head: {d.head}</div>
        </div>
      </div>
    )},
    { key: "employeeCount", header: "Employees", render: (d) => <span className="font-medium">{d.employeeCount}</span> },
    { key: "parent", header: "Parent", render: (d) => d.parent ? departments.find(x=>x.id===d.parent)?.name ?? "—" : "—" },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
    { key: "assets", header: "Allocated Assets", render: (d) => assets.filter(a => a.department === d.name).length },
  ];

  const catCols: Column<AssetCategory>[] = [
    { key: "name", header: "Category", sortable: true, render: (c) => (
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-info/10 text-info text-xs font-bold">{c.code}</div>
        <div>
          <div className="font-medium">{c.name}</div>
          <div className="text-xs text-muted-foreground truncate max-w-xs">{c.description}</div>
        </div>
      </div>
    )},
    { key: "assetCount", header: "Assets", render: (c) => <span className="font-medium">{assets.filter(a=>a.category===c.name).length}</span> },
    { key: "actions", header: "", render: () => <Button variant="ghost" size="sm">Edit</Button> },
  ];

  const empCols: Column<Employee>[] = [
    { key: "name", header: "Employee", sortable: true, render: (e) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9"><AvatarImage src={e.avatar} /><AvatarFallback>{e.name.slice(0,2)}</AvatarFallback></Avatar>
        <div>
          <div className="font-medium">{e.name}</div>
          <div className="text-xs text-muted-foreground">{e.email}</div>
        </div>
      </div>
    )},
    { key: "title", header: "Title" },
    { key: "department", header: "Department", sortable: true },
    { key: "role", header: "Role", render: (e) => (
      <Select defaultValue={e.role}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {["admin","manager","employee","technician","auditor"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>
    )},
    { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Organization"
        description="Manage departments, asset categories, and employees. Admin only."
        actions={<>
          <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
          <Button><Plus className="h-4 w-4" /> New</Button>
        </>}
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="departments"><Building2 className="h-4 w-4" /> Departments</TabsTrigger>
          <TabsTrigger value="categories"><Tags className="h-4 w-4" /> Asset Categories</TabsTrigger>
          <TabsTrigger value="employees"><Users className="h-4 w-4" /> Employee Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DataTable data={departments} columns={deptCols} searchKeys={["name","head","code"]}
            toolbar={<><Button variant="outline" size="sm"><Filter className="h-4 w-4" /> Filter</Button><Button size="sm"><Plus className="h-4 w-4" /> Department</Button></>} />
        </TabsContent>
        <TabsContent value="categories">
          <DataTable data={categories} columns={catCols} searchKeys={["name","code"]}
            toolbar={<Button size="sm"><Plus className="h-4 w-4" /> Category</Button>} />
        </TabsContent>
        <TabsContent value="employees">
          <DataTable data={employees} columns={empCols} searchKeys={["name","email","department"]}
            toolbar={<Button size="sm"><Plus className="h-4 w-4" /> Invite employee</Button>} />
        </TabsContent>
      </Tabs>

      <div className="mt-4 text-xs text-muted-foreground"><Link to="/assets" className="hover:text-foreground">→ Manage assets in Directory</Link></div>
    </div>
  );
}
