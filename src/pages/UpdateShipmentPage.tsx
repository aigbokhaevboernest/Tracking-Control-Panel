import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MapPin, Edit, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SHIPMENT_STATUSES, statusBadgeClass } from "@/lib/tracking";
import { geocode } from "@/lib/geocode";
import { ShipmentFormModal } from "@/components/ShipmentFormModal";
import { format } from "date-fns";

export default function UpdateShipmentPage() {
  const [updateRow, setUpdateRow] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [amount, setAmount] = useState("");
  const [comments, setComments] = useState("");
  const [date, setDate] = useState("");

  const { data, refetch } = useQuery({
    queryKey: ["update-shipments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shipments")
        .select("id,tracking_number,receiver_name,description,status,current_location,history,amount_due,date_sent,expected_delivery_date")
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
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!updateRow) return;
    setSubmitting(true);
    try {
      const geo = location ? await geocode(location) : null;
      const newHist = [
        ...((updateRow.history as any[]) ?? []),
        { status, location, date, comments },
      ];
      const patch: any = {
        status: status || null,
        current_location: location || null,
        amount_due: amount === "" ? null : Number(amount),
        history: newHist,
      };
      if (geo) {
        patch.current_stop_label = location;
        patch.current_stop_lat = geo.lat;
        patch.current_stop_lng = geo.lng;
      }
      const { error } = await supabase.from("shipments").update(patch).eq("id", updateRow.id);
      if (error) throw error;
      toast.success("Shipment updated");
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
                <th className="px-4 py-6 text-left">Tracking #</th>
                <th className="px-4 py-6 text-left">Receiver</th>
                <th className="px-4 py-6 text-left">Parcel</th>
                <th className="px-4 py-6 text-left">Status</th>
                <th className="px-4 py-6 text-left">Current Location</th>
                <th className="px-4 py-6 text-left">Date Sent</th>
                <th className="px-4 py-6 text-left">Delivery Date</th>
                <th className="px-4 py-6 text-left">Amount</th>
                <th className="px-4 py-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((s: any) => (
                <tr key={s.id} className="bg-gray-100 border-t border-white">
                  <td className="px-4 py-6 font-mono text-xs">{s.tracking_number}</td>
                  <td className="px-4 py-6">{s.receiver_name ?? "—"}</td>
                  <td className="px-4 py-6 max-w-[200px] truncate">{s.description ?? "—"}</td>
                  <td className="px-4 py-6">
                    <Badge variant="outline" className={statusBadgeClass(s.status)}>{s.status ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-6">{s.current_location ?? "—"}</td>
                  <td className="px-4 py-6">{s.date_sent ? format(new Date(s.date_sent), "PP") : "—"}</td>
                  <td className="px-4 py-6">{s.expected_delivery_date ? format(new Date(s.expected_delivery_date), "PP") : "—"}</td>
                  <td className="px-4 py-6">{s.amount_due != null ? `$${s.amount_due}` : "—"}</td>
                  <td className="px-4 py-6">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="w-32 bg-green-600 px-1 text-xs hover:bg-green-700" onClick={() => openUpdate(s)}>
                        <Truck className="mr-1 h-3 w-3" /> Update Loc.
                      </Button>
                      <Button
                        size="sm"
                        className="w-32 bg-blue-600 hover:bg-blue-700"
                        onClick={() => { setEditId(s.id); setEditOpen(true); }}
                      >
                        <Edit className="mr-1 h-3 w-3" /> Edit Info
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.length && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No shipments.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!updateRow} onOpenChange={(v) => !v && setUpdateRow(null)}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-5 py-4 text-white">
            <DialogHeader className="space-y-0">
              <DialogTitle className="flex items-center gap-2 text-white">
                <MapPin className="h-5 w-5" /> Update Location · {updateRow?.tracking_number}
              </DialogTitle>
            </DialogHeader>
          </div>
          <form onSubmit={handleSave} className="space-y-3 p-5">
            <div>
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select status</option>
                {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>Current Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <Label>Amount Due</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Comments</Label>
              <Textarea value={comments} onChange={(e) => setComments(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ShipmentFormModal open={editOpen} onOpenChange={setEditOpen} shipmentId={editId} onSaved={() => refetch()} />
    </div>
  );
}
