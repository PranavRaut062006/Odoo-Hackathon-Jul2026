import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Package,
  ArrowRightLeft,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/organization", label: "Organization", icon: Building2 },
  { to: "/assets", label: "Asset Directory", icon: Package },
  { to: "/allocation", label: "Allocation & Transfer", icon: ArrowRightLeft },
  { to: "/booking", label: "Resource Booking", icon: CalendarClock },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/audit", label: "Audit", icon: ClipboardCheck },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

import { useAuth } from "@/hooks/useAuth";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  const filteredNav = nav.filter((item) => {
    if (item.to === "/organization") {
      return user?.role === "Admin";
    }
    if (item.to === "/allocation") {
      return user?.role === "Admin" || user?.role === "Asset Manager";
    }
    return true;
  });

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Boxes className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">AssetFlow</div>
          <div className="text-[11px] text-muted-foreground">Enterprise ERP</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <div className="px-2 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        {filteredNav.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="truncate">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-xs">
          <div className="font-semibold text-foreground">Q4 Audit in progress</div>
          <div className="text-muted-foreground mt-1">64% verified across 6 departments.</div>
          <div className="mt-2 h-1.5 rounded-full bg-primary/15 overflow-hidden">
            <div className="h-full w-[64%] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </aside>
  );
}
