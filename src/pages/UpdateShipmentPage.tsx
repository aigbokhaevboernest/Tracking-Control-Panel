import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { Loader2, MapPin, Edit, Truck, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { statusBadgeClass, statusesForMode } from "@/lib/tracking";
import { geocode } from "@/lib/geocode";
import { ShipmentFormModal } from "@/components/ShipmentFormModal";
import { ConfirmNotifyModal } from "@/components/ConfirmNotifyModal";
import { TableRowSkeleton } from "@/components/TableSkeleton";
import { sendMail, buildStatusEmail } from "@/lib/sendMail";
import { format } from "date-fns";

export default function UpdateShipmentPage() {
  const [updateRow, setUpdateRow] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [amount, setAmount] = useState("");
  const [comments, setComments] = useState("");
  const [date, setDate] = useState("");

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["update-shipments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shipments")
        .select("id,tracking_number,receiver_name,receiver_email,description,status,transport_mode,current_location,history,amount_due,date_sent,expected_delivery_date,destination_label")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  function openUpdate(row: any) {
    setUpdateRow(row);
    setStatus(row.status ?? "");
    setLocation(row.current_location ?? "");
    setAmount(row.amount_due != null ? String(row.amount_due) : "");
    setComments("");
    setDate(row.expected_delivery_date ? String(row.expected_delivery_date).slice(0, 10) : "");
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!updateRow) return;
    setConfirmOpen(true);
  }

  async function doSave(sendEmailFlag: boolean) {
    if (!updateRow) return;
    setSubmitting(true);
    try {
      const geo = location ? await geocode(location) : null;
      const newHist = [
        ...((updateRow.history as any[]) ?? []),
        { status, location, date, comments },
      ];
      const patch: any = {
  history: newHist,
};

if (status) patch.status = status;
if (location) patch.current_location = location;
if (date) patch.expected_delivery_date = date;

// Only update amount_due if user actually changed it
if (amount !== "") patch.amount_due = amount;

if (geo) {
  patch.current_stop_label = location;
  patch.current_stop_lat = geo.lat;
  patch.current_stop_lng = geo.lng;
}

      const { error } = await supabase.from("shipments").update(patch).eq("id", updateRow.id);
      if (error) throw error;
      toast.success("Shipment updated");

      if (sendEmailFlag && updateRow.receiver_email) {
        const tpl = buildStatusEmail(status, {
          tracking_number: updateRow.tracking_number,
          receiver_name: updateRow.receiver_name,
          current_location: location,
          destination_label: updateRow.destination_label,
          expected_delivery_date: date || updateRow.expected_delivery_date,
          
        });
        if (tpl) {
          const res = await sendMail({
            email: updateRow.receiver_email,
            subject: tpl.subject,
            first_name: updateRow.receiver_name?.split(" ")[0] ?? "",
            message: tpl.message,
          });
          if (res.success) toast.success("Email sent to consignee");
          else toast.error("Email failed", { description: res.error });
        } else {
          toast.info("No email template for this status");
        }
      }

      setUpdateRow(null);
      refetch();
    } catch (err: any) {
      toast.error("Update failed", { description: err?.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Update Shipment</h2>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-6 text-left whitespace-nowrap">Tracking #</th>
                <th className="px-4 py-6 text-left">Receiver</th>
                <th className="px-4 py-6 text-left">Parcel</th>
                <th className="px-4 py-6 text-left min-w-[130px] whitespace-nowrap">Status</th>
                <th className="px-4 py-6 text-left">Current Location</th>
                <th className="px-4 py-6 text-left whitespace-nowrap">Date Sent</th>
                <th className="px-4 py-6 text-left whitespace-nowrap">Delivery Date</th>
                <th className="px-4 py-6 text-left">Amount Due</th>
                <th className="px-4 py-6 text-left whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableRowSkeleton columns={9} rows={5} />}
              {!isLoading && (data ?? []).map((s: any) => (
                <tr key={s.id} className="bg-gray-100 border-t border-white">
                  <td className="px-4 py-6 font-mono text-xs whitespace-nowrap">{s.tracking_number}</td>
                  <td className="px-4 py-6 break-words max-w-[120px]">{s.receiver_name ?? "—"}</td>
                  <td className="px-4 py-6 break-words max-w-[160px]">{s.description ?? "—"}</td>
                  <td className="px-4 py-6 min-w-[130px] whitespace-nowrap">
                    <span className={statusBadgeClass(s.status)}>{s.status ?? "—"}</span>
                  </td>
                  <td className="px-4 py-6 break-words max-w-[150px]">{s.current_location ?? "—"}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{s.date_sent ? format(new Date(s.date_sent), "PP") : "—"}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{s.expected_delivery_date ? format(new Date(s.expected_delivery_date), "PP") : "—"}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{s.amount_due != null ? s.amount_due : "—"}</td>
                  <td className="px-4 py-6">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="w-[90px] min-h-[48px] bg-green-600 px-3 py-2 text-[13px] leading-tight hover:bg-green-700 whitespace-normal text-center"
                        onClick={() => openUpdate(s)}
                      >
                        <Truck className="mr-1 h-3 w-3 shrink-0" /> Update Location
                      </Button>
                      <Button
                        size="sm"
                        className="w-[90px] h-[36px] bg-blue-600 px-3 text-[13px] hover:bg-blue-700"
                        onClick={() => { setEditId(s.id); setEditOpen(true); }}
                      >
                        <Edit className="mr-1 h-3 w-3" /> Edit Info
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.length && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No shipments.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!!updateRow && createPortal(
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.55)" }}
            onClick={() => setUpdateRow(null)}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            width: "calc(100vw - 32px)",
            maxWidth: 520,
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
            background: "#fff",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              flexShrink: 0,
              background: "linear-gradient(90deg,#7c3aed,#6d28d9)",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15 }}>
                <MapPin size={18} />
                <span>Update Location · {updateRow?.tracking_number}</span>
              </div>
              <button
                type="button"
                onClick={() => setUpdateRow(null)}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", color: "#fff", display: "flex" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 24px" }}>
              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <Label>Status</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ fontSize: 16, marginTop: 4, width: "100%", height: 44, borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "0 12px" }}
                  >
                    <option value="">Select status</option>
                    {statusesForMode(updateRow?.transport_mode).map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Current Location</Label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ fontSize: 16, marginTop: 4, width: "100%", height: 44, borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "0 12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <Label>Amount Due</Label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ fontSize: 16, marginTop: 4, width: "100%", height: 44, borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "0 12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <Label>Estimated Delivery Date (YYYY-MM-DD)</Label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    style={{ fontSize: 16, marginTop: 4, width: "100%", height: 44, borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "0 12px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <Label>Comments</Label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    style={{ fontSize: 16, marginTop: 4, width: "100%", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", padding: "10px 12px", boxSizing: "border-box", resize: "vertical" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "13px 0",
                    background: submitting ? "#7c3aed99" : "#7c3aed",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? "Saving…" : "Save"}
                </button>
              </form>
            </div>
          </div>
        </>,
        document.body
      )}

      <ShipmentFormModal open={editOpen} onOpenChange={setEditOpen} shipmentId={editId} onSaved={() => refetch()} />

      <ConfirmNotifyModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={async (send) => { await doSave(send); }}
      />
    </div>
  );
}
