import { supabase } from "@/lib/supabase";

const ENDPOINT = "https://nzideivdechbxhepmlvz.supabase.co/functions/v1/sende-mail";

export interface SendMailArgs {
  email: string;
  subject: string;
  first_name?: string;
  message: string;
}

export interface SendMailResult {
  success: boolean;
  error?: string;
}

const CONFIDENTIALITY = `
<hr style="border:none; border-top:1px solid #E5E7EB; margin:16px 0;"/>
<p style="font-size:12px; color:#9CA3AF; line-height:1.5; margin:0;">
  <strong>NOTICE:</strong> The content of this email and any attachments is confidential and intended only for the recipient. If you have received this in error, please notify the sender immediately and delete all copies.
</p>`;

export async function sendMail(args: SendMailArgs): Promise<SendMailResult> {
  try {
    if (!args.email) return { success: false, error: "No recipient email" };

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        to: args.email,
        subject: args.subject,
        first_name: args.first_name ?? "",
        message: args.message,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `HTTP ${res.status}: ${text || res.statusText}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Network error" };
  }
}

// ---------- Helpers ----------

function v(x: any) { return x == null || x === "" ? "—" : String(x); }
function fmtDate(x: any) {
  if (x == null || x === "") return "—";
  const d = new Date(x);
  if (isNaN(d.getTime())) return String(x);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function trackUrl(t: string) { return `https://tranzexroute.com/track/${encodeURIComponent(t)}`; }

function row(label: string, value: string) {
  return `<tr><td style="padding:5px 0; width:50%; color:#6B7280; font-size:14px;">${label}</td><td style="padding:5px 0; font-size:14px; color:#111827; font-weight:500;">${value}</td></tr>`;
}

function table(rows: string) {
  return `<table style="width:100%; border-collapse:collapse; margin:12px 0;">${rows}</table>`;
}

function badge(text: string, bg: string, color: string) {
  return `<span style="display:inline-block; padding:5px 16px; border-radius:20px; font-weight:bold; font-size:13px; background:${bg}; color:${color};">${text}</span>`;
}

function trackBtn(url: string, bg: string, label = "TRACK YOUR SHIPMENT") {
  return `<a href="${url}" style="display:inline-block; background:${bg}; color:#ffffff; padding:10px 24px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px; margin-top:12px;">${label}</a>`;
}

export interface ShipmentEmailCtx {
  tracking_number: string;
  sender_name?: string | null;
  sender_country?: string | null;
  receiver_name?: string | null;
  receiver_country?: string | null;
  package_type?: string | null;
  weight?: string | null;
  origin_label?: string | null;
  destination_label?: string | null;
  current_location?: string | null;
  expected_delivery_date?: string | null;
  hold_amount?: string | null;
}

// ---------- Template builders ----------

export function buildCreatedEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#111827; font-size:18px; margin:0 0 6px 0;">SHIPMENT REGISTRATION SUCCESSFUL</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 12px 0;">
  A shipment has been successfully registered with your contact details as the consignee. Please review the information below carefully and contact us immediately if anything does not match your records.
</p>
${table(
  `<tr>
    <td style="padding:8px 0; width:50%; color:#111827; font-size:15px; font-weight:700;">Tracking ID</td>
    <td style="padding:8px 0; font-size:15px; color:#7C3AED; font-weight:700;">${v(s.tracking_number)}</td>
  </tr>` +
  row("Sender's Full Name", v(s.sender_name)) +
  row("Sender's Country", v(s.sender_country)) +
  row("Receiver's Full Name", v(s.receiver_name)) +
  row("Receiver's Country", v(s.receiver_country)) +
  row("Package Type", v(s.package_type)) +
  row("Weight", v(s.weight)) +
  row("Origin", v(s.origin_label)) +
  row("Destination", v(s.destination_label)) +
  row("Expected Delivery", v(s.expected_delivery_date))
)}
${trackBtn(trackUrl(s.tracking_number), "#7C3AED")}
${CONFIDENTIALITY}`;
  return { subject: `Shipment Registration Confirmed — ${s.tracking_number}`, message: msg };
}

export function buildOriginWarehouseEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#1D4ED8; font-size:18px; margin:0 0 6px 0;">SHIPMENT AT ORIGIN WAREHOUSE</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  Your shipment has been received at our origin warehouse and is currently being prepared for dispatch. You will receive further updates as your shipment progresses.
</p>
${badge("ORIGIN WAREHOUSE", "#DBEAFE", "#1D4ED8")}
${table(
  row("Tracking ID", v(s.tracking_number)) +
  row("Origin", v(s.origin_label)) +
  row("Destination", v(s.destination_label)) +
  row("Estimated Delivery", v(s.expected_delivery_date))
)}
${trackBtn(trackUrl(s.tracking_number), "#1D4ED8")}
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Is at the Origin Warehouse — ${s.tracking_number}`, message: msg };
}

