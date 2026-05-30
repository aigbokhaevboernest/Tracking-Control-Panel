import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import { Package, MapPin, Clock, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { statusBadgeClass } from "@/lib/tracking";
import { format } from "date-fns";

// Fix default marker icon for Leaflet
const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function TrackingPage() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackingNumber) return;
    supabase
      .from("shipments")
      .select("*")
      .eq("tracking_number", trackingNumber)
      .maybeSingle()
      .then(({ data }) => {
        setShipment(data);
        setLoading(false);
      });
  }, [trackingNumber]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  if (!shipment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-bold">Tracking not found</h1>
          <p className="text-sm text-muted-foreground">No shipment with number {trackingNumber}</p>
        </div>
      </div>
    );
  }

  const points = [
    shipment.origin_lat && [shipment.origin_lat, shipment.origin_lng, shipment.origin_label],
    shipment.current_stop_lat && [shipment.current_stop_lat, shipment.current_stop_lng, shipment.current_stop_label],
    shipment.destination_lat && [shipment.destination_lat, shipment.destination_lng, shipment.destination_label],
  ].filter(Boolean) as Array<[number, number, string]>;

  const center = points[Math.floor(points.length / 2)]
    ? [points[Math.floor(points.length / 2)][0], points[Math.floor(points.length / 2)][1]] as [number, number]
    : ([20, 0] as [number, number]);

  const isHold = shipment.status === "On Hold";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Package className="h-7 w-7 text-primary" />
          <div>
            <div className="font-bold">Shipment Tracking</div>
            <div className="font-mono text-sm text-muted-foreground">{shipment.tracking_number}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Current Status</div>
              <Badge variant="outline" className={`mt-1 text-base ${statusBadgeClass(shipment.status)}`}>
                {shipment.status ?? "—"}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Current Location</div>
              <div className="font-medium">{shipment.current_location ?? "—"}</div>
            </div>
          </div>
        </div>

        {isHold && (
          <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-6">
            <h2 className="text-lg font-bold text-amber-900">{shipment.hold_headline ?? "Customs Hold"}</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-amber-800">{shipment.hold_body}</p>
            {shipment.hold_amount && (
              <p className="mt-2 font-semibold text-amber-900">Amount: {shipment.hold_amount}</p>
            )}
            {shipment.hold_footer_note && <p className="mt-2 text-xs text-amber-700">{shipment.hold_footer_note}</p>}
            {shipment.hold_contact_email && (
              <p className="mt-1 text-xs text-amber-700">Contact: {shipment.hold_contact_email}</p>
            )}
          </div>
        )}

        {points.length > 0 && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <MapContainer center={center} zoom={3} style={{ height: 400, width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {points.map((p, i) => (
                <Marker key={i} position={[p[0], p[1]]} icon={icon}>
                  <Popup>{p[2]}</Popup>
                </Marker>
              ))}
              {points.length > 1 && (
                <Polyline positions={points.map((p) => [p[0], p[1]] as [number, number])} color="#2563eb" />
              )}
            </MapContainer>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4" /> Route</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Origin</dt><dd>{shipment.origin_label ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Current Stop</dt><dd>{shipment.current_stop_label ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Destination</dt><dd>{shipment.destination_label ?? "—"}</dd></div>
            </dl>
          </div>
          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" /> Package</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd>{shipment.package_type ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Weight</dt><dd>{shipment.weight ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Date Sent</dt><dd>{shipment.date_sent ? format(new Date(shipment.date_sent), "PP") : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Expected</dt><dd>{shipment.expected_delivery_date ? format(new Date(shipment.expected_delivery_date), "PP") : "—"}</dd></div>
            </dl>
          </div>
        </div>

        {shipment.show_image && shipment.package_image_url && (
          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-3 font-semibold">Package Image</h3>
            <img src={shipment.package_image_url} alt="Package" className="max-h-80 rounded-lg" />
          </div>
        )}

        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><Clock className="h-4 w-4" /> Tracking History</h3>
          <ol className="space-y-3">
            {((shipment.history as any[]) ?? []).slice().reverse().map((h, i) => (
              <li key={i} className="flex gap-3 border-l-2 border-primary pl-4">
                <div className="flex-1">
                  <div className="font-medium">{h.status}</div>
                  <div className="text-sm text-muted-foreground">{h.location}</div>
                  {h.comments && <div className="text-xs text-muted-foreground">{h.comments}</div>}
                </div>
                <div className="text-xs text-muted-foreground">{h.date ? format(new Date(h.date), "PP") : ""}</div>
              </li>
            ))}
            {!((shipment.history as any[]) ?? []).length && (
              <li className="text-sm text-muted-foreground">No history yet.</li>
            )}
          </ol>
        </div>
      </main>
    </div>
  );
}
