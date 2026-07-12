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
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/booking")({
  head: () => ({ meta: [{ title: "Resource Booking · AssetFlow" }] }),
  component: BookingPage,
});

function BookingPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"day" | "week">("week");
  const [weekOffset, setWeekOffset] = useState(0);

  // Form states
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

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

  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8..17

  // Queries
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings", weekOffset],
    queryFn: async () => {
      const res = await api.get("/bookings", { params: { limit: 100 } });
      const list = res.data.data.bookings || res.data.data || [];
      return list;
    },
  });

  const { data: bookableAssets } = useQuery({
    queryKey: ["bookable-assets"],
    queryFn: async () => {
      const res = await api.get("/assets", { params: { bookable: "true", limit: 100 } });
      return res.data.data.assets || [];
    },
  });

  // Mutations
  const createBookingMutation = useMutation({
    mutationFn: async (payload: any) => api.post("/bookings", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking confirmed");
      setBookingOpen(false);
      setSelectedAssetId("");
      setStartTime("");
      setEndTime("");
      setPurpose("");
    },
    onError: (err: any) => {
      // toast error is already handled by api interceptor
    },
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error("Please select a resource");
      return;
    }
    createBookingMutation.mutate({
      resource: selectedAssetId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      purpose,
    });
  };

  const slotBooked = (day: Date, hour: number) => {
    const list = bookingsData || [];
    return list.find((b: any) => {
      const s = new Date(b.startTime);
      return s.toDateString() === day.toDateString() && s.getHours() === hour && b.status !== "Cancelled";
    });
  };

  const upcomingBookings = (bookingsData || []).filter((b: any) => b.status === "Upcoming" || b.status === "Ongoing");

  return (
    <div>
      <PageHeader
        title="Resource Booking"
        description="Book meeting rooms, vehicles, and equipment. Overlaps are automatically blocked."
        actions={
          <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setBookingOpen(true)}><Plus className="h-4 w-4" /> New booking</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Book a resource</DialogTitle></DialogHeader>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="resource">Resource</Label>
                  <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                    <SelectTrigger id="resource"><SelectValue placeholder="Select resource" /></SelectTrigger>
                    <SelectContent>
                      {(bookableAssets || []).map((a: any) => (
                        <SelectItem key={a._id} value={a._id}>{a.name} ({a.assetTag})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="startTime">Start</Label>
                    <Input id="startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="endTime">End</Label>
                    <Input id="endTime" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Textarea id="purpose" rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setBookingOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createBookingMutation.isPending}>
                    {createBookingMutation.isPending ? "Confirming..." : "Confirm booking"}
                  </Button>
                </DialogFooter>
              </form>
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

        {bookingsLoading ? (
          <div className="flex h-[30vh] items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
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
                <div key={h} className="contents">
                  <div className="border-b border-r px-2 py-2 text-xs text-muted-foreground text-right">
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
                            <div className="font-semibold truncate">{b.resource?.name}</div>
                            <div className="text-muted-foreground truncate">{b.employee?.name}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Upcoming bookings</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {upcomingBookings.map((b: any) => (
            <div key={b._id} className="rounded-xl border bg-card p-4 card-elevated">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{b.resource?.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{b.purpose || "Resource Booking"}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {new Date(b.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </div>
              <div className="mt-1 text-xs">Booked by <span className="font-medium text-foreground">{b.employee?.name}</span></div>
            </div>
          ))}
          {upcomingBookings.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground col-span-full">No upcoming bookings</div>
          )}
        </div>
      </div>
    </div>
  );
}