export function buildInTransitEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#B91C1C; font-size:18px; margin:0 0 6px 0;">YOUR SHIPMENT IS IN TRANSIT</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  We are pleased to inform you that your shipment is now in transit and actively moving toward its destination. Our logistics team is monitoring its progress to ensure timely and safe delivery.
</p>
${badge("IN TRANSIT", "#FEE2E2", "#B91C1C")}
${table(
  row("Tracking ID", v(s.tracking_number)) +
  row("Current Location", v(s.current_location)) +
  row("Destination", v(s.destination_label)) +
  row("Estimated Delivery", v(s.expected_delivery_date))
)}
${trackBtn(trackUrl(s.tracking_number), "#B91C1C")}
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Is Now In Transit — ${s.tracking_number}`, message: msg };
}

export function buildCustomsHoldEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#D97706; font-size:18px; margin:0 0 6px 0;">⚠ CUSTOMS INSPECTION HOLD</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  Your shipment is currently being held by customs authorities for inspection and clearance. A customs processing fee must be settled before your shipment can continue to its destination. Once payment is confirmed, delivery will resume immediately. Please act promptly to avoid further delays.
</p>
${badge("ON CUSTOMS HOLD", "#FEF3C7", "#D97706")}
${table(
  row("Tracking ID", v(s.tracking_number)) +
  `<tr><td style="padding:5px 0; width:50%; color:#6B7280; font-size:14px;">Amount Due</td><td style="padding:5px 0; font-size:14px; color:#D97706; font-weight:bold;">${v(s.hold_amount)}</td></tr>`
)}
${trackBtn(trackUrl(s.tracking_number), "#D97706", "VIEW HOLD DETAILS & PAY NOW")}
${CONFIDENTIALITY}`;
  return { subject: `Action Required: Your Shipment Is On Customs Hold — ${s.tracking_number}`, message: msg };
}

export function buildAirportEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#0E7490; font-size:18px; margin:0 0 6px 0;">ARRIVED AT NEAREST AIRPORT</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  Your shipment has arrived at the nearest airport and is currently being processed for the next stage of delivery. Our team is working to ensure it continues to its destination without delay.
</p>
${badge("AT NEAREST AIRPORT", "#CFFAFE", "#0E7490")}
${table(
  row("Tracking ID", v(s.tracking_number)) +
  row("Current Location", v(s.current_location)) +
  row("Destination", v(s.destination_label)) +
  row("Estimated Delivery", v(s.expected_delivery_date))
)}
${trackBtn(trackUrl(s.tracking_number), "#0E7490")}
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Has Arrived at the Nearest Airport — ${s.tracking_number}`, message: msg };
}

export function buildPickUpEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#1D4ED8; font-size:18px; margin:0 0 6px 0;">READY FOR PICK-UP</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  Your shipment has arrived and is now ready for pick-up at the delivery location. Please bring a valid form of identification when collecting your package.
</p>
${badge("PICK-UP", "#DBEAFE", "#1D4ED8")}
${table(
  row("Tracking ID", v(s.tracking_number)) +
  row("Current Location", v(s.current_location)) +
  row("Destination", v(s.destination_label))
)}
${trackBtn(trackUrl(s.tracking_number), "#1D4ED8")}
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Is Ready for Pick-Up — ${s.tracking_number}`, message: msg };
}

