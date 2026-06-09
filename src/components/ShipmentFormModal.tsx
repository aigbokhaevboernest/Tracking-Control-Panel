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
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SHIPMENT_STATUSES, generateTrackingNumber } from "@/lib/tracking";
import { geocode } from "@/lib/geocode";
import { cn } from "@/lib/utils";
import { ConfirmNotifyModal } from "@/components/ConfirmNotifyModal";
import { sendMail, buildCreatedEmail, buildStatusEmail } from "@/lib/sendMail";

const numOrNull = z.preprocess(
 (v) => (v === "" || v == null ? null : Number(v)),
 z.number().nullable().optional()
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

const COLORS = {
 blue:    { bar: "bg-blue-500",    text: "text-blue-600",    ring: "focus:ring-blue-400" },
 orange:  { bar: "bg-orange-500",  text: "text-orange-600",  ring: "focus:ring-orange-400" },
 red:     { bar: "bg-red-500",     text: "text-red-600",     ring: "focus:ring-red-400" },
 violet:  { bar: "bg-violet-600",  text: "text-violet-600",  ring: "focus:ring-violet-400" },
 teal:    { bar: "bg-teal-600",    text: "text-teal-600",    ring: "focus:ring-teal-400" },
 green:   { bar: "bg-green-500",   text: "text-green-600",   ring: "focus:ring-green-400" },
 amber:   { bar: "bg-amber-500",   text: "text-amber-600",   ring: "focus:ring-amber-400" },
 emerald: { bar: "bg-emerald-500", text: "text-emerald-600", ring: "focus:ring-emerald-400" },
};
type CK = keyof typeof COLORS;

const inputBase: React.CSSProperties = { fontSize: 16, WebkitTextSizeAdjust: "100%" };

function Section({ title, color, children }: { title: string; color: CK; children: ReactNode }) {
 const c = COLORS[color];
 return (
   <div className="space-y-3">
     <div className="flex items-center gap-2">
       <span className={cn("h-5 w-1 rounded-full flex-shrink-0", c.bar)} />
       <h3 className={cn("text-sm font-bold uppercase tracking-wide", c.text)}>{title}</h3>
     </div>
     <div className="border-b border-gray-100" />
     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
   </div>
 );
}

function FInput({ icon: Icon, color, rightEl, type = "text", className, style, ...props }:
 { icon: any; color: CK; rightEl?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
 return (
   <div className="relative">
     <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
     <input
       type={type}
       style={{ ...inputBase, ...style }}
       className={cn(
         "w-full h-11 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 outline-none focus:ring-2 focus:bg-white transition",
         rightEl && "pr-10",
         COLORS[color].ring,
         className
       )}
       {...props}
     />
     {rightEl && <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightEl}</div>}
   </div>
 );
}

function FTextarea({ icon: Icon, color, style, ...props }:
 { icon: any; color: CK } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
 return (
   <div className="relative">
     <Icon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
     <textarea
       rows={2}
       style={{ ...inputBase, ...style }}
       className={cn(
         "w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:bg-white transition",
         COLORS[color].ring
       )}
       {...props}
     />
   </div>
 );
}

function FSelect({ icon: Icon, color, children, style, ...props }:
 { icon: any; color: CK; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
 return (
   <div className="relative">
     <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
     <select
       style={{ ...inputBase, ...style }}
       className={cn(
         "w-full h-11 appearance-none rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 outline-none focus:ring-2 focus:bg-white transition",
         COLORS[color].ring
       )}
       {...props}
     >
       {children}
     </select>
   </div>
 );
}

function FL({ children }: { children: ReactNode }) {
 return <Label className="text-xs font-semibold text-gray-600">{children}</Label>;
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
   if (open) {
     document.body.style.overflow = "hidden";
   } else {
     document.body.style.overflow = "";
   }
   return () => { document.body.style.overflow = ""; };
 }, [open]);

 useEffect(() => {
   if (!open) return;
   if (shipmentId) {
     (async () => {
       const { data } = await supabase.from("shipments").select("*").eq("id", shipmentId).single();
       if (data) {
         reset({ ...data, date_sent: data.date_sent ?? "", expected_delivery_date: data.expected_delivery_date ?? "" } as any);
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
       // ── Fix: never save null status ──
       status: values.status || (shipmentId ? undefined : "Origin Warehouse"),
       date_sent: values.date_sent || null,
       expected_delivery_date: values.expected_delivery_date || null,
       package_image_url: imageUrl,
       proof_of_delivery_url: proofUrl,
       origin_lat: origin?.lat ?? null, origin_lng: origin?.lng ?? null,
       current_stop_lat: currentStop?.lat ?? null, current_stop_lng: currentStop?.lng ?? null,
       destination_lat: destination?.lat ?? null, destination_lng: destination?.lng ?? null,
     };

     // Remove undefined keys so Supabase doesn't overwrite with undefined
     Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

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

 return createPortal(
   <>
     <div
       style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.55)" }}
       onClick={() => onOpenChange(false)}
     />

     <div
       style={{
         position: "fixed",
         top: 24,
         bottom: 24,
         left: "50%",
         transform: "translateX(-50%)",
         width: "calc(100vw - 32px)",
         maxWidth: 672,
         zIndex: 9999,
         display: "flex",
         flexDirection: "column",
         borderRadius: 16,
         overflow: "hidden",
         boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
       }}
     >
       <div style={{
         flexShrink: 0,
         background: "linear-gradient(90deg,#7c3aed,#6d28d9)",
         padding: "16px 20px",
         display: "flex",
         alignItems: "center",
         justifyContent: "space-between",
       }}>
         <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 600, fontSize: 15 }}>
           <PackageIcon size={18} />
           <span>{shipmentId ? "Edit Shipment" : "Register New Shipment"}</span>
         </div>
         <button
           type="button"
           onClick={() => onOpenChange(false)}
           style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", color: "#fff", display: "flex" }}
         >
           <X size={16} />
         </button>
       </div>

       <div style={{
         flex: 1,
         minHeight: 0,
         overflowY: "auto",
         overflowX: "hidden",
         overscrollBehavior: "contain",
         WebkitOverflowScrolling: "touch",
         background: "#fff",
         padding: "20px 20px 32px",
       }}>
         <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

           <Section title="Basic Info" color="blue">
             <div className="space-y-1 sm:col-span-2">
               <FL>Tracking Number</FL>
               <FInput icon={Hash} color="blue" {...register("tracking_number")}
                 rightEl={
                   <button type="button"
                     onClick={() => { navigator.clipboard.writeText(trackingNumber ?? ""); toast.success("Copied"); }}
                     className="p-1 rounded text-gray-400 hover:text-gray-700"
                   ><Copy className="h-4 w-4" /></button>
                 }
               />
               {errors.tracking_number && <p className="text-xs text-red-500">{errors.tracking_number.message}</p>}
             </div>
             <div className="space-y-1">
               <FL>Status</FL>
               <FSelect icon={PackageIcon} color="blue" {...register("status")} defaultValue="">
                 <option value="">Select status</option>
                 {SHIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
               </FSelect>
             </div>
             <div className="flex items-center gap-2 pt-4">
               <Switch checked={!!watch("show_airport_step")} onCheckedChange={(v) => setValue("show_airport_step", v)} />
               <Label className="text-xs">Show Airport Step on Public Page</Label>
             </div>
           </Section>

           <Section title="Sender's Details" color="orange">
             <div className="space-y-1"><FL>Full Name</FL><FInput icon={User} color="orange" {...register("sender_name")} /></div>
             <div className="space-y-1"><FL>Email</FL><FInput icon={Mail} color="orange" type="email" {...register("sender_email")} /></div>
             <div className="space-y-1"><FL>Phone</FL><FInput icon={Phone} color="orange" {...register("sender_phone")} /></div>
             <div className="space-y-1"><FL>Country</FL><FInput icon={Globe} color="orange" {...register("sender_country")} /></div>
             <div className="space-y-1 sm:col-span-2"><FL>Address</FL><FTextarea icon={MapPin} color="orange" {...register("sender_address")} /></div>
           </Section>

           <Section title="Receiver's Details" color="red">
             <div className="space-y-1"><FL>Full Name</FL><FInput icon={User} color="red" {...register("receiver_name")} /></div>
             <div className="space-y-1"><FL>Email</FL><FInput icon={Mail} color="red" type="email" {...register("receiver_email")} /></div>
             <div className="space-y-1"><FL>Phone</FL><FInput icon={Phone} color="red" {...register("receiver_phone")} /></div>
             <div className="space-y-1"><FL>Country</FL><FInput icon={Globe} color="red" {...register("receiver_country")} /></div>
             <div className="space-y-1 sm:col-span-2"><FL>Address</FL><FTextarea icon={MapPin} color="red" {...register("receiver_address")} /></div>
           </Section>

           <Section title="Package Details" color="violet">
             <div className="space-y-1"><FL>Package Type</FL><FInput icon={PackageIcon} color="violet" {...register("package_type")} /></div>
             <div className="space-y-1"><FL>Weight</FL><FInput icon={Scale} color="violet" {...register("weight")} /></div>
             <div className="space-y-1"><FL>Date Sent</FL><FInput icon={Calendar} color="violet" type="date" {...register("date_sent")} /></div>
             <div className="space-y-1"><FL>Expected Delivery</FL><FInput icon={Calendar} color="violet" type="date" {...register("expected_delivery_date")} /></div>
             <div className="space-y-1 sm:col-span-2"><FL>Description</FL><FTextarea icon={FileText} color="violet" {...register("description")} /></div>
             <div className="space-y-1 sm:col-span-2"><FL>Comments</FL><FTextarea icon={MessageSquare} color="violet" {...register("comments")} /></div>
             <div className="space-y-2 sm:col-span-2">
               <FL>Package Image</FL>
               <div className="flex items-center gap-3">
                 <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100">
                   <Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload"}
                   <input type="file" accept="image/*" className="hidden"
                     onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setImageUrl)} />
                 </label>
                 {imageUrl && <img src={imageUrl} alt="pkg" className="h-14 w-14 rounded-lg object-cover border border-gray-200" />}
               </div>
             </div>
             <div className="flex items-center gap-2 sm:col-span-2">
               <Switch checked={!!watch("show_image")} onCheckedChange={(v) => setValue("show_image", v)} />
               <Label className="text-xs">Show image on tracking page</Label>
             </div>
           </Section>

           <Section title="Locations & Map" color="teal">
             <div className="space-y-1">
               <FL>Origin</FL>
               <FInput icon={Search} color="teal" {...register("origin_label")}
                 onBlur={(e) => { if (!getValues("origin_label")) setValue("origin_label", e.currentTarget.value); }} />
             </div>
             <div className="space-y-1"><FL>Current Stop</FL><FInput icon={Search} color="teal" {...register("current_stop_label")} /></div>
             <div className="space-y-1 sm:col-span-2"><FL>Destination</FL><FInput icon={Search} color="teal" {...register("destination_label")} /></div>
             <div className="space-y-1 sm:col-span-2"><FL>Current Location (display label)</FL><FInput icon={MapPin} color="teal" {...register("current_location")} /></div>
           </Section>

           <Section title="Billing" color="green">
             <div className="space-y-1"><FL>Amount Due</FL><FInput icon={DollarSign} color="green" type="number" {...register("amount_due")} /></div>
             <div className="space-y-1">
               <FL>Payment Mode</FL>
               <FSelect icon={CreditCard} color="green" {...register("payment_mode")} defaultValue="">
                 <option value="">Select mode</option>
                 <option value="Crypto">Crypto</option>
                 <option value="Bank">Bank</option>
               </FSelect>
             </div>
             {paymentMode === "Crypto" && <>
               <div className="space-y-1 sm:col-span-2"><FL>Wallet Address</FL><FInput icon={Wallet} color="green" {...register("crypto_wallet_address")} /></div>
               <div className="space-y-1 sm:col-span-2"><FL>Payment Note</FL><FTextarea icon={MessageSquare} color="green" {...register("payment_instruction_note")} /></div>
             </>}
             {paymentMode === "Bank" && <>
               <div className="space-y-1"><FL>Bank Name</FL><FInput icon={Building2} color="green" {...register("bank_name")} /></div>
               <div className="space-y-1"><FL>Account Number</FL><FInput icon={Hash} color="green" {...register("bank_account_number")} /></div>
               <div className="space-y-1 sm:col-span-2"><FL>Account Name</FL><FInput icon={User} color="green" {...register("bank_account_name")} /></div>
               <div className="space-y-1 sm:col-span-2"><FL>Bank Note</FL><FTextarea icon={MessageSquare} color="green" {...register("bank_instruction_note")} /></div>
             </>}
           </Section>

           <Section title="Customs Hold" color="amber">
             <div className="space-y-1"><FL>Hold Headline</FL><FInput icon={AlertTriangle} color="amber" {...register("hold_headline")} /></div>
             <div className="space-y-1"><FL>Hold Amount</FL><FInput icon={DollarSign} color="amber" {...register("hold_amount")} /></div>
             <div className="space-y-1"><FL>Contact Email</FL><FInput icon={Mail} color="amber" type="email" {...register("hold_contact_email")} /></div>
             <div className="space-y-1"><FL>Footer Note</FL><FInput icon={MessageSquare} color="amber" {...register("hold_footer_note")} /></div>
             <div className="space-y-1 sm:col-span-2"><FL>Hold Body</FL><FTextarea icon={FileText} color="amber" {...register("hold_body")} /></div>
           </Section>

           <Section title="Proof of Delivery" color="emerald">
             <div className="space-y-2 sm:col-span-2">
               <FL>Proof of Delivery Image</FL>
               <div className="flex items-center gap-3">
                 <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100">
                   <Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload"}
                   <input type="file" accept="image/*" className="hidden"
                     onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setProofUrl)} />
                 </label>
                 {proofUrl && <img src={proofUrl} alt="proof" className="h-14 w-14 rounded-lg object-cover border border-gray-200" />}
               </div>
             </div>
           </Section>

           <button
             type="submit"
             disabled={submitting}
             style={{
               width: "100%",
               padding: "14px 0",
               background: submitting ? "#7c3aed99" : "#7c3aed",
               color: "#fff",
               border: "none",
               borderRadius: 10,
               fontWeight: 700,
               fontSize: 16,
               cursor: submitting ? "not-allowed" : "pointer",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               gap: 8,
             }}
           >
             {submitting ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
             {submitting ? "Saving…" : "Save Shipment"}
           </button>

         </form>
       </div>
     </div>

     <ConfirmNotifyModal
       open={confirmOpen}
       onOpenChange={setConfirmOpen}
       onConfirm={async (send) => { if (pendingValues) await doSave(pendingValues, send); }}
     />
   </>,
   document.body
 );
}
