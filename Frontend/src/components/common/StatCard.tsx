import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  hint?: string;
}

const toneMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function StatCard({ label, value, change, icon: Icon, tone = "default", hint }: StatCardProps) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="group relative rounded-2xl border bg-card p-5 card-elevated transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
