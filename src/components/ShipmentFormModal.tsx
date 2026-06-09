import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
 Search,
 Copy,
 Printer,
 CheckCircle2,
 Undo2,
 AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import BoldChip from "@/components/BoldChip";
import Row from "@/components/Row";
import PartyCard from "@/components/PartyCard";
import Stepper, { getStepColor } from "@/components/Stepper";
import Countdown from "@/components/Countdown";
import MapInfoBar from "@/components/MapInfoBar";
import LeafletMap from "@/components/LeafletMap";
import PaymentModal from "@/components/PaymentModal";
import PrintInvoice from "@/components/PrintInvoice";
import ShipmentHistory from "@/components/ShipmentHistory";

const COMPANY = {
 name: "Tranzex Route Logistics",
 address: "1428 Harbor View Avenue, Manila, Philippines 1000",
 email: "support@tranzexroute.com",
 phone: "+63 (2) 8123 4567",
};

const CUSTOMS_KEYWORDS = [
 "customs",
 "duty",
 "duties",
 "tax",
 "tariff",
 "clearance",
 "import fee",
 "vat",
];

function isCustomsComment(text?: string) {
 if (!text) return false;
 const t = text.toLowerCase();
 return CUSTOMS_KEYWORDS.some((k) => t.includes(k));
}

