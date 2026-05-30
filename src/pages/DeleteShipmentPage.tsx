import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { statusBadgeClass } from "@/lib/tracking";

export default function DeleteShipmentPage() {
  const [confirm, setConfirm] = useState<{ id: string; tracking: string } | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["delete-shipments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shipments")
        .select("id,tracking_number,receiver_name,status,current_location")
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
                <th className="px-4 py-6 text-left">Tracking #</th>
                <th className="px-4 py-6 text-left">Receiver</th>
                <th className="px-4 py-6 text-left">Status</th>
                <th className="px-4 py-6 text-left">Location</th>
                <th className="px-4 py-6 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((s) => (
                <tr key={s.id} className="bg-gray-100 border-t border-white">
                  <td className="px-4 py-6 font-mono text-xs">{s.tracking_number}</td>
                  <td className="px-4 py-6">{s.receiver_name ?? "—"}</td>
                  <td className="px-4 py-6">
                    <Badge variant="outline" className={statusBadgeClass(s.status)}>{s.status ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-6">{s.current_location ?? "—"}</td>
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
              {!data?.length && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No shipments.</td></tr>
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
