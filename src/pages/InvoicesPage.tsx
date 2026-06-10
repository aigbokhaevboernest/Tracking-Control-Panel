import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableRowSkeleton } from "@/components/TableSkeleton";
import { sendMail, buildInvoiceEmail } from "@/lib/sendMail";
import { InvoicePrint } from "@/components/InvoicePrint";

const SETTINGS_ID = 1;

export default function InvoicesPage() {
  const [preview, setPreview] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices-shipments"],
    queryFn: async () => {
      const { data } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    supabase
      .from("hold_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle()
      .then(({ data }) => setSettings(data));
  }, []);

  async function sendInvoice() {
    if (!preview) return;
    if (!preview.receiver_email) {
      toast.error("No receiver email on this shipment");
      setPreview(null);
      return;
    }
    setSending(true);
    try {
      const tpl = buildInvoiceEmail(
        {
          tracking_number: preview.tracking_number,
          sender_name: preview.sender_name,
          sender_country: preview.sender_country,
          receiver_name: preview.receiver_name,
          receiver_email: preview.receiver_email,
          receiver_country: preview.receiver_country,
          package_type: preview.package_type,
          weight: preview.weight,
          description: preview.description,
          origin_label: preview.origin_label,
          destination_label: preview.destination_label,
          date_sent: preview.date_sent,
          expected_delivery_date: preview.expected_delivery_date,
          amount_due: preview.amount_due,
          status: preview.status,
          comments: preview.comments,
          current_location: preview.current_location,
          payment_mode: preview.payment_mode,
        },
        {
          name: settings?.company_name ?? "Tranzex Route Logistics",
          address: settings?.company_address,
          email: settings?.company_email,
          logo: settings?.company_logo_url,
        },
      );
      const res = await sendMail({
        email: preview.receiver_email,
        subject: tpl.subject,
        first_name: preview.receiver_name?.split(" ")[0] ?? "",
        message: tpl.message,
      });
      if (res.success) {
        toast.success(`Invoice sent to ${preview.receiver_email} successfully`);
        setPreview(null);
      } else {
        toast.error("Failed to send invoice", { description: res.error });
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Invoices</h2>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-6 text-left">Tracking #</th>
                <th className="px-4 py-6 text-left">Receiver</th>
                <th className="px-4 py-6 text-left">Email</th>
                <th className="px-4 py-6 text-left">Amount</th>
                <th className="px-4 py-6 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableRowSkeleton columns={5} rows={5} />}
              {!isLoading && (data ?? []).map((s: any) => (
                <tr key={s.id} className="bg-gray-100 border-t border-white">
                  <td className="px-4 py-6 font-mono text-xs">{s.tracking_number}</td>
                  <td className="px-4 py-6">{s.receiver_name ?? "—"}</td>
                  <td className="px-4 py-6 text-xs">{s.receiver_email ?? "—"}</td>
                  <td className="px-4 py-6">{s.amount_due != null ? s.amount_due : "—"}</td>
                  <td className="px-4 py-6">
                    <Button
                      size="sm"
                      className="min-h-[48px] px-3 py-3 text-[13px]"
                      onClick={() => setPreview(s)}
                    >
                      <Mail className="mr-1 h-3 w-3" /> Generate Invoice
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.length && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No shipments.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <InvoicePrint
        open={!!preview}
        onClose={() => setPreview(null)}
        shipment={preview}
        onSend={sendInvoice}
        sending={sending}
      />
    </div>
  );
}
