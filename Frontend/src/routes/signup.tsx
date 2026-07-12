import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up · AssetFlow" }] }),
  component: SignupPage,
});

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();

  const signupMutation = useMutation({
    mutationFn: async () => {
      const name = `${firstName} ${lastName}`.trim();
      const response = await api.post("/auth/signup", { name, email, password });
      return response.data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("assetflow_token", data.token);
      localStorage.setItem("assetflow_user", JSON.stringify(data));
      queryClient.setQueryData(["user"], data);
      toast.success("Welcome, " + data.name);
      window.location.href = "/";
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate();
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up as an employee. Your admin will assign your role."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label>First name</Label>
            <Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Last name</Label>
            <Input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Work email</Label>
          <Input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Password</Label>
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          You'll be added as an <span className="font-medium text-foreground">Employee</span>. Admins assign additional roles later.
        </div>
        <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
