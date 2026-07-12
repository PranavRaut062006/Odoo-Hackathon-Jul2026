import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  available: "bg-success/10 text-success ring-success/20",
  allocated: "bg-primary/10 text-primary ring-primary/20",
  maintenance: "bg-warning/15 text-warning-foreground ring-warning/30",
  reserved: "bg-info/10 text-info ring-info/20",
  retired: "bg-muted text-muted-foreground ring-border",
  active: "bg-success/10 text-success ring-success/20",
  inactive: "bg-muted text-muted-foreground ring-border",
  pending: "bg-warning/15 text-warning-foreground ring-warning/30",
  approved: "bg-info/10 text-info ring-info/20",
  assigned: "bg-info/10 text-info ring-info/20",
  "in-progress": "bg-primary/10 text-primary ring-primary/20",
  resolved: "bg-success/10 text-success ring-success/20",
  rejected: "bg-destructive/10 text-destructive ring-destructive/20",
  completed: "bg-success/10 text-success ring-success/20",
  cancelled: "bg-muted text-muted-foreground ring-border",
  confirmed: "bg-success/10 text-success ring-success/20",
  critical: "bg-destructive/10 text-destructive ring-destructive/20",
  high: "bg-warning/15 text-warning-foreground ring-warning/30",
  medium: "bg-info/10 text-info ring-info/20",
  low: "bg-muted text-muted-foreground ring-border",
  excellent: "bg-success/10 text-success ring-success/20",
  good: "bg-info/10 text-info ring-info/20",
  fair: "bg-warning/15 text-warning-foreground ring-warning/30",
  poor: "bg-destructive/10 text-destructive ring-destructive/20",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset capitalize",
        map[key] ?? "bg-muted text-muted-foreground ring-border",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status.replace("-", " ")}
    </span>
  );
}
