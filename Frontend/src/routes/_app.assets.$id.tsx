import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assets, activity } from "@/lib/mock-data";
import { ArrowLeft, QrCode, FileText, Wrench, UploadCloud, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/assets/$id")({
  head: ({ params }) => ({ meta: [{ title: `Asset ${params.id} · AssetFlow` }] }),
  loader: ({ params }) => {
    const asset = assets.find((a) => a.id === params.id);
    if (!asset) throw notFound();
    return { asset };
  },
  component: AssetDetail,
});

function AssetDetail() {
  const { asset } = Route.useLoaderData();

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm"><Link to="/assets"><ArrowLeft className="h-4 w-4" /> Back to directory</Link></Button>
      </div>

      <PageHeader
        title={asset.name}
        description={`${asset.tag} · ${asset.serial}`}
        actions={<>
          <Button variant="outline"><QrCode className="h-4 w-4" /> QR Code</Button>
          <Button variant="outline"><Wrench className="h-4 w-4" /> Raise maintenance</Button>
          <Button>Allocate</Button>
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
                  <div className="mt-1 font-medium">{asset.category}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Department</div>
                  <div className="mt-1 font-medium">{asset.department}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="mt-1 font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{asset.location}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Assigned to</div>
                  <div className="mt-1 font-medium">{asset.assignedTo ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Purchase price</div>
                  <div className="mt-1 font-medium">${asset.purchasePrice.toLocaleString()}</div>
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
                  {activity.slice(0, 5).map((e, i) => (
                    <li key={e.id} className="ml-6">
                      <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="text-sm"><span className="font-medium">{e.actor}</span> <span className="text-muted-foreground">{e.action}</span> <span className="font-medium text-primary">{e.target}</span></div>
                      <time className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</time>
                      {i === 0 && <div className="mt-2 text-xs text-muted-foreground">Condition noted as "Good, minor scratches on lid"</div>}
                    </li>
                  ))}
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
              <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
                <FileText className="h-6 w-6 mx-auto mb-2" />
                No maintenance history yet
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 card-elevated">
            <h3 className="font-semibold mb-3">Quick actions</h3>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start">Transfer to another employee</Button>
              <Button variant="outline" className="justify-start">Mark as returned</Button>
              <Button variant="outline" className="justify-start">Flag for audit</Button>
              <Button variant="outline" className="justify-start text-destructive hover:text-destructive">Retire asset</Button>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-5 card-elevated">
            <h3 className="font-semibold mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-muted to-secondary" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
