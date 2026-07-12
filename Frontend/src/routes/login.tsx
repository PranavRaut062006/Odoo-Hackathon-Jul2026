import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Boxes, ShieldCheck, LineChart, Users } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · AssetFlow" }] }),
  component: LoginPage,
});

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-gradient-to-br from-primary to-info text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="font-semibold tracking-tight text-lg">AssetFlow</div>
        </div>
        <div className="relative space-y-5 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">The enterprise asset OS your teams will actually enjoy using.</h2>
          <p className="text-white/80 text-sm">Track every laptop, meeting room, and vehicle. Run audits without spreadsheets. Approve transfers in a tap.</p>
          <div className="grid grid-cols-3 gap-3">
            {[{icon:ShieldCheck,label:"SOC 2"},{icon:LineChart,label:"Real-time reports"},{icon:Users,label:"Multi-tenant"}].map((f, i) => (
              <div key={i} className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <f.icon className="h-4 w-4 mb-2" />
                <div className="text-xs font-medium">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/60">© 2026 AssetFlow, Inc.</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Boxes className="h-5 w-5" /></div>
            <div className="font-semibold">AssetFlow</div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

function LoginPage() {
  const [email, setEmail] = useState("rushikesh@assetflow.co");
  const [password, setPassword] = useState("demo1234");
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/auth/login", { email, password });
      return response.data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("assetflow_token", data.token);
      localStorage.setItem("assetflow_user", JSON.stringify(data));
      queryClient.setQueryData(["user"], data);
      toast.success("Welcome back, " + data.name);
      window.location.href = "/";
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your AssetFlow workspace."
      footer={<>Don't have an account? <Link to="/signup" className="font-medium text-primary hover:underline">Create one</Link></>}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input 
            id="email" 
            type="email" 
            required 
            placeholder="you@company.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox defaultChecked /> Keep me signed in
        </label>
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
        <Button type="button" variant="outline" className="w-full">Continue with SSO</Button>
      </form>
    </AuthShell>
  );
}