export function buildOutForDeliveryEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#065F46; font-size:18px; margin:0 0 6px 0;">OUT FOR DELIVERY</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  Great news! Your shipment is out for delivery and is scheduled to arrive at your destination before the end of the day. Please ensure someone is available to receive it at the delivery address.
</p>
${badge("OUT FOR DELIVERY", "#D1FAE5", "#065F46")}
${table(
  row("Tracking ID", v(s.tracking_number)) +
  row("Destination", v(s.destination_label))
)}
${trackBtn(trackUrl(s.tracking_number), "#065F46")}
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Is Out for Delivery Today — ${s.tracking_number}`, message: msg };
}

export function buildDeliveredEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#065F46; font-size:18px; margin:0 0 6px 0;">SHIPMENT DELIVERED SUCCESSFULLY</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  We are pleased to confirm that your shipment has been successfully delivered to its destination. We hope your experience with Tranzex Route Logistics was seamless. Thank you for trusting us with your delivery — we look forward to serving you again.
</p>
${badge("DELIVERED", "#D1FAE5", "#065F46")}
${table(
  row("Tracking ID", v(s.tracking_number)) +
  row("Delivered To", v(s.destination_label))
)}
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Has Been Delivered — ${s.tracking_number}`, message: msg };
}

export function buildFailedEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#DC2626; font-size:18px; margin:0 0 6px 0;">DELIVERY ATTEMPT FAILED</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  Unfortunately, a delivery attempt for your shipment was unsuccessful. Please contact our support team as soon as possible so we can arrange an alternative delivery or collection.
</p>
${badge("FAILED", "#FEE2E2", "#DC2626")}
${table(
  row("Tracking ID", v(s.tracking_number)) +
  row("Current Location", v(s.current_location))
)}
${trackBtn(trackUrl(s.tracking_number), "#DC2626")}
${CONFIDENTIALITY}`;
  return { subject: `Delivery Attempt Failed — ${s.tracking_number}`, message: msg };
}

export function buildReturnedEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#374151; font-size:18px; margin:0 0 6px 0;">SHIPMENT RETURNED TO WAREHOUSE</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  Your shipment has been returned to the warehouse. This may have occurred due to an unsuccessful delivery attempt or other circumstances. Please contact our support team at your earliest convenience to arrange redelivery or collection.
</p>
${badge("RETURNED TO WAREHOUSE", "#F3F4F6", "#374151")}
${table(
  row("Tracking ID", v(s.tracking_number)) +
  row("Current Location", v(s.current_location))
)}
${trackBtn(trackUrl(s.tracking_number), "#374151")}
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Has Been Returned to Warehouse — ${s.tracking_number}`, message: msg };
}

export function buildCustomEmail(trackingNumber: string, customMessage: string) {
  const msg = `
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 12px 0;">${customMessage.replace(/\n/g, "<br/>")}</p>
${CONFIDENTIALITY}`;
  return { subject: `Message from Tranzex Route Logistics — ${trackingNumber}`, message: msg };
}

// ---------- Status router ----------

export function buildStatusEmail(status: string | null | undefined, s: ShipmentEmailCtx) {
  if (!status) return null;
  const k = status.toLowerCase().trim();
  if (k.includes("out for delivery")) return buildOutForDeliveryEmail(s);
  if (k.includes("transit")) return buildInTransitEmail(s);
  if (k.includes("hold") || k.includes("customs")) return buildCustomsHoldEmail(s);
  if (k.includes("pick")) return buildPickUpEmail(s);
  if (k.includes("airport")) return buildAirportEmail(s);
  if (k.includes("delivered")) return buildDeliveredEmail(s);
  if (k.includes("failed")) return buildFailedEmail(s);
  if (k.includes("returned")) return buildReturnedEmail(s);
  if (k.includes("origin")) return buildOriginWarehouseEmail(s);
  if (k.includes("warehouse")) return buildReturnedEmail(s);
  return {
    subject: `Shipment Update — ${s.tracking_number}`,
    message: `
<h2 style="color:#111827; font-size:18px; margin:0 0 6px 0;">SHIPMENT STATUS UPDATE</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  Your shipment status has been updated. Please visit our tracking page for the latest information.
</p>
${table(
  row("Tracking ID", v(s.tracking_number)) +
  row("Status", status) +
  row("Current Location", v(s.current_location))
)}
${trackBtn(trackUrl(s.tracking_number), "#7C3AED")}
${CONFIDENTIALITY}`,
  };
}
