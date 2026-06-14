import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Edit } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SHIPMENT_STATUSES, statusBadgeClass, transportEmoji } from "@/lib/tracking";
import { ShipmentFormModal } from "@/components/ShipmentFormModal";
import { TableRowSkeleton } from "@/components/TableSkeleton";
import { format } from "date-fns";

const PAGE_SIZE = 15;

export default function ShipmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["shipments-list", search, statusFilter, page],
    queryFn: async () => {
      let q = supabase
        .from("shipments")
        .select(
          "id,tracking_number,receiver_name,description,status,transport_mode,current_location,date_sent,expected_delivery_date,amount_due",
          { count: "exact" },
        )
        .order("updated_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`tracking_number.ilike.${s},receiver_name.ilike.${s}`);
      }
      const { data, count } = await q;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold sm:text-2xl">Shipments</h2>
        <Button
          className="w-full sm:w-auto"
          onClick={() => { setEditId(null); setModalOpen(true); }}
        >
          <Plus className="mr-2 h-4 w-4" /> Register New Shipment
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tracking # or receiver…"
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {SHIPMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-6 text-left whitespace-nowrap">Tracking #</th>
                <th className="px-4 py-6 text-left">Receiver</th>
                <th className="px-4 py-6 text-left">Parcel</th>
                <th className="px-4 py-6 text-center whitespace-nowrap">Mode</th>
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
                  colTypes={["mono", "text", "text", "emoji", "badge", "text", "text", "text", "text", "actions"]}
                />
              )}
              {!isLoading && data?.rows.map((s: any) => (
                <tr key={s.id} className="bg-gray-100 border-t border-white">
                  <td className="px-4 py-6 font-mono text-xs whitespace-nowrap">{s.tracking_number}</td>
                  <td className="px-4 py-6 break-words max-w-[120px]">{s.receiver_name ?? "—"}</td>
                  <td className="px-4 py-6 break-words max-w-[160px]">{s.description ?? "—"}</td>
                  <td className="px-4 py-6 text-center text-xl whitespace-nowrap">
                    <span title={s.transport_mode ?? "land"}>
                      {transportEmoji(s.transport_mode ?? "land")}
                    </span>
                  </td>
                  <td className="px-4 py-6 min-w-[130px] whitespace-nowrap">
                    <span className={statusBadgeClass(s.status)}>{s.status ?? "—"}</span>
                  </td>
                  <td className="px-4 py-6 break-words max-w-[150px]">{s.current_location ?? "—"}</td>
                  <td className="px-4 py-6 whitespace-nowrap">
                    {s.date_sent ? format(new Date(s.date_sent), "PP") : "—"}
                  </td>
                  <td className="px-4 py-6 whitespace-nowrap">
                    {s.expected_delivery_date ? format(new Date(s.expected_delivery_date), "PP") : "—"}
                  </td>
                  <td className="px-4 py-6 whitespace-nowrap">
                    {s.amount_due != null ? s.amount_due : "—"}
                  </td>
                  <td className="px-4 py-6">
                    <Button
                      size="sm"
                      className="w-28 bg-blue-600 hover:bg-blue-700"
                      onClick={() => { setEditId(s.id); setModalOpen(true); }}
                    >
                      <Edit className="mr-1 h-3 w-3" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.rows.length && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                    No shipments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
          <div className="text-xs text-muted-foreground">
            {data?.count ?? 0} total · Page {page + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      <ShipmentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        shipmentId={editId}
        onSaved={() => refetch()}
      />
    </div>
  );
}
