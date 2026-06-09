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
  blue:    { bar: "bg-blue-500",    text: "text-blue-600",    ring: "focus:ring-blue-500 focus:border-blue-500" },
  orange:  { bar: "bg-orange-500",  text: "text-orange-600",  ring: "focus:ring-orange-500 focus:border-orange-500" },
  red:     { bar: "bg-red-500",     text: "text-red-600",     ring: "focus:ring-red-500 focus:border-red-500" },
  violet:  { bar: "bg-violet-600",  text: "text-violet-600",  ring: "focus:ring-violet-500 focus:border-violet-500" },
  teal:    { bar: "bg-teal-600",    text: "text-teal-600",    ring: "focus:ring-teal-500 focus:border-teal-500" },
  green:   { bar: "bg-green-500",   text: "text-green-600",   ring: "focus:ring-green-500 focus:border-green-500" },
  amber:   { bar: "bg-amber-500",   text: "text-amber-600",   ring: "focus:ring-amber-500 focus:border-amber-500" },
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
      defaultValues: { tracking_number: generateTrackingNumber(), show_image: true, show_airport_step: false } as any,
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
      reset({ tracking_number: generateTrackingNumber(), show_image: true, show_airport_step: false } as any);
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

  if (!open) return null;

  return (
    <>
      {/* Full-screen overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal — fixed, centered, no overflow outside */}
      <div
        className="fixed inset-x-4 top-6 bottom-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxWidth: 672, margin: "0 auto" }}
      >
        {/* Purple header — never scrolls */}
        <div className="flex-shrink-0 flex items-center justify-between bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-5 py-4 text-white rounded-t-2xl">
          <div className="flex items-center gap-2 font-semibold text-base">
            <PackageIcon className="h-5 w-5" />
            <span>{shipmentId ? "Edit Shipment" : "Register New Shipment"}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-white/90 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body — flex-1 fills exact remaining height */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-white px-5 py-5">
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
              <div className="space-y-1 md:col-span-2">
                <FieldLabel>Current Location (display)</FieldLabel>
                <IconInput icon={MapPin} color="teal" {...register("current_location")} />
              </div>
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

            <div className="flex justify-end pt-2 pb-2">
              <Button type="submit" disabled={submitting} className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Truck className="mr-2 h-4 w-4" /> Save Shipment
              </Button>
            </div>

          </form>
        </div>
      </div>

      <ConfirmNotifyModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={async (send) => {
          if (pendingValues) await doSave(pendingValues, send);
        }}
      />
    </>
  );
}