export default function TrackingPage() {
 useDocumentMeta(
   "Track Your Shipment — Tranzex Route Logistics",
   "Real-time shipment tracking with live map and instant status updates."
 );
 const [params, setParams] = useSearchParams();
 const urlN = params.get("n") || "";
 const [query, setQuery] = useState(urlN);
 const submitted = urlN;
 const [shipment, setShipment] = useState<any>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [dismissBanner, setDismissBanner] = useState(false);
 const [payOpen, setPayOpen] = useState(false);
 const [printPreview, setPrintPreview] = useState(false);

 useEffect(() => {
   setQuery(urlN);
 }, [urlN]);

 const onSubmit = (e: React.FormEvent) => {
   e.preventDefault();
   const n = query.trim();
   if (!n) return;
   setDismissBanner(false);
   setParams({ n }, { replace: false });
 };

 useEffect(() => {
   if (!submitted) {
     setShipment(null);
     setError(null);
     return;
   }
   let cancelled = false;
   let interval: ReturnType<typeof setInterval> | null = null;
   let isInitial = true;

   const fetchOne = async () => {
     if (isInitial) setLoading(true);
     const { data, error } = await supabase
       .from("shipments")
       .select(
         "id, tracking_number, status, current_location, current_location_flag, amount_due, expected_delivery_date, date_sent, origin_label, destination_label, origin_lat, origin_lng, destination_lat, destination_lng, current_stop_lat, current_stop_lng, current_stop_label, package_type, weight, description, comments, package_image_url, show_image, sender_name, sender_phone, sender_email, sender_address, receiver_name, receiver_phone, receiver_email, receiver_address, receiver_country, history, show_airport_step, hold_headline, hold_body, hold_amount, hold_note, hold_contact_email, crypto_wallet_address, bank_details, payment_instruction_note, proof_of_delivery_url, updated_at, payment_mode"
       )
       .eq("tracking_number", submitted)
       .maybeSingle();
     if (cancelled) return;
     if (error) {
       if (isInitial) {
         setError(error.message);
         setShipment(null);
       }
     } else if (!data) {
       if (isInitial) {
         setError("No shipment found for this tracking number");
         setShipment(null);
       }
     } else {
       setError(null);
       setShipment((prev: any) => {
         if (prev && JSON.stringify(prev) === JSON.stringify(data)) return prev;
         return data;
       });
     }
     if (isInitial) setLoading(false);
     isInitial = false;
   };
   fetchOne();

   const channel = supabase
     .channel("shipment-" + submitted)
     .on(
       "postgres_changes",
       { event: "UPDATE", schema: "public", table: "shipments", filter: "tracking_number=eq." + submitted },
       (payload) => {
         setShipment(payload.new);
         toast.success("Tracking updated just now");
       }
     )
     .subscribe();

   interval = setInterval(fetchOne, 30000);

   return () => {
     cancelled = true;
     supabase.removeChannel(channel);
     if (interval) clearInterval(interval);
   };
 }, [submitted]);

 const s = shipment;
 const onHold = s?.status === "On Hold";
 const failed = s?.status === "FAILED" || s?.status === "Returned To Warehouse";
 const delivered = s?.status === "Delivered";
 const commentHighlight = useMemo(() => isCustomsComment(s?.comments), [s?.comments]);

 const origin =
   s?.origin_lat != null && s?.origin_lng != null
     ? { lat: Number(s.origin_lat), lng: Number(s.origin_lng), label: s.origin_label || "Origin" }
     : null;
 const current =
   s?.current_stop_lat != null && s?.current_stop_lng != null
     ? { lat: Number(s.current_stop_lat), lng: Number(s.current_stop_lng), label: s.current_stop_label || s.current_location || "Current" }
     : null;
 const destination =
   s?.destination_lat != null && s?.destination_lng != null
     ? { lat: Number(s.destination_lat), lng: Number(s.destination_lng), label: s.destination_label || "Destination" }
     : null;

 return (
   <>
     <Navbar />
     <main className="bg-secondary min-h-screen pb-24">
       <section className="relative h-[420px] flex items-end overflow-hidden print:hidden">
         <img src={trackingHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
         <div className="absolute inset-0 hero-grain" />
         <div className="relative z-10 max-w-5xl mx-auto px-4 w-full pb-12 text-white">
           <h1 className="text-display text-5xl md:text-7xl font-black uppercase">Track Your Shipment</h1>
           <p className="mt-2 text-white/80">Real-time shipment tracking with live map and instant status updates.</p>
           <form onSubmit={onSubmit} className="mt-6 flex items-stretch max-w-2xl rounded-md overflow-hidden bg-white shadow-2xl">
             <input
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               placeholder="Enter tracking number"
               className="flex-1 px-5 py-4 text-navy text-mono text-sm outline-none"
             />
             <button type="submit" className="bg-brand-red text-white font-bold px-6 flex items-center gap-2">
               <Search className="w-4 h-4" /> TRACK
             </button>
           </form>
         </div>
       </section>

       <div className="max-w-5xl mx-auto px-4 -mt-8 relative space-y-6">
         {!submitted && (
           <div className="bg-white rounded-md p-8 text-center text-muted-foreground border border-border">
             Enter a tracking number above to begin.
           </div>
         )}

         {loading && (
           <div className="space-y-3 animate-pulse">
             <div className="h-24 bg-white rounded-md border border-border" />
             <div className="h-48 bg-white rounded-md border border-border" />
             <div className="h-32 bg-white rounded-md border border-border" />
           </div>
         )}

         {!loading && error && submitted && (
           <div className="bg-white border border-border rounded-md p-6 text-center">
             <AlertTriangle className="w-10 h-10 text-brand-red mx-auto" />
             <div className="mt-3 text-navy font-bold text-lg">{error}</div>
           </div>
         )}

         {s && onHold && !dismissBanner && (
           <div className="gradient-amber text-white rounded-md p-6 shadow-xl">
             <div className="flex items-start justify-between gap-4">
               <div>
                 <div className="text-display text-2xl font-extrabold uppercase">
                   {s.hold_headline || "Customs Hold — Action Required"}
                 </div>
                 {s.hold_body && <p className="mt-2 text-white/90">{s.hold_body}</p>}
                 <div className="mt-3 text-mono text-xl font-extrabold">
                   Amount Due: {s.hold_amount || s.amount_due || "—"}
                 </div>
                 {s.hold_note && <p className="mt-2 italic text-white/85 text-sm">{s.hold_note}</p>}
                 <div className="mt-4 flex flex-wrap gap-3">
                   <button
                     onClick={() => setPayOpen(true)}
                     className="bg-white text-brand-red font-extrabold px-5 py-2.5 rounded animate-pulse-ring"
                   >
                     Pay Now
                   </button>
                   {s.hold_contact_email && (
                     <a
                       href={`mailto:${s.hold_contact_email}`}
                       className="bg-white/10 border border-white text-white font-bold px-5 py-2.5 rounded"
                     >
                       Contact Support
                     </a>
                   )}
                 </div>
               </div>
               <button onClick={() => setDismissBanner(true)} className="text-white/80 hover:text-white" aria-label="Dismiss">
                 x
               </button>
             </div>
           </div>
         )}

         {s && failed && (
           <div className="w-full bg-brand-red text-white rounded-md p-5 flex items-center gap-4 shadow-xl">
             <Undo2 className="w-8 h-8 animate-return-arrow shrink-0" />
             <div>
               <div className="font-extrabold text-display text-xl uppercase">
                 Shipment Failed — This package has been returned to the warehouse
               </div>
             </div>
           </div>
         )}

         {s && (
           <>
             <div className="bg-white rounded-md p-6 border border-border">
               <div className="flex items-start justify-between gap-4 flex-wrap">
                 <div>
                   <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Tracking Number</div>
                   <div className="flex items-center gap-2 mt-1">
                     <span className="text-mono text-2xl md:text-3xl font-extrabold text-navy">{s.tracking_number}</span>
                     <button
                       onClick={() => {
                         navigator.clipboard.writeText(s.tracking_number);
                         toast.success("Copied!");
                       }}
                       className="text-muted-foreground hover:text-brand-red"
                       aria-label="Copy"
                     >
                       <Copy className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
                 <button
                   onClick={() => setPrintPreview(true)}
                   className="bg-navy text-white font-bold px-4 py-2 rounded-none flex items-center gap-2 text-sm"
                 >
                   <Printer className="w-4 h-4" /> Print Invoice
                 </button>
               </div>

               {delivered ? (
                 <div className="mt-5 bg-success/15 border border-success rounded p-4 flex items-center gap-3 text-navy">
                   <CheckCircle2 className="w-6 h-6 text-success" />
                   <div className="font-semibold">
                     This item has been successfully delivered to the recipient's address.
                   </div>
                 </div>
               ) : (
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                   <BoldChip label="Status" value={s.status} color={getStepColor(s.status)} valueClass="font-extrabold" valueStyle={{ color: getStepColor(s.status) }} />
                   <BoldChip
                     label="Current Location"
                     value={
                       <span>
                         {s.current_location_flag ? `${s.current_location_flag} ` : ""}
                         {s.current_location || "—"}
                       </span>
                     }
                   />
                   <BoldChip
                     label="Amount Due"
                     value={s.amount_due || "—"}
                     valueClass={s.amount_due ? "text-brand-red" : ""}
                   />
                 </div>
               )}

               {s.expected_delivery_date && !delivered && (
                 <div className="mt-4">
                   <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                     Estimated Delivery
                   </div>
                   <div className="flex items-center gap-4 flex-wrap">
                     <Countdown target={s.expected_delivery_date} />
                     <div className="h-10 w-px bg-border" />
                     <div className="text-sm leading-tight">
                       <div className="font-bold text-navy">
                         Scheduled: {new Date(s.expected_delivery_date).toLocaleDateString()}
                       </div>
                       <div className="text-muted-foreground text-xs">Before End of Day</div>
                     </div>
                   </div>
                 </div>
               )}
             </div>

             <div className="bg-white rounded-md p-6 border border-border">
               <SectionTitle>Shipment Details</SectionTitle>
               {s.package_image_url && s.show_image && (
                 <div className="w-full bg-secondary rounded-md overflow-hidden border border-border flex items-center justify-center">
                   <img
                     src={s.package_image_url}
                     alt="package"
                     className="w-full max-h-[420px] object-contain"
                   />
                 </div>
               )}
               <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                 <Row label="Origin" value={s.origin_label} />
                 <Row label="Destination" value={s.destination_label} />
                 <Row label="Type" value={s.package_type} />
                 <Row label="Weight" value={s.weight} />
                 <Row label="Date Sent" value={s.date_sent} />
                 <Row label="Expected Delivery" value={s.expected_delivery_date ? new Date(s.expected_delivery_date).toLocaleDateString() : "—"} />
                 <div className="sm:col-span-2">
                   <Row label="Description" value={s.description} />
                 </div>
                 <div className="sm:col-span-2 grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-border text-sm items-center">
                   <div className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Status</div>
                   <div>
                     <span
                       className="inline-block text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                       style={{ background: getStepColor(s.status) }}
                     >
                       {s.status}
                     </span>
                   </div>
                 </div>
                 {s.comments && (
                   <div className="sm:col-span-2 mt-3">
                     <div className="text-muted-foreground uppercase text-xs font-bold tracking-wider mb-1">Comments</div>
                     <div
                       className={
                         commentHighlight
                           ? "bg-warning/25 border-l-4 border-warning rounded p-3 text-navy text-sm font-medium"
                           : "bg-secondary border border-border rounded p-3 text-navy text-sm"
                       }
                     >
                       {s.comments}
                     </div>
                   </div>
                 )}
               </div>
             </div>

             <Stepper status={s.status} showAirport={!!s.show_airport_step} />

             <div className="bg-white rounded-md p-6 border border-border">
               <SectionTitle>Shipper Information</SectionTitle>
               <PartyCard
                 title="Shipper"
                 name={s.sender_name}
                 phone={s.sender_phone}
                 email={s.sender_email}
                 address={s.sender_address}
               />
             </div>

             <div className="bg-white rounded-md p-6 border border-border">
               <SectionTitle>Consignee Information</SectionTitle>
               <PartyCard
                 title="Consignee"
                 name={s.receiver_name}
                 phone={s.receiver_phone}
                 email={s.receiver_email}
                 address={s.receiver_address}
                 country={s.receiver_country}
               />
             </div>

             <div className="bg-white rounded-md p-6 border border-border">
               <SectionTitle>Shipment History</SectionTitle>
               <ShipmentHistory history={s.history} />
             </div>

             <div className="bg-white rounded-md border border-border overflow-hidden">
               <MapInfoBar
                 origin={s.origin_label}
                 current={s.current_stop_label || s.current_location}
                 destination={s.destination_label}
               />
               <LeafletMap origin={origin} current={current} destination={destination} />
             </div>

             {delivered && s.proof_of_delivery_url && (
               <div className="bg-white rounded-md p-6 border border-border">
                 <SectionTitle>Proof of Delivery</SectionTitle>
                 <img src={s.proof_of_delivery_url} alt="proof" className="w-full max-w-md rounded-md border border-border" />
               </div>
             )}

             <div className="text-xs text-muted-foreground text-right">
               Last updated: {s.updated_at ? new Date(s.updated_at).toLocaleString() : "—"}
             </div>

             <PrintInvoice s={s} open={printPreview} onClose={() => setPrintPreview(false)} />

             <PaymentModal
               open={payOpen}
               onClose={() => setPayOpen(false)}
               wallet={s.crypto_wallet_address}
               bankDetails={s.bank_details}
               amount={s.hold_amount || s.amount_due || "—"}
               note={s.payment_instruction_note}
               contactEmail={s.hold_contact_email || COMPANY.email}
             />
           </>
         )}
       </div>
     </main>
     <Footer />
   </>
 );
}
