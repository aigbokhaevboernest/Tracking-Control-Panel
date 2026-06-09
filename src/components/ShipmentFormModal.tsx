import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2, Upload, Hash, Package as PackageIcon, User, Mail, Phone, Globe, MapPin,
  Search, FileText, Calendar, Scale, DollarSign, CreditCard, Wallet, Building2,
  AlertTriangle, MessageSquare, Copy, Truck, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SHIPMENT_STATUSES, generateTrackingNumber } from "@/lib/tracking";
import { geocode } from "@/lib/geocode";
import { cn } from "@/lib/utils";
import { ConfirmNotifyModal } from "@/components/ConfirmNotifyModal";
import { sendMail, buildCreatedEmail, buildStatusEmail } from "@/lib/sendMail";

const numOrNull = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number().nullable().optional(),
);
const optStr = z.string().nullable().optional().or(z.literal("").transform(() => null));

const schema = z.object({
  tracking_number: z.string().min(3, "Required"),
  status: optStr, current_location: optStr, amount_due: numOrNull, payment_mode: optStr,
  comments: optStr, origin_label: optStr, current_stop_label: optStr, destination_label: optStr,
  package_type: optStr, weight: optStr, description: optStr, date_sent: optStr,
  expected_delivery_date: optStr, show_image: z.boolean().optional(), show_airport_step: z.boolean().optional(),
  sender_name: optStr, sender_phone: optStr, sender_email: optStr, sender_address: optStr, sender_country: optStr,
  receiver_name: optStr, receiver_phone: optStr, receiver_email: optStr, receiver_address: optStr, receiver_country: optStr,
  hold_headline: optStr, hold_body: optStr, hold_footer_note: optStr, hold_amount: optStr, hold_contact_email: optStr,
  crypto_wallet_address: optStr, payment_instruction_note: optStr,
  bank_name: optStr, bank_account_number: optStr, bank_account_name: optStr, bank_instruction_note: optStr,
  proof_of_delivery_url: optStr,
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shipmentId?: string | null;
  onSaved?: () => void;
}

const SECTION_COLORS = {
  blue: { bar: "bg-blue-500", text: "text-blue-600", ring: "focus:ring-blue-500 focus:border-blue-500" },
  orange: { bar: "bg-orange-500", text: "text-orange-600", ring: "focus:ring-orange-500 focus:border-orange-500" },
  red: { bar: "bg-red-500", text: "text-red-600", ring: "focus:ring-red-500 focus:border-red-500" },
  violet: { bar: "bg-violet-600", text: "text-violet-600", ring: "focus:ring-violet-500 focus:border-violet-500" },
  teal: { bar: "bg-teal-600", text: "text-teal-600", ring: "focus:ring-teal-500 focus:border-teal-500" },
  green: { bar: "bg-green-500", text: "text-green-600", ring: "focus:ring-green-500 focus:border-green-500" },
  amber: { bar: "bg-amber-500", text: "text-amber-600", ring: "focus:ring-amber-500 focus:border-amber-500" },
  emerald: { bar: "bg-emerald-500", text: "text-emerald-600", ring: "focus:ring-emerald-500 focus:border-emerald-500" },
};

type ColorKey = keyof typeof SECTION_COLORS;

function Section({ title, color, children }: { title: string; color: ColorKey; children: ReactNode }) {
  const c = SECTION_COLORS[color];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={cn("h-5 w-1 rounded-full", c.bar)} />
        <h3 className={cn("text-sm font-bold uppercase tracking-wide", c.text)}>{title}</h3>
      </div>
      <div className="border-b border-gray-200" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}

function IconInput({
  icon: Icon, color, rightIcon, type = "text", className, ...props
}: { icon: any; color: ColorKey; rightIcon?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  const c = SECTION_COLORS[color];
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-white pl-9 pr-3 py-1 text-sm shadow-sm outline-none transition focus:ring-1",
          rightIcon && "pr-10",
          c.ring,
          className,
        )}
        {...props}
      />
      {rightIcon && <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightIcon}</div>}
    </div>
  );
}

function IconTextarea({
  icon: Icon, color, ...props
}: { icon: any; color: ColorKey } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const c = SECTION_COLORS[color];
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <textarea
        rows={2}
        className={cn(
          "flex w-full rounded-md border border-input bg-white pl-9 pr-3 py-2 text-sm shadow-sm outline-none transition focus:ring-1",
          c.ring,
        )}
        {...props}
      />
    </div>
  );
}

