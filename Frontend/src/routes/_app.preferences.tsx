import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Bell, Monitor, Globe } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/preferences")({
  head: () => ({ meta: [{ title: "Preferences · AssetFlow" }] }),
  component: PreferencesPage,
});

function PreferencesPage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Preferences updated successfully!");
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Preferences"
        description="Manage your notification settings and display preferences."
      />

      <form onSubmit={handleSave} className="mt-6 space-y-6">
        
        {/* Notifications */}
        <div className="rounded-2xl border bg-card card-elevated p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Notification Settings</h3>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox defaultChecked className="mt-1" />
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive updates about asset allocations, transfers, and maintenance.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox defaultChecked className="mt-1" />
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">Get browser alerts for urgent maintenance and transfer approvals.</div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox className="mt-1" />
              <div>
                <div className="font-medium">Weekly Digest</div>
                <div className="text-sm text-muted-foreground">A weekly summary of your team's asset activity and upcoming audits.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Display Settings */}
        <div className="rounded-2xl border bg-card card-elevated p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Display & Region</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Theme</Label>
              <Select defaultValue="system">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Timezone</Label>
              <Select defaultValue="ist">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                  <SelectItem value="utc">Coordinated Universal Time (UTC)</SelectItem>
                  <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                  <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost">Discard changes</Button>
          <Button type="submit"><Save className="h-4 w-4 mr-2" /> Save preferences</Button>
        </div>
      </form>
    </div>
  );
}
