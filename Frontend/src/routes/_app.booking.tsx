import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookings } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/booking")({
  head: () => ({ meta: [{ title: "Resource Booking · AssetFlow" }] }),
  component: BookingPage,
});

const resources = ["Aurora Meeting Room", "Nebula Boardroom", "Comet Huddle", "Focus Pod 1", "Fleet Van #3"];
const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8..17

function BookingPage() {
  const [view, setView] = useState<"day" | "week">("week");
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const slotBooked = (day: Date, hour: number) =>
    bookings.find(b => {
      const s = new Date(b.start);
      return s.toDateString() === day.toDateString() && s.getHours() === hour && b.status !== "cancelled";
    });

  return (
    <div>
      <PageHeader
        title="Resource Booking"
        description="Book meeting rooms, vehicles, and equipment. Overlaps are automatically blocked."
        actions={
          <Dialog>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New booking</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Book a resource</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>Resource</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select resource" /></SelectTrigger>
                    <SelectContent>{resources.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Start</Label><Input type="datetime-local" /></div>
                  <div className="grid gap-1.5"><Label>End</Label><Input type="datetime-local" /></div>
                </div>
                <div className="grid gap-1.5"><Label>Purpose</Label><Textarea rows={3} /></div>
              </div>
              <DialogFooter><Button onClick={() => toast.success("Booking confirmed")}>Confirm booking</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="rounded-2xl border bg-card card-elevated overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset(o => o - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="px-3 text-sm font-medium">
              {weekDays[0].toLocaleDateString([], { month: "short", day: "numeric" })} — {weekDays[6].toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setWeekOffset(o => o + 1)}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week")}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px] grid" style={{ gridTemplateColumns: `80px repeat(${view === "week" ? 7 : 1}, minmax(0, 1fr))` }}>
            <div className="border-b border-r bg-muted/30" />
            {(view === "week" ? weekDays : weekDays.slice(0, 1)).map((d, i) => (
              <div key={i} className="border-b border-r px-3 py-2 text-center">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{d.toLocaleDateString([], { weekday: "short" })}</div>
                <div className="text-sm font-semibold">{d.getDate()}</div>
              </div>
            ))}
            {hours.map(h => (
              <>
                <div key={`h-${h}`} className="border-b border-r px-2 py-2 text-xs text-muted-foreground text-right">
                  {h}:00
                </div>
                {(view === "week" ? weekDays : weekDays.slice(0, 1)).map((d, i) => {
                  const b = slotBooked(d, h);
                  return (
                    <div key={`${h}-${i}`} className={cn(
                      "relative border-b border-r h-14 p-1",
                      b ? "bg-primary/5" : "hover:bg-accent/40 cursor-pointer"
                    )}>
                      {b && (
                        <div className="h-full rounded-lg bg-primary/10 text-primary text-[11px] px-2 py-1 border-l-2 border-primary">
                          <div className="font-semibold truncate">{b.resource}</div>
                          <div className="text-muted-foreground truncate">{b.bookedBy}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Upcoming bookings</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {bookings.slice(0, 6).map(b => (
            <div key={b.id} className="rounded-xl border bg-card p-4 card-elevated">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{b.resource}</div>
                  <div className="text-xs text-muted-foreground truncate">{b.purpose}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {new Date(b.start).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </div>
              <div className="mt-1 text-xs">Booked by <span className="font-medium text-foreground">{b.bookedBy}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
