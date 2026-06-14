import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Truck, PauseCircle, CheckCircle2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { statusBadgeClass } from "@/lib/tracking";
import { ShipmentFormModal } from "@/components/ShipmentFormModal";
import { TableRowSkeleton } from "@/components/TableSkeleton";
import { format } from "date-fns";

function safeFormat(value: any, pattern: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  try { return format(d, pattern); } catch { return "—"; }
}

function transportLabel(mode: string | null | undefined) {
  if (mode === "air") return "✈️ Air";
  if (mode === "sea") return "🚢 Sea";
  if (mode === "road") return "🚛 Land";
  return "—";
}

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: counts, refetch: refetchCounts } = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: async () => {
      const statuses = ["", "In-Transit", "On Hold", "Delivered"];
      const [total, transit, hold, delivered] = await Promise.all(
        statuses.map((s) => {
          let q = supabase.from("shipments").select("*", { count: "exact", head: true });
          if (s) q = q.eq("status", s);
          return q;
        }),
      );
      return {
        total: total.count ?? 0,
        transit: transit.count ?? 0,
        hold: hold.count ?? 0,
        delivered: delivered.count ?? 0,
      };
    },
  });

  const { data: recent, refetch: refetchRecent, isLoading: recentLoading } = useQuery({
    queryKey: ["dashboard-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shipments")
        .select("id,tracking_number,receiver_name,description,status,transport_mode,current_location,date_sent,expected_delivery_date,amount_due")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shipments")
        .select("tracking_number,receiver_name,history,updated_at")
        .order("updated_at", { ascending: false })
        .limit(30);
      const entries: Array<{ tracking: string; receiver: string; status: string; location: string; date: string; comments: string }> = [];
      for (const s of data ?? []) {
        const hist: any[] = Array.isArray(s.history) ? (s.history as any[]) : [];
        for (const h of hist) {
          if (!h || typeof h !== "object") continue;
          entries.push({
            tracking: s.tracking_number,
            receiver: s.receiver_name ?? "",
            status: h.status ?? "",
            location: h.location ?? "",
            date: h.date ?? s.updated_at,
            comments: h.comments ?? "",
          });
        }
      }
      return entries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    },
  });

  const kpis = [
    { label: "Total Shipments", value: counts?.total ?? 0, icon: Package, color: "bg-blue-500" },
    { label: "In-Transit", value: counts?.transit ?? 0, icon: Truck, color: "bg-cyan-500" },
    { label: "On Hold", value: counts?.hold ?? 0, icon: PauseCircle, color: "bg-amber-500" },
    { label: "Delivered", value: counts?.delivered ?? 0, icon: CheckCircle2, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Button className="w-full sm:w-auto" onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Register New Shipment
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{k.label}</div>
                <div className="mt-1 text-3xl font-bold">{k.value}</div>
              </div>
              <div className={`${k.color} rounded-lg p-3 text-white`}>
                <k.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b p-5">
          <h3 className="font-semibold">Recent Shipments</h3>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {recentLoading && (
                <TableRowSkeleton
                  columns={9}
                  rows={5}
                  colTypes={["mono", "text", "text", "text", "badge", "text", "text", "text", "text"]}
                />
              )}
              {!recentLoading && (recent ?? []).map((s: any) => (
                <tr key={s.id} className="bg-gray-100 border-t border-white">
                  <td className="px-4 py-6 font-mono text-xs whitespace-nowrap">{s.tracking_number}</td>
                  <td className="px-4 py-6 break-words max-w-[120px]">{s.receiver_name ?? "—"}</td>
                  <td className="px-4 py-6 break-words max-w-[160px]">{s.description ?? "—"}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{transportLabel(s.transport_mode)}</td>
                  <td className="px-4 py-6 min-w-[130px] whitespace-nowrap">
                    <span className={statusBadgeClass(s.status)}>{s.status ?? "—"}</span>
                  </td>
                  <td className="px-4 py-6 break-words max-w-[150px]">{s.current_location ?? "—"}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{safeFormat(s.date_sent, "PP")}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{safeFormat(s.expected_delivery_date, "PP")}</td>
                  <td className="px-4 py-6 whitespace-nowrap">{s.amount_due != null ? s.amount_due : "—"}</td>
                </tr>
              ))}
              {!recentLoading && !recent?.length && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No shipments yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-4 font-semibold">Recent Activity</h3>
        <ul className="space-y-3">
          {(activity ?? []).map((a, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0 flex-1">
                <div className="text-sm">
                  <span className="font-mono text-xs">{a.tracking}</span>
                  {a.receiver ? <span className="text-muted-foreground"> · {a.receiver}</span> : null}
                </div>
                <div className="text-sm">
                  <span className="font-medium">{a.status}</span>
                  {a.location ? <span className="text-muted-foreground"> @ {a.location}</span> : null}
                </div>
                {a.comments && <div className="text-xs text-muted-foreground">{a.comments}</div>}
              </div>
              <div className="text-xs text-muted-foreground">{a.date ? safeFormat(a.date, "PPp") : ""}</div>
            </li>
          ))}
          {!activity?.length && <li className="text-sm text-muted-foreground">No activity yet.</li>}
        </ul>
      </Card>

      <ShipmentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        shipmentId={null}
        onSaved={() => { refetchCounts(); refetchRecent(); }}
      />
    </div>
  );
}
