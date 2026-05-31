import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import JsBarcode from "jsbarcode";
import { Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function InvoicesPage() {
  const [printing, setPrinting] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);

  const { data } = useQuery({
    queryKey: ["invoices-shipments"],
    queryFn: async () => {
      const { data } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    supabase.from("hold_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setSettings(data));
  }, []);

  useEffect(() => {
    if (!printing) return;
    // Wait for DOM render
    const timer = setTimeout(() => {
      if (barcodeRef.current) {
        try {
          JsBarcode(barcodeRef.current, printing.tracking_number, { height: 60, displayValue: true, fontSize: 14 });
        } catch {}
      }
      // Wait again for barcode to paint
      setTimeout(() => {
        window.print();
        setPrinting(null);
      }, 250);
    }, 100);
    return () => clearTimeout(timer);
  }, [printing]);

  return (
    <>
      <div className="space-y-4 print:hidden">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-6 text-left">Tracking #</th>
                  <th className="px-4 py-6 text-left">Receiver</th>
                  <th className="px-4 py-6 text-left">Amount</th>
                  <th className="px-4 py-6 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((s: any) => (
                  <tr key={s.id} className="bg-gray-100 border-t border-white">
                    <td className="px-4 py-6 font-mono text-xs">{s.tracking_number}</td>
                    <td className="px-4 py-6">{s.receiver_name ?? "—"}</td>
                    <td className="px-4 py-6">{s.amount_due != null ? `$${s.amount_due}` : "—"}</td>
                    <td className="px-4 py-6">
                      <Button size="sm" className="w-32" onClick={() => setPrinting(s)}>
                        <Printer className="mr-1 h-3 w-3" /> Generate
                      </Button>
                    </td>
                  </tr>
                ))}
                {!data?.length && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No shipments.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {printing && (
        <div id="invoice-print-content" className="fixed inset-0 z-50 hidden overflow-auto bg-white p-8 print:block">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                {settings?.company_logo_url && (
                  <img src={settings.company_logo_url} alt="logo" className="h-16 mb-2" />
                )}
                <h1 className="text-2xl font-bold">{settings?.company_name ?? "Shipment Co."}</h1>
                <div className="text-sm text-gray-600">{settings?.company_address}</div>
                <div className="text-sm text-gray-600">{settings?.company_email}</div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold">INVOICE</h2>
                <div className="my-2 text-2xl font-bold tracking-wide">{printing.tracking_number}</div>
                <svg ref={barcodeRef} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <h3 className="mb-2 font-bold uppercase">Sender</h3>
                <div className="text-sm">{printing.sender_name}</div>
                <div className="text-sm">{printing.sender_phone}</div>
                <div className="text-sm">{printing.sender_email}</div>
                <div className="text-sm">{printing.sender_address}</div>
                <div className="text-sm">{printing.sender_country}</div>
              </div>
              <div>
                <h3 className="mb-2 font-bold uppercase">Receiver</h3>
                <div className="text-sm">{printing.receiver_name}</div>
                <div className="text-sm">{printing.receiver_phone}</div>
                <div className="text-sm">{printing.receiver_email}</div>
                <div className="text-sm">{printing.receiver_address}</div>
                <div className="text-sm">{printing.receiver_country}</div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 font-bold uppercase">Package</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="py-1 font-medium">Type</td><td>{printing.package_type}</td></tr>
                  <tr><td className="py-1 font-medium">Weight</td><td>{printing.weight}</td></tr>
                  <tr><td className="py-1 font-medium">Description</td><td>{printing.description}</td></tr>
                  <tr><td className="py-1 font-medium">Date Sent</td><td>{printing.date_sent ? format(new Date(printing.date_sent), "PP") : "—"}</td></tr>
                  <tr><td className="py-1 font-medium">Expected Delivery</td><td>{printing.expected_delivery_date ? format(new Date(printing.expected_delivery_date), "PP") : "—"}</td></tr>
                  <tr><td className="py-1 font-medium">Status</td><td>{printing.status}</td></tr>
                  <tr><td className="py-1 font-medium">Amount Due</td><td>${printing.amount_due ?? 0}</td></tr>
                  <tr><td className="py-1 font-medium">Payment Mode</td><td>{printing.payment_mode}</td></tr>
                  <tr><td className="py-1 font-medium">Comments</td><td>{printing.comments}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="mt-10 border-t pt-4 text-center text-sm italic text-gray-600">
              We apologize for any inconvenience caused
            </div>
          </div>
        </div>
      )}
    </>
  );
}
