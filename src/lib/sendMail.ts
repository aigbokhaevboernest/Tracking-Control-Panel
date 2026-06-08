// Email sending helper. Calls external Supabase Edge Function directly via fetch.
// Never throws — always returns { success, error }.

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
<br/><br/>
<hr style="border:none; border-top:1px solid #E5E7EB; margin:24px 0;"/>
<p style="font-size:12px; color:#9CA3AF; line-height:1.6;">
  <strong>NOTICE:</strong> The content of this email and any attachments is confidential and intended only for the recipient. If you have received this in error, please notify the sender immediately and delete all copies.
</p>`;

export async function sendMail(args: SendMailArgs): Promise<SendMailResult> {
  try {
    if (!args.email) return { success: false, error: "No recipient email" };
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

// ---------- Template builders ----------

function v(x: any) { return x == null || x === "" ? "—" : String(x); }
function trackUrl(t: string) { return `https://tranzexroute.com/track/${encodeURIComponent(t)}`; }

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

export function buildCreatedEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#111827; font-size:20px; margin-bottom:8px;">SHIPMENT REGISTRATION SUCCESSFUL</h2>
<p style="color:#374151; font-size:15px; line-height:1.7;">
  A shipment has been successfully registered with your contact details as the consignee.
  Please review the information below carefully and contact us immediately if anything does not match your records.
