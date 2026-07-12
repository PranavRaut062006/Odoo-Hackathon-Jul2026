import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadCloud, Save } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile · AssetFlow" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated successfully!");
  };

  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "U";

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Profile"
        description="View your personal information and contact details."
      />

      <form onSubmit={handleSave} className="mt-6 rounded-2xl border bg-card card-elevated p-6 space-y-8">
        <div>
          <h3 className="text-lg font-medium">Avatar</h3>
          <p className="text-sm text-muted-foreground mb-4">This will be displayed on your profile and across the platform.</p>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border">
              <AvatarImage src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user?.name || "User"}`} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <Button type="button" variant="outline" size="sm" className="w-fit" disabled>
                <UploadCloud className="h-4 w-4 mr-2" />
                Change picture
              </Button>
              <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 2MB.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={user?.name || ""} readOnly className="bg-secondary/50 text-muted-foreground cursor-not-allowed" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={user?.email || ""} readOnly className="bg-secondary/50 text-muted-foreground cursor-not-allowed" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-border">
          <div className="grid gap-2">
            <Label>Role</Label>
            <Input value={user?.role || "Employee"} disabled className="bg-secondary/50 text-muted-foreground cursor-not-allowed capitalize" />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Input value={user?.status || "Active"} disabled className="bg-secondary/50 text-muted-foreground cursor-not-allowed" />
          </div>
        </div>
      </form>
    </div>
  );
}
