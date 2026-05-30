import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, X, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SHIPMENT_STATUSES, generateTrackingNumber } from "@/lib/tracking";
import { geocode } from "@/lib/geocode";

const numOrNull = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number().nullable().optional(),
);
const optStr = z.string().nullable().optional().or(z.literal("").transform(() => null));

const schema = z.object({
  tracking_number: z.string().min(3, "Required"),
  status: optStr,
  current_location: optStr,
  amount_due: numOrNull,
  payment_mode: optStr,
  comments: optStr,
  origin_label: optStr,
  current_stop_label: optStr,
  destination_label: optStr,
  package_type: optStr,
  weight: optStr,
  description: optStr,
  date_sent: optStr,
  expected_delivery_date: optStr,
  show_image: z.boolean().optional(),
  show_airport_step: z.boolean().optional(),
  sender_name: optStr,
  sender_phone: optStr,
  sender_email: optStr,
  sender_address: optStr,
  sender_country: optStr,
  receiver_name: optStr,
  receiver_phone: optStr,
  receiver_email: optStr,
  receiver_address: optStr,
  receiver_country: optStr,
  hold_headline: optStr,
  hold_body: optStr,
  hold_footer_note: optStr,
  hold_amount: optStr,
  hold_contact_email: optStr,
  crypto_wallet_address: optStr,
  payment_instruction_note: optStr,
  bank_name: optStr,
  bank_account_number: optStr,
  bank_account_name: optStr,
  bank_instruction_note: optStr,
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shipmentId?: string | null;
  onSaved?: () => void;
}

export function ShipmentFormModal({ open, onOpenChange, shipmentId, onSaved }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { tracking_number: generateTrackingNumber(), show_image: true, show_airport_step: false },
    });

  const paymentMode = watch("payment_mode");
  const status = watch("status");

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
        }
      })();
    } else {
      reset({ tracking_number: generateTrackingNumber(), show_image: true, show_airport_step: false } as any);
      setImageUrl(null);
    }
  }, [open, shipmentId, reset]);

  async function handleImage(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("package-images").upload(filename, file);
      if (error) throw error;
      const { data } = supabase.storage.from("package-images").getPublicUrl(filename);
      setImageUrl(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error("Upload failed", { description: err?.message });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      // Auto-geocode locations in parallel
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
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message });
    } finally {
      setSubmitting(false);
    }
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="space-y-3 rounded-lg border bg-gray-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">{title}</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
      </div>
    );
  }

  function Field({ label, name, type = "text", as = "input" }: any) {
    return (
      <div className="space-y-1">
        <Label className="text-xs">{label}</Label>
        {as === "textarea" ? (
          <Textarea {...register(name)} rows={2} />
        ) : (
          <Input type={type} {...register(name)} />
        )}
        {errors[name as keyof FormValues] && (
          <p className="text-xs text-red-600">{(errors as any)[name]?.message}</p>
        )}
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{shipmentId ? "Edit Shipment" : "Register New Shipment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs">Tracking Number</Label>
                <Input {...register("tracking_number")} />
                {errors.tracking_number && <p className="text-xs text-red-600">{errors.tracking_number.message}</p>}
              </div>
            </div>

            <Section title="Sender Details">
              <Field label="Full Name" name="sender_name" />
              <Field label="Email" name="sender_email" type="email" />
              <Field label="Phone" name="sender_phone" />
              <Field label="Country" name="sender_country" />
              <div className="md:col-span-2"><Field label="Address" name="sender_address" as="textarea" /></div>
            </Section>

            <Section title="Receiver Details">
              <Field label="Full Name" name="receiver_name" />
              <Field label="Email" name="receiver_email" type="email" />
              <Field label="Phone" name="receiver_phone" />
              <Field label="Country" name="receiver_country" />
              <div className="md:col-span-2"><Field label="Address" name="receiver_address" as="textarea" /></div>
            </Section>

            <Section title="Package Details">
              <Field label="Package Type" name="package_type" />
              <Field label="Weight" name="weight" />
              <Field label="Date Sent" name="date_sent" type="date" />
              <Field label="Expected Delivery" name="expected_delivery_date" type="date" />
              <div className="md:col-span-2"><Field label="Description" name="description" as="textarea" /></div>
              <div className="md:col-span-2"><Field label="Comments" name="comments" as="textarea" /></div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs">Package Image</Label>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50">
                    <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
                    />
                  </label>
                  {imageUrl && <img src={imageUrl} alt="package" className="h-16 w-16 rounded object-cover" />}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!watch("show_image")} onCheckedChange={(v) => setValue("show_image", v)} />
                <Label className="text-xs">Show image on tracking page</Label>
              </div>
            </Section>

            <Section title="Status & Location">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={watch("status") ?? ""} onValueChange={(v) => setValue("status", v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {SHIPMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Current Location" name="current_location" />
              <Field label="Origin Label" name="origin_label" />
              <Field label="Current Stop Label" name="current_stop_label" />
              <Field label="Destination Label" name="destination_label" />
              <div className="flex items-center gap-2">
                <Switch checked={!!watch("show_airport_step")} onCheckedChange={(v) => setValue("show_airport_step", v)} />
                <Label className="text-xs">Show airport step</Label>
              </div>
            </Section>

            <Section title="Billing">
              <Field label="Amount Due" name="amount_due" type="number" />
              <div>
                <Label className="text-xs">Payment Mode</Label>
                <Select value={watch("payment_mode") ?? ""} onValueChange={(v) => setValue("payment_mode", v)}>
                  <SelectTrigger><SelectValue placeholder="Select payment mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Crypto">Crypto</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Section>

            <Section title="Customs Hold">
              <Field label="Hold Headline" name="hold_headline" />
              <Field label="Hold Amount" name="hold_amount" />
              <Field label="Contact Email" name="hold_contact_email" type="email" />
              <Field label="Footer Note" name="hold_footer_note" />
              <div className="md:col-span-2"><Field label="Hold Body" name="hold_body" as="textarea" /></div>
            </Section>

            {paymentMode === "Crypto" && (
              <Section title="Crypto Payment">
                <div className="md:col-span-2"><Field label="Wallet Address" name="crypto_wallet_address" /></div>
                <div className="md:col-span-2"><Field label="Instruction Note" name="payment_instruction_note" as="textarea" /></div>
                <div className="md:col-span-2">
                  <Button type="button" variant="secondary" onClick={() => setConfirmOpen(true)}>
                    I Have Sent the Money
                  </Button>
                </div>
              </Section>
            )}

            {paymentMode === "Bank" && (
              <Section title="Bank Payment">
                <Field label="Bank Name" name="bank_name" />
                <Field label="Account Number" name="bank_account_number" />
                <Field label="Account Name" name="bank_account_name" />
                <div className="md:col-span-2"><Field label="Instruction Note" name="bank_instruction_note" as="textarea" /></div>
                <div className="md:col-span-2">
                  <Button type="button" variant="secondary" onClick={() => setConfirmOpen(true)}>
                    I Have Sent the Money
                  </Button>
                </div>
              </Section>
            )}

            <DialogFooter>
              <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Notification Received</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Thank you. You will be notified once your payment has been confirmed by our team.
          </p>
          <DialogFooter>
            <Button onClick={() => setConfirmOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
