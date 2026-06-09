import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function HoldSettingsPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("hold_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      setData(data ?? { id: 1 });
      setLoading(false);
    });
  }, []);

  function set(key: string, v: any) { setData((d: any) => ({ ...d, [key]: v })); }

  async function handleLogo(file: File) {
    const ext = file.name.split(".").pop();
    const filename = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("package-images").upload(filename, file);
    if (error) { toast.error(error.message); return; }
    const { data: pub } = supabase.storage.from("package-images").getPublicUrl(filename);
    set("company_logo_url", pub.publicUrl);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("hold_settings").upsert({ ...data, id: 1 });
      if (error) throw error;
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Hold Settings</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold">Company</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Name</Label><Input value={data.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={data.company_email ?? ""} onChange={(e) => set("company_email", e.target.value)} /></div>
            <div className="md:col-span-2"><Label>Address</Label><Textarea value={data.company_address ?? ""} onChange={(e) => set("company_address", e.target.value)} /></div>
            <div className="md:col-span-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50">
                  <Upload className="h-4 w-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} />
                </label>
                {data.company_logo_url && <img src={data.company_logo_url} alt="logo" className="h-12 rounded border" />}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="font-semibold">Default Hold Notice</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Headline</Label><Input value={data.default_hold_headline ?? ""} onChange={(e) => set("default_hold_headline", e.target.value)} /></div>
            <div><Label>Footer Note</Label><Input value={data.default_hold_footer ?? ""} onChange={(e) => set("default_hold_footer", e.target.value)} /></div>
            <div className="md:col-span-2"><Label>Body</Label><Textarea value={data.default_hold_body ?? ""} onChange={(e) => set("default_hold_body", e.target.value)} rows={4} /></div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="font-semibold">Default Crypto Payment</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><Label>Wallet Address</Label><Input value={data.default_crypto_wallet ?? ""} onChange={(e) => set("default_crypto_wallet", e.target.value)} /></div>
            <div className="md:col-span-2"><Label>Instruction Note</Label><Textarea value={data.default_payment_note ?? ""} onChange={(e) => set("default_payment_note", e.target.value)} /></div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="font-semibold">Default Bank Payment</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Bank Name</Label><Input value={data.default_bank_name ?? ""} onChange={(e) => set("default_bank_name", e.target.value)} /></div>
            <div><Label>Account Number</Label><Input value={data.default_bank_account_number ?? ""} onChange={(e) => set("default_bank_account_number", e.target.value)} /></div>
            <div className="md:col-span-2"><Label>Account Name</Label><Input value={data.default_bank_account_name ?? ""} onChange={(e) => set("default_bank_account_name", e.target.value)} /></div>
          </div>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Settings
        </Button>
      </form>
    </div>
  );
}
