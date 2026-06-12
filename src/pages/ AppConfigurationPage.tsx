import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
    supabase
      .from("app_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        setData(data ?? { id: 1 });
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
        .from("app_config")
        .upsert({ ...data, id: 1 });
      if (error) throw error;
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
    </div>
  );

  const paymentMode = data.default_payment_mode ?? "Crypto";
  const cryptoCurrency = data.default_crypto_currency ?? "Bitcoin";

  const currentWallet =
    cryptoCurrency === "Ethereum" ? data.default_eth_wallet ?? ""
    : cryptoCurrency === "USDT"   ? data.default_usdt_wallet ?? ""
    : data.default_btc_wallet ?? "";

  function setWallet(val: string) {
    const key =
      cryptoCurrency === "Ethereum" ? "default_eth_wallet"
      : cryptoCurrency === "USDT"   ? "default_usdt_wallet"
      : "default_btc_wallet";
    set(key, val);
  }

  const cryptoColor =
    cryptoCurrency === "Ethereum" ? "text-indigo-600"
    : cryptoCurrency === "USDT"   ? "text-emerald-600"
    : "text-amber-500";

  const cryptoLabel =
    cryptoCurrency === "Ethereum" ? " Ethereum (ETH)"
    : cryptoCurrency === "USDT"   ? " USDT (Tether)"
    : " Bitcoin (BTC)";

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Hold & Payment Settings</h2>
      <form onSubmit={handleSave} className="space-y-4">

        {/* Support Email */}
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold">Support Contact</h3>
          <div>
            <Label>Support Email</Label>
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
                placeholder="CUSTOM HOLD NOTICE"
              />
            </div>
            <div>
              <Label>Footer Note</Label>
              <Input
                value={data.default_hold_footer ?? ""}
                onChange={(e) => set("default_hold_footer", e.target.value)}
                placeholder="Kindly complete the required payment..."
              />
            </div>
            <div className="md:col-span-2">
              <Label>Reason for Hold (Body)</Label>
              <Textarea
                value={data.default_hold_body ?? ""}
                onChange={(e) => set("default_hold_body", e.target.value)}
                rows={4}
                placeholder="Your package is currently being held by customs..."
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
              { value: "Crypto", label: " Crypto" },
              { value: "Bank",   label: " Bank Transfer" },
            ].map((m) => {
              const active = paymentMode === m.value;
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

          {paymentMode === "Crypto" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Default Crypto Currency</Label>
                <select
                  value={cryptoCurrency}
                  onChange={(e) => set("default_crypto_currency", e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm md:text-sm"
                >
                  <option value="Bitcoin"> Bitcoin (BTC)</option>
                  <option value="Ethereum"> Ethereum (ETH)</option>
                  <option value="USDT"> USDT (Tether)</option>
                </select>
              </div>

              {/* Colour coded currency label */}
              <div className="md:col-span-2">
                <Label>
                  <span className={cryptoColor}>{cryptoLabel}</span> Wallet Address
                </Label>
                <Input
                  value={currentWallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="Wallet address"
                />
              </div>

              {/* Show all three wallet fields so admin can pre-fill all */}
              <div>
                <Label className="text-amber-500">Bitcoin Wallet</Label>
                <Input
                  value={data.default_btc_wallet ?? ""}
                  onChange={(e) => set("default_btc_wallet", e.target.value)}
                  placeholder="BTC wallet address"
                />
              </div>
              <div>
                <Label className="text-indigo-600"> Ethereum Wallet</Label>
                <Input
                  value={data.default_eth_wallet ?? ""}
                  onChange={(e) => set("default_eth_wallet", e.target.value)}
                  placeholder="ETH wallet address"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-emerald-600"> USDT Wallet</Label>
                <Input
                  value={data.default_usdt_wallet ?? ""}
                  onChange={(e) => set("default_usdt_wallet", e.target.value)}
                  placeholder="USDT wallet address"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Payment Instruction Note</Label>
                <Textarea
                  value={data.default_payment_note ?? ""}
                  onChange={(e) => set("default_payment_note", e.target.value)}
                  placeholder="Please send the required payment to the wallet above..."
                />
              </div>
            </div>
          )}

          {paymentMode === "Bank" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={data.default_bank_name ?? ""}
                  onChange={(e) => set("default_bank_name", e.target.value)}
                  placeholder="e.g. Barclays"
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  value={data.default_bank_account_number ?? ""}
                  onChange={(e) => set("default_bank_account_number", e.target.value)}
                  placeholder="12345678"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Account Name</Label>
                <Input
                  value={data.default_bank_account_name ?? ""}
                  onChange={(e) => set("default_bank_account_name", e.target.value)}
                  placeholder="Tranzex Route Logistics Ltd"
                />
              </div>
            </div>
          )}
        </Card>

        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </form>
    </div>
  );
}
