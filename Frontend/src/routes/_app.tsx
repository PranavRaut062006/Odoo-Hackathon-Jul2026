import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <AppSidebar />
        </SheetContent>
      </Sheet>
      <div className="flex-1 min-w-0 flex flex-col">
        <TopNav onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
