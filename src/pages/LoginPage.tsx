import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Package, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session && isAdmin) return <Navigate to="/admin" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Verify admin
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) {
        await supabase.auth.signOut();
        toast.error("Access denied", { description: "This account is not an admin." });
        return;
      }
      toast.success("Welcome back");
      navigate("/admin", { replace: true });
    } catch (err: any) {
      toast.error("Sign in failed", { description: err?.message ?? "Check your credentials." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img
            src="https://nzideivdechbxhepmlvz.supabase.co/storage/v1/object/public/shipment-assets/Tranzexroute.PNG"
            alt="Tranzex Route"
            className="h-16 w-16 object-contain"
          />
          <h1 className="text-2xl font-bold">Admin Sign In</h1>
          <p className="text-sm text-muted-foreground">Shipment Tracking Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
