import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableRowSkeleton } from "@/components/TableSkeleton";
import { sendMail, buildInvoiceEmail } from "@/lib/sendMail";

export default function InvoicesPage() {
  const [target, setTarget] = useState<any>(null);
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
    supabase.from("hold_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setSettings(data));
  }, []);

  async function sendInvoice() {
    if (!target) return;
    if (!target.receiver_email) {
      toast.error("No receiver email on this shipment");
      setTarget(null);
      return;
    }
    setSending(true);
    try {
      const tpl = buildInvoiceEmail(
        {
          tracking_number: target.tracking_number,
          sender_name: target.sender_name,
          sender_country: target.sender_country,
          receiver_name: target.receiver_name,
          receiver_email: target.receiver_email,
          receiver_country: target.receiver_country,
          package_type: target.package_type,
          weight: target.weight,
          description: target.description,
          origin_label: target.origin_label,
          destination_label: target.destination_label,
          date_sent: target.date_sent,
          expected_delivery_date: target.expected_delivery_date,
          amount_due: target.amount_due,
          status: target.status,
          comments: target.comments,
          current_location: target.current_location,
          payment_mode: target.payment_mode,
        },
        {
          name: settings?.company_name ?? "Tranzex Route Logistics",
          address: settings?.company_address,
          email: settings?.company_email,
          logo: settings?.company_logo_url,
        },
      );
      const res = await sendMail({
        email: target.receiver_email,
        subject: tpl.subject,
        first_name: target.receiver_name?.split(" ")[0] ?? "",
        message: tpl.message,
      });
      if (res.success) {
        toast.success(`Invoice sent to ${target.receiver_email} successfully`);
        setTarget(null);
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
                  <td className="px-4 py-6">{s.amount_due != null ? `$${s.amount_due}` : "—"}</td>
                  <td className="px-4 py-6">
                    <Button
                      size="sm"
                      className="min-h-[48px] px-3 py-3 text-[13px]"
                      onClick={() => setTarget(s)}
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

      <AlertDialog open={!!target} onOpenChange={(v) => !v && !sending && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              This invoice will be sent to{" "}
              <span className="font-semibold text-foreground">
                {target?.receiver_email ?? "the receiver"}
              </span>
              . Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); sendInvoice(); }} disabled={sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
