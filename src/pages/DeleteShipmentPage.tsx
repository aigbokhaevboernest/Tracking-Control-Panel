import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { statusBadgeClass } from "@/lib/tracking";
import { TableRowSkeleton } from "@/components/TableSkeleton";
import { format } from "date-fns";

function transportLabel(mode: string | null | undefined) {
  if (mode === "air") return "✈️ Air";
  if (mode === "sea") return "🚢 Sea";
  if (mode === "road") return "🚛 Land";
  return "—";
}

export default function DeleteShipmentPage() {
  const [confirm, setConfirm] = useState<{ id: string; tracking: string } | null>(null);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["delete-shipments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shipments")
        .select("id,tracking_number,receiver_name,description,status,transport_mode,current_location,date_sent,expected_delivery_date,amount_due")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function doDelete() {
    if (!confirm) return;
    const { error } = await supabase.from("shipments").delete().eq("id", confirm.id);
    if (error) toast.error("Delete failed", { description: error.message });
    else toast.success(`Deleted ${confirm.tracking}`);
    setConfirm(null);
    refetch();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Delete Shipment</h2>
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-6 text-left whitespace-nowrap">Tracking #</th>
                <th className="px-4 py-6 text-left">Receiver</th>
                <th className="px-4 py-6 text-left">Parcel</th>
                <th className="px-4 py-6 text-left whitespace-nowrap">Mode</th>
                <th className="px-4 py-6 text-left min-w-[130px] whitespace-nowrap">Status</th>
                <th className="px-4 py-6 text-left">Current Location</th>
                <th className="px-4 py-6 text-left whitespace-nowrap">Date Sent</th>
                <th className="px-4 py-6 text-left whitespace-nowrap">Delivery Date</th>
                <th className="px-4 py-6 text-left">Amount</th>
                <th className="px-4 py-6 text-left whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <TableRowSkeleton
                  columns={10}
                  rows={5}
                  colTypes={["mono", "text", "text", "text", "badge", "text", "text", "text", "text", "actions"]}
                />
              )}
              {!isLoading && (data ?? []).map((s: any) => (
                <tr key={s.id} className="bg-gray-100 border-t border-white">
                  <td className="px-4 py-6 font-mono text-xs whitespace-nowrap">{s.tracking_number}</td>
                  <td className="px-4 py-6 break-words max-w-[120px]">{s.receiver_name ?? "—"}</td>
                  <td className="px-4 py-6 break-words max-w-[160px]">{s.description ?? "—"}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{transportLabel(s.transport_mode)}</td>
                  <td className="px-4 py-6 min-w-[130px] whitespace-nowrap">
                    <span className={statusBadgeClass(s.status)}>{s.status ?? "—"}</span>
                  </td>
                  <td className="px-4 py-6 break-words max-w-[150px]">{s.current_location ?? "—"}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{s.date_sent ? format(new Date(s.date_sent), "PP") : "—"}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{s.expected_delivery_date ? format(new Date(s.expected_delivery_date), "PP") : "—"}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{s.amount_due != null ? s.amount_due : "—"}</td>
                  <td className="px-4 py-6">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-32"
                      onClick={() => setConfirm({ id: s.id, tracking: s.tracking_number })}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.length && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">No shipments.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shipment {confirm?.tracking}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
