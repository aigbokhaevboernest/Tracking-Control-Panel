import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SETTINGS_ID = 1;

export default function HoldSettingsPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("hold_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle()
      .then(({ data }) => {
        setData(data ?? { id: SETTINGS_ID });
        setLoading(false);
      });
  }, []);

  function set(key: string, v: any) {
    setData((d: any) => ({ ...d, [key]: v }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("hold_settings")
        .upsert({ ...data, id: SETTINGS_ID });
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

        {/* Support Mail */}
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold">Support Mail</h3>
          <div>
            <Label>Contact Support Email</Label>
            <Input
              type="email"
              value={data.support_email ?? ""}
              onChange={(e) => set("support_email", e.target.value)}
              placeholder="support@yourdomain.com"
            />
          </div>
        </Card>

        {/* Default Hold Notice */}
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold">Default Hold Notice</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Headline</Label>
              <Input
                value={data.default_hold_headline ?? ""}
                onChange={(e) => set("default_hold_headline", e.target.value)}
              />
            </div>
            <div>
              <Label>Footer Note</Label>
              <Input
                value={data.default_hold_footer ?? ""}
                onChange={(e) => set("default_hold_footer", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Reason for Hold</Label>
              <Textarea
                value={data.default_hold_body ?? ""}
                onChange={(e) => set("default_hold_body", e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </Card>

        {/* Default Payment Method */}
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold">Default Payment Method</h3>

          {/* Payment Mode Toggle */}
          <div className="flex w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {[
              { value: "Crypto", label: "Crypto" },
              { value: "Bank",   label: "Bank Transfer" },
            ].map((m) => {
              const active = (data.default_payment_mode ?? "Crypto") === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => set("default_payment_mode", m.value)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {(data.default_payment_mode ?? "Crypto") === "Crypto" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Crypto Currency</Label>
                <select
                  value={data.default_crypto_currency ?? "Bitcoin"}
                  onChange={(e) => set("default_crypto_currency", e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm md:text-sm"
                >
                  <option value="Bitcoin">Bitcoin</option>
                  <option value="Ethereum">Ethereum</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>{data.default_crypto_currency ?? "Bitcoin"} Wallet Address</Label>
                <Input
                  value={
                    (data.default_crypto_currency === "Ethereum"
                      ? data.default_eth_wallet
                      : data.default_crypto_currency === "USDT"
                      ? data.default_usdt_wallet
                      : data.default_btc_wallet) ?? ""
                  }
                  onChange={(e) => {
                    const cur = data.default_crypto_currency ?? "Bitcoin";
                    const key =
                      cur === "Ethereum" ? "default_eth_wallet"
                      : cur === "USDT"   ? "default_usdt_wallet"
                      : "default_btc_wallet";
                    set(key, e.target.value);
                  }}
                  placeholder="Wallet address"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Instruction Note</Label>
                <Textarea
                  value={data.default_payment_note ?? ""}
                  onChange={(e) => set("default_payment_note", e.target.value)}
                />
              </div>
            </div>
          )}

          {(data.default_payment_mode ?? "Crypto") === "Bank" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={data.default_bank_name ?? ""}
                  onChange={(e) => set("default_bank_name", e.target.value)}
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  value={data.default_bank_account_number ?? ""}
                  onChange={(e) => set("default_bank_account_number", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Account Name</Label>
                <Input
                  value={data.default_bank_account_name ?? ""}
                  onChange={(e) => set("default_bank_account_name", e.target.value)}
                />
              </div>
            </div>
          )}
        </Card>


        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Settings
        </Button>
      </form>
    </div>
  );
}