</p>
<br/>
<table style="width:100%; font-size:15px; color:#374151; border-collapse:collapse;">
  <tr><td style="padding:8px 0; width:50%;"><strong>Sender's Full Name:</strong></td><td>${v(s.sender_name)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Sender's Country:</strong></td><td>${v(s.sender_country)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Receiver's Full Name:</strong></td><td>${v(s.receiver_name)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Receiver's Country:</strong></td><td>${v(s.receiver_country)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Tracking ID:</strong></td><td>${v(s.tracking_number)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Package Type:</strong></td><td>${v(s.package_type)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Weight:</strong></td><td>${v(s.weight)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Origin:</strong></td><td>${v(s.origin_label)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Destination:</strong></td><td>${v(s.destination_label)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Expected Delivery:</strong></td><td>${v(s.expected_delivery_date)}</td></tr>
</table>
<br/>
<a href="${trackUrl(s.tracking_number)}" style="display:inline-block; background:#7C3AED; color:#ffffff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px;">TRACK YOUR SHIPMENT</a>
${CONFIDENTIALITY}`;
  return { subject: `Shipment Registration Confirmed — ${s.tracking_number}`, message: msg };
}

export function buildInTransitEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#1D4ED8; font-size:20px; margin-bottom:8px;">YOUR SHIPMENT IS IN TRANSIT</h2>
<p style="color:#374151; font-size:15px; line-height:1.7;">
  We are pleased to inform you that your shipment is now in transit and actively moving toward its destination.
  Our logistics team is monitoring its progress to ensure timely and safe delivery.
</p>
<br/>
<span style="display:inline-block; padding:8px 20px; border-radius:20px; font-weight:bold; font-size:14px; background:#DBEAFE; color:#1D4ED8;">IN TRANSIT</span>
<br/><br/>
<table style="width:100%; font-size:15px; color:#374151; border-collapse:collapse;">
  <tr><td style="padding:8px 0; width:50%;"><strong>Tracking ID:</strong></td><td>${v(s.tracking_number)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Current Location:</strong></td><td>${v(s.current_location)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Destination:</strong></td><td>${v(s.destination_label)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Estimated Delivery:</strong></td><td>${v(s.expected_delivery_date)}</td></tr>
</table>
<br/>
<a href="${trackUrl(s.tracking_number)}" style="display:inline-block; background:#1D4ED8; color:#ffffff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px;">TRACK YOUR SHIPMENT</a>
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Is Now In Transit — ${s.tracking_number}`, message: msg };
}

export function buildOutForDeliveryEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#065F46; font-size:20px; margin-bottom:8px;">OUT FOR DELIVERY</h2>
<p style="color:#374151; font-size:15px; line-height:1.7;">
  Great news! Your shipment is out for delivery and is scheduled to arrive at your destination before the end of the day.
  Please ensure someone is available to receive it at the delivery address.
</p>
<br/>
<span style="display:inline-block; padding:8px 20px; border-radius:20px; font-weight:bold; font-size:14px; background:#D1FAE5; color:#065F46;">OUT FOR DELIVERY</span>
<br/><br/>
<table style="width:100%; font-size:15px; color:#374151; border-collapse:collapse;">
  <tr><td style="padding:8px 0; width:50%;"><strong>Tracking ID:</strong></td><td>${v(s.tracking_number)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Destination:</strong></td><td>${v(s.destination_label)}</td></tr>
</table>
<br/>
<a href="${trackUrl(s.tracking_number)}" style="display:inline-block; background:#065F46; color:#ffffff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px;">TRACK YOUR SHIPMENT</a>
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Is Out for Delivery Today — ${s.tracking_number}`, message: msg };
}

export function buildCustomsHoldEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#DC2626; font-size:20px; margin-bottom:8px;">⚠ CUSTOMS INSPECTION HOLD</h2>
<p style="color:#374151; font-size:15px; line-height:1.7;">
  Your shipment is currently being held by customs authorities for inspection and clearance.
  A customs processing fee must be settled before your shipment can continue to its destination.
  Once payment is confirmed, delivery will resume immediately. Please act promptly to avoid further delays.
</p>
<br/>
<span style="display:inline-block; padding:8px 20px; border-radius:20px; font-weight:bold; font-size:14px; background:#FEE2E2; color:#DC2626;">ON CUSTOMS HOLD</span>
<br/><br/>
<table style="width:100%; font-size:15px; color:#374151; border-collapse:collapse;">
  <tr><td style="padding:8px 0; width:50%;"><strong>Tracking ID:</strong></td><td>${v(s.tracking_number)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Amount Due:</strong></td><td style="color:#DC2626; font-weight:bold;">${v(s.hold_amount)}</td></tr>
</table>
<br/>
<a href="${trackUrl(s.tracking_number)}" style="display:inline-block; background:#DC2626; color:#ffffff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px;">VIEW HOLD DETAILS & PAY NOW</a>
${CONFIDENTIALITY}`;
  return { subject: `Action Required: Your Shipment Is On Customs Hold — ${s.tracking_number}`, message: msg };
}

export function buildDeliveredEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#065F46; font-size:20px; margin-bottom:8px;">SHIPMENT DELIVERED SUCCESSFULLY</h2>
<p style="color:#374151; font-size:15px; line-height:1.7;">
  We are pleased to confirm that your shipment has been successfully delivered to its destination.
  We hope your experience with Tranzex Route Logistics was seamless. Thank you for trusting us with your delivery — we look forward to serving you again.
</p>
<br/>
<span style="display:inline-block; padding:8px 20px; border-radius:20px; font-weight:bold; font-size:14px; background:#D1FAE5; color:#065F46;">DELIVERED</span>
<br/><br/>
<table style="width:100%; font-size:15px; color:#374151; border-collapse:collapse;">
  <tr><td style="padding:8px 0; width:50%;"><strong>Tracking ID:</strong></td><td>${v(s.tracking_number)}</td></tr>
  <tr><td style="padding:8px 0;"><strong>Delivered To:</strong></td><td>${v(s.destination_label)}</td></tr>
</table>
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Has Been Delivered — ${s.tracking_number}`, message: msg };
}

export function buildCustomEmail(trackingNumber: string, customMessage: string) {
  const msg = `<p style="color:#374151; font-size:15px; line-height:1.7;">${customMessage.replace(/\n/g, "<br/>")}</p>${CONFIDENTIALITY}`;
  return { subject: `Message from Tranzex Route Logistics — ${trackingNumber}`, message: msg };
}

// Pick the right template by status. Returns null when no template applies.
export function buildStatusEmail(status: string | null | undefined, s: ShipmentEmailCtx) {
  if (!status) return null;
  const k = status.toLowerCase();
  if (k.includes("transit")) return buildInTransitEmail(s);
  if (k.includes("out for delivery")) return buildOutForDeliveryEmail(s);
  if (k.includes("hold") || k.includes("customs")) return buildCustomsHoldEmail(s);
  if (k.includes("delivered")) return buildDeliveredEmail(s);
  return null;
}
