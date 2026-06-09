import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save, Settings2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface SettingsRow {
  key: string;
  value: string;
}

const KEYS = [
  "support_email",
  "hold_headline",
  "hold_body",
  "hold_footer",
  "crypto_wallet",
  "crypto_instruction",
  "bank_name",
  "bank_account_number",
  "bank_account_name",
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", KEYS);

      if (error) {
        toast.error("Failed to load settings");
      } else {
        const map: Record<string, string> = {};
        (data as SettingsRow[]).forEach((r) => (map[r.key] = r.value ?? ""));
        setValues(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  function set(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    const upserts = KEYS.map((key) => ({ key, value: values[key] ?? "" }));
    const { error } = await supabase.from("settings").upsert(upserts, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Save failed", { description: error.message });
    } else {
      toast.success("Settings saved");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <Settings2 className="h-6 w-6 text-violet-600" /> Settings
      </h2>

      <Card className="p-6 space-y-8">

        {/* ── Header: Contact Support ── */}
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-600">
              Header
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shown at the top of all outgoing emails.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="support_email">Contact Support Email</Label>
            <Input
              id="support_email"
              type="email"
              placeholder="support@yourdomain.com"
              value={values.support_email ?? ""}
              onChange={(e) => set("support_email", e.target.value)}
            />
          </div>
        </section>

        <Separator />

        {/* ── Default Hold Notice ── */}
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-600">
              Default Hold Notice
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pre-filled content used when sending a hold notification.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hold_headline">Headline</Label>
            <Input
              id="hold_headline"
              placeholder="e.g. Your shipment is on hold"
              value={values.hold_headline ?? ""}
              onChange={(e) => set("hold_headline", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hold_body">Reason for Hold</Label>
            <Textarea
              id="hold_body"
              rows={4}
              placeholder="Explain the reason this shipment is being held…"
              value={values.hold_body ?? ""}
              onChange={(e) => set("hold_body", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hold_footer">Footer Note</Label>
            <Input
              id="hold_footer"
              placeholder="e.g. Contact us if you have any questions."
              value={values.hold_footer ?? ""}
              onChange={(e) => set("hold_footer", e.target.value)}
            />
          </div>
        </section>

        <Separator />

        {/* ── Default Crypto Payment ── */}
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-600">
              Default Crypto Payment
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crypto payment details included in payment request emails.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="crypto_wallet">Wallet Address</Label>
            <Input
              id="crypto_wallet"
              placeholder="e.g. 0xABC123…"
              value={values.crypto_wallet ?? ""}
              onChange={(e) => set("crypto_wallet", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="crypto_instruction">Instruction Note</Label>
            <Textarea
              id="crypto_instruction"
              rows={3}
              placeholder="e.g. Send exact amount in USDT (TRC-20). Include tracking number in memo."
              value={values.crypto_instruction ?? ""}
              onChange={(e) => set("crypto_instruction", e.target.value)}
            />
          </div>
        </section>

        <Separator />

        {/* ── Default Bank Payment ── */}
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-600">
              Default Bank Payment
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bank transfer details included in payment request emails.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input
              id="bank_name"
              placeholder="e.g. Chase Bank"
              value={values.bank_name ?? ""}
              onChange={(e) => set("bank_name", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bank_account_number">Account Number</Label>
            <Input
              id="bank_account_number"
              placeholder="e.g. 000123456789"
              value={values.bank_account_number ?? ""}
              onChange={(e) => set("bank_account_number", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bank_account_name">Account Name</Label>
            <Input
              id="bank_account_name"
              placeholder="e.g. Acme Logistics LLC"
              value={values.bank_account_name ?? ""}
              onChange={(e) => set("bank_account_name", e.target.value)}
            />
          </div>
        </section>

        {/* ── Save ── */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
