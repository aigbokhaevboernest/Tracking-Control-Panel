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
import trackingHero from "@/assets/tracking-hero.jpg";

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
           <h1 className="text-display text-5xl md:text-7xl font-black