function NativeSelect({
  icon: Icon, color, children, ...props
}: { icon: any; color: ColorKey; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const c = SECTION_COLORS[color];
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <select
        className={cn(
          "flex h-10 w-full appearance-none rounded-md border border-input bg-white pl-9 pr-8 py-1 text-sm shadow-sm outline-none transition focus:ring-1",
          c.ring,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <Label className="text-xs font-medium text-gray-700">{children}</Label>;
}

export function ShipmentFormModal({ open, onOpenChange, shipmentId, onSaved }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const { register, handleSubmit, reset, watch, setValue, getValues, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema) as any,
      defaultValues: { tracking_number: generateTrackingNumber(), show_image: false, show_airport_step: false } as any,
    });

  const paymentMode = watch("payment_mode");
  const trackingNumber = watch("tracking_number");

  useEffect(() => {
    if (!open) return;
    if (shipmentId) {
      (async () => {
        const { data } = await supabase.from("shipments").select("*").eq("id", shipmentId).single();
        if (data) {
          reset({
            ...data,
            date_sent: data.date_sent ?? "",
            expected_delivery_date: data.expected_delivery_date ?? "",
          } as any);
          setImageUrl(data.package_image_url ?? null);
          setProofUrl(data.proof_of_delivery_url ?? null);
        }
      })();
    } else {
      reset({ tracking_number: generateTrackingNumber(), show_image: false, show_airport_step: false } as any);
      setImageUrl(null);
      setProofUrl(null);
    }
  }, [open, shipmentId, reset]);

  async function uploadFile(file: File, setter: (url: string) => void) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("package-images").upload(filename, file);
      if (error) throw error;
      const { data } = supabase.storage.from("package-images").getPublicUrl(filename);
      setter(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error("Upload failed", { description: err?.message });
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(values: FormValues) {
    setPendingValues(values);
    setConfirmOpen(true);
  }

  async function doSave(values: FormValues, sendEmailFlag: boolean) {
    setSubmitting(true);
    try {
      const [origin, currentStop, destination] = await Promise.all([
        values.origin_label ? geocode(values.origin_label) : Promise.resolve(null),
        values.current_stop_label ? geocode(values.current_stop_label) : Promise.resolve(null),
        values.destination_label ? geocode(values.destination_label) : Promise.resolve(null),
      ]);

      const payload: any = {
        ...values,
        date_sent: values.date_sent || null,
        expected_delivery_date: values.expected_delivery_date || null,
        package_image_url: imageUrl,
        proof_of_delivery_url: proofUrl,
        origin_lat: origin?.lat ?? null,
        origin_lng: origin?.lng ?? null,
        current_stop_lat: currentStop?.lat ?? null,
        current_stop_lng: currentStop?.lng ?? null,
        destination_lat: destination?.lat ?? null,
        destination_lng: destination?.lng ?? null,
      };

      if (shipmentId) {
        const { error } = await supabase.from("shipments").update(payload).eq("id", shipmentId);
        if (error) throw error;
        toast.success("Shipment updated");
      } else {
        const { error } = await supabase.from("shipments").insert(payload);
        if (error) throw error;
        toast.success("Shipment created");
      }

      if (sendEmailFlag && values.receiver_email) {
        const ctx = {
          tracking_number: values.tracking_number,
          sender_name: values.sender_name,
          sender_country: values.sender_country,
          receiver_name: values.receiver_name,
          receiver_country: values.receiver_country,
          package_type: values.package_type,
          weight: values.weight,
          origin_label: values.origin_label,
          destination_label: values.destination_label,
          current_location: values.current_location,
          expected_delivery_date: values.expected_delivery_date,
          hold_amount: values.hold_amount,
        };
        const tpl = shipmentId
          ? buildStatusEmail(values.status ?? null, ctx) ?? buildCreatedEmail(ctx)
          : buildCreatedEmail(ctx);
        const result = await sendMail({
          email: values.receiver_email,
          subject: tpl.subject,
          first_name: values.receiver_name?.split(" ")[0] ?? "",
          message: tpl.message,
        });
        if (result.success) toast.success("Email sent to consignee");
        else toast.error("Email failed", { description: result.error });
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!top-8 !translate-y-0 w-[calc(100vw-2rem)] max-w-2xl max-h-[calc(100dvh-4rem)] gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl [&>button]:hidden"
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-5 py-4 text-white rounded-t-2xl">
          <DialogTitle className="flex items-center gap-2 text-white">
            <PackageIcon className="h-5 w-5" />
            <span>{shipmentId ? "Edit Shipment" : "Register New Shipment"}</span>
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-white/90 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto bg-white px-5 py-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <Section title="Basic Info" color="blue">
              <div className="space-y-1 md:col-span-2">
                <FieldLabel>Tracking Number</FieldLabel>
                <IconInput
                  icon={Hash}
                  color="blue"
                  {...register("tracking_number")}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(trackingNumber ?? ""); toast.success("Copied"); }}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  }
                />
                {errors.tracking_number && <p className="text-xs text-red-600">{errors.tracking_number.message}</p>}
              </div>
              <div className="space-y-1">
                <FieldLabel>Status</FieldLabel>
                <NativeSelect icon={PackageIcon} color="blue" {...register("status")} defaultValue="">
                  <option value="">Select status</option>
                  {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </NativeSelect>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch
                  checked={!!watch("show_airport_step")}
                  onCheckedChange={(v) => setValue("show_airport_step", v)}
                />
                <Label className="text-xs">Show Airport Step on Public Page</Label>
              </div>
            </Section>

            <Section title="Sender's Details" color="orange">
              <div className="space-y-1"><FieldLabel>Full Name</FieldLabel><IconInput icon={User} color="orange" {...register("sender_name")} /></div>
              <div className="space-y-1"><FieldLabel>Email</FieldLabel><IconInput icon={Mail} color="orange" type="email" {...register("sender_email")} /></div>
              <div className="space-y-1"><FieldLabel>Phone</FieldLabel><IconInput icon={Phone} color="orange" {...register("sender_phone")} /></div>
              <div className="space-y-1"><FieldLabel>Country</FieldLabel><IconInput icon={Globe} color="orange" {...register("sender_country")} /></div>
              <div className="space-y-1 md:col-span-2"><FieldLabel>Address</FieldLabel><IconTextarea icon={MapPin} color="orange" {...register("sender_address")} /></div>
            </Section>

            <Section title="Receiver's Details" color="red">
              <div className="space-y-1"><FieldLabel>Full Name</FieldLabel><IconInput icon={User} color="red" {...register("receiver_name")} /></div>
              <div className="space-y-1"><FieldLabel>Email</FieldLabel><IconInput icon={Mail} color="red" type="email" {...register("receiver_email")} /></div>
              <div className="space-y-1"><FieldLabel>Phone</FieldLabel><IconInput icon={Phone} color="red" {...register("receiver_phone")} /></div>
              <div className="space-y-1"><FieldLabel>Country</FieldLabel><IconInput icon={Globe} color="red" {...register("receiver_country")} /></div>
              <div className="space-y-1 md:col-span-2"><FieldLabel>Address</FieldLabel><IconTextarea icon={MapPin} color="red" {...register("receiver_address")} /></div>
            </Section>

            <Section title="Package / Other Details" color="violet">
              <div className="space-y-1"><FieldLabel>Package Type</FieldLabel><IconInput icon={PackageIcon} color="violet" {...register("package_type")} /></div>
              <div className="space-y-1"><FieldLabel>Weight</FieldLabel><IconInput icon={Scale} color="violet" {...register("weight")} /></div>
              <div className="space-y-1"><FieldLabel>Date Sent</FieldLabel><IconInput icon={Calendar} color="violet" type="date" {...register("date_sent")} /></div>
              <div className="space-y-1"><FieldLabel>Expected Delivery</FieldLabel><IconInput icon={Calendar} color="violet" type="date" {...register("expected_delivery_date")} /></div>
              <div className="space-y-1 md:col-span-2"><FieldLabel>Description (Parcel)</FieldLabel><IconTextarea icon={FileText} color="violet" {...register("description")} /></div>
              <div className="space-y-1 md:col-span-2"><FieldLabel>Comments</FieldLabel><IconTextarea icon={MessageSquare} color="violet" {...register("comments")} /></div>
              <div className="space-y-2 md:col-span-2">
                <FieldLabel>Package Image</FieldLabel>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50">
                    <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setImageUrl)} />
                  </label>
                  {imageUrl && <img src={imageUrl} alt="package" className="h-16 w-16 rounded object-cover" />}
                </div>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Switch checked={!!watch("show_image")} onCheckedChange={(v) => setValue("show_image", v)} />
                <Label className="text-xs">Show Package Image on tracking page</Label>
              </div>
            </Section>

            <Section title="Locations & Map" color="teal">
              <div className="space-y-1">
                <FieldLabel>Origin (search)</FieldLabel>
                <IconInput
                  icon={Search} color="teal" {...register("origin_label")}
                  onBlur={(e) => { if (!getValues("origin_label")) setValue("origin_label", e.currentTarget.value); }}
                />
              </div>
              <div className="space-y-1">
                <FieldLabel>Current Stop (search)</FieldLabel>
                <IconInput icon={Search} color="teal" {...register("current_stop_label")} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <FieldLabel>Destination (search)</FieldLabel>
                <IconInput icon={Search} color="teal" {...register("destination_label")} />
              </div>
              <div className="space-y-1 md:col-span-2"><FieldLabel>Current Location (display)</FieldLabel><IconInput icon={MapPin} color="teal" {...register("current_location")} /></div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 pt-2 pb-1">
                  <MapPin className="h-3 w-3 text-teal-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-teal-600">Map Labels</span>
                </div>
              </div>
              <div className="space-y-1"><FieldLabel>Origin Label</FieldLabel><IconInput icon={MapPin} color="teal" {...register("origin_label")} /></div>
              <div className="space-y-1"><FieldLabel>Current Stop Label</FieldLabel><IconInput icon={MapPin} color="teal" {...register("current_stop_label")} /></div>
              <div className="space-y-1 md:col-span-2"><FieldLabel>Destination Label</FieldLabel><IconInput icon={MapPin} color="teal" {...register("destination_label")} /></div>
            </Section>

            <Section title="Billing" color="green">
              <div className="space-y-1"><FieldLabel>Amount Due</FieldLabel><IconInput icon={DollarSign} color="green" type="number" {...register("amount_due")} /></div>
              <div className="space-y-1">
                <FieldLabel>Payment Mode</FieldLabel>
                <NativeSelect icon={CreditCard} color="green" {...register("payment_mode")} defaultValue="">
                  <option value="">Select payment mode</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Bank">Bank</option>
                </NativeSelect>
              </div>
              {paymentMode === "Crypto" && (
                <>
                  <div className="space-y-1 md:col-span-2"><FieldLabel>Crypto Wallet Address</FieldLabel><IconInput icon={Wallet} color="green" {...register("crypto_wallet_address")} /></div>
                  <div className="space-y-1 md:col-span-2"><FieldLabel>Payment Instruction Note</FieldLabel><IconTextarea icon={MessageSquare} color="green" {...register("payment_instruction_note")} /></div>
                </>
              )}
              {paymentMode === "Bank" && (
                <>
                  <div className="space-y-1"><FieldLabel>Bank Name</FieldLabel><IconInput icon={Building2} color="green" {...register("bank_name")} /></div>
                  <div className="space-y-1"><FieldLabel>Account Number</FieldLabel><IconInput icon={Hash} color="green" {...register("bank_account_number")} /></div>
                  <div className="space-y-1 md:col-span-2"><FieldLabel>Account Name</FieldLabel><IconInput icon={User} color="green" {...register("bank_account_name")} /></div>
                  <div className="space-y-1 md:col-span-2"><FieldLabel>Bank Instruction Note</FieldLabel><IconTextarea icon={MessageSquare} color="green" {...register("bank_instruction_note")} /></div>
                </>
              )}
            </Section>

            <Section title="Customs Hold" color="amber">
              <div className="space-y-1"><FieldLabel>Hold Headline</FieldLabel><IconInput icon={AlertTriangle} color="amber" {...register("hold_headline")} /></div>
              <div className="space-y-1"><FieldLabel>Hold Amount</FieldLabel><IconInput icon={DollarSign} color="amber" {...register("hold_amount")} /></div>
              <div className="space-y-1"><FieldLabel>Contact Email</FieldLabel><IconInput icon={Mail} color="amber" type="email" {...register("hold_contact_email")} /></div>
              <div className="space-y-1"><FieldLabel>Footer Note</FieldLabel><IconInput icon={MessageSquare} color="amber" {...register("hold_footer_note")} /></div>
              <div className="space-y-1 md:col-span-2"><FieldLabel>Hold Body</FieldLabel><IconTextarea icon={FileText} color="amber" {...register("hold_body")} /></div>
            </Section>

            <Section title="Proof of Delivery" color="emerald">
              <div className="space-y-2 md:col-span-2">
                <FieldLabel>Proof of Delivery Image</FieldLabel>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50">
                    <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setProofUrl)} />
                  </label>
                  {proofUrl && <img src={proofUrl} alt="proof" className="h-16 w-16 rounded object-cover" />}
                </div>
              </div>
            </Section>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={submitting} className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Truck className="mr-2 h-4 w-4" /> Save Shipment
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
      <ConfirmNotifyModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={async (send) => {
          if (pendingValues) await doSave(pendingValues, send);
        }}
      />
    </Dialog>
  );
}


Here is TrackingPage.tsx in full:

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
                  ×
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
