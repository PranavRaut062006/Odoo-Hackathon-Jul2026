import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Search, Sun, Moon, Menu, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

const labels: Record<string, string> = {
  "": "Dashboard",
  organization: "Organization",
  assets: "Asset Directory",
  allocation: "Allocation & Transfer",
  booking: "Resource Booking",
  maintenance: "Maintenance",
  audit: "Audit",
  reports: "Reports",
  notifications: "Notifications",
};

export function TopNav({ onOpenMobile }: { onOpenMobile?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border glass">
      <div className="h-full flex items-center gap-3 px-4 lg:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile}>
          <Menu className="h-5 w-5" />
        </Button>

        <nav className="hidden md:flex items-center gap-1.5 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">AssetFlow</Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">
            {labels[parts[0] ?? ""] ?? "Overview"}
          </span>
          {parts[1] && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground truncate max-w-[180px]">{parts[1]}</span>
            </>
          )}
        </nav>

        <div className="flex-1 flex justify-center max-w-xl mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets, employees, bookings…"
              className="pl-9 h-9 bg-secondary/60 border-transparent focus-visible:bg-card"
            />
            <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-background">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
            {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/notifications">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-accent transition">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://api.dicebear.com/9.x/notionists/svg?seed=RushikeshRathod" />
                  <AvatarFallback>RR</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-semibold">Rushikesh Rathod</div>
                  <div className="text-[10px] text-muted-foreground">Admin</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="w-full cursor-pointer">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/preferences" className="w-full cursor-pointer">Preferences</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/billing" className="w-full cursor-pointer">Billing</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/login">Sign out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
