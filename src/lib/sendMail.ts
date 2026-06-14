import { supabase } from "@/lib/supabase";

const ENDPOINT = "https://nzideivdechbxhepmlvz.supabase.co/functions/v1/sende-mail";

export interface SendMailArgs {
  email: string;
  subject: string;
  first_name?: string;
  message?: string;
  html_body?: string;
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
        message: args.message ?? "",
        html_body: args.html_body,
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

function statusBadge(status: string | null | undefined) {
  const k = (status ?? "").toLowerCase().trim();
  let border: string, bg: string, color: string;
  if (k.includes("origin") || k.includes("pick")) {
    border = "#93c5fd"; bg = "#dbeafe"; color = "#1e40af";
  } else if (k.includes("transit")) {
    border = "#fca5a5"; bg = "#fee2e2"; color = "#b91c1c";
  } else if (k.includes("hold") || k.includes("customs")) {
    border = "#fde047"; bg = "#fef9c3"; color = "#854d0e";
  } else if (k.includes("airport")) {
    border = "#67e8f9"; bg = "#cffafe"; color = "#0e7490";
  } else if (k.includes("delivered") || k.includes("out for delivery")) {
    border = "#86efac"; bg = "#dcfce7"; color = "#15803d";
  } else {
    border = "#d1d5db"; bg = "#f3f4f6"; color = "#6b7280";
  }
  return `<span style="display:inline-block; padding:3px 14px; border-radius:4px; font-size:11px; font-weight:700; letter-spacing:1px; border:1px solid ${border}; background:${bg}; color:${color};">${v(status).toUpperCase()}</span>`;
}

function stampHtml(label: string, color: string) {
  return `
  <table cellpadding="0" cellspacing="0" style="width:90px; height:90px;">
    <tr><td align="center" valign="middle">
      <div style="width:90px; height:90px; border-radius:50%; border:2.5px solid ${color}; display:inline-block; position:relative; text-align:center; line-height:1;">
        <div style="margin-top:14px; font-size:7px; font-weight:700; color:${color}; letter-spacing:2px; text-transform:uppercase; font-family:Arial,sans-serif;">TRANZEX ROUTE</div>
        <div style="font-size:6px; font-weight:600; color:${color}; letter-spacing:1.5px; font-family:Arial,sans-serif;">LOGISTICS</div>
        <div style="margin-top:6px; font-size:9px; font-weight:800; color:${color}; letter-spacing:1px; font-family:Arial,sans-serif;">${label}</div>
        <div style="margin-top:6px; font-size:6.5px; font-weight:700; color:${color}; letter-spacing:2px; font-family:Arial,sans-serif;">* OFFICIAL *</div>
      </div>
    </td></tr>
  </table>`;
}

function barcodeHtml(trackingNumber: string) {
  const bars = [
    [0,3],[4,1],[6,2],[9,1],[11,3],[15,2],[18,1],[20,2],[23,1],[25,3],
    [29,1],[31,2],[34,3],[38,1],[40,2],[43,1],[45,3],[49,2],[52,1],[54,2],
    [57,3],[61,1],[63,2],[66,1],[68,3],[72,1],[74,2],[77,2],[80,1],[82,3],
    [86,1],[88,2],[91,1],[93,3],[97,2],[100,1],[102,2],[105,1],[107,3],[111,2],
    [114,1],[116,3],[120,1],[122,2],[125,1],[127,3],[131,2],[134,1],[136,3],
  ];
  const rects = bars.map(([x, w]) => `<rect x="${x}" width="${w}" height="48" fill="#111"/>`).join("");
  return `
  <div style="border:1.5px solid #999; background:#fff; display:inline-block; padding:6px 8px 2px;">
    <svg width="140" height="48" viewBox="0 0 140 48" xmlns="http://www.w3.org/2000/svg">${rects}</svg>
    <div style="font-family:monospace; font-size:10px; color:#111; text-align:center; margin-top:2px; letter-spacing:2px;">${trackingNumber}</div>
  </div>`;
}

export interface ShipmentEmailCtx {
  tracking_number: string;
  sender_name?: string | null;
  sender_phone?: string | null;
  sender_email?: string | null;
  sender_address?: string | null;
  sender_country?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  receiver_email?: string | null;
  receiver_address?: string | null;
  receiver_country?: string | null;
  package_type?: string | null;
  weight?: string | null;
  origin_label?: string | null;
  destination_label?: string | null;
  current_location?: string | null;
  expected_delivery_date?: string | null;
  amount_due?: string | null;
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
  `<tr><td colspan="2" style="padding:8px 0;"><hr style="border:none; border-top:1px solid #E5E7EB; margin:4px 0;"/></td></tr>` +
  row("Receiver's Full Name", v(s.receiver_name)) +
  row("Receiver's Country", v(s.receiver_country)) +
  row("Receiver's Address", v(s.receiver_address)) +
  row("Receiver's Phone Number", v(s.receiver_phone)) +
  `<tr><td colspan="2" style="padding:8px 0;"><hr style="border:none; border-top:1px solid #E5E7EB; margin:4px 0;"/></td></tr>` +
  row("Package Type", v(s.package_type)) +
  row("Weight", v(s.weight)) +
  row("Origin", v(s.origin_label)) +
  row("Destination", v(s.destination_label)) +
  row("Expected Delivery", fmtDate(s.expected_delivery_date))
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
  row("Estimated Delivery", fmtDate(s.expected_delivery_date))
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
  row("Estimated Delivery", fmtDate(s.expected_delivery_date))
)}
${trackBtn(trackUrl(s.tracking_number), "#B91C1C")}
${CONFIDENTIALITY}`;
  return { subject: `Your Shipment Is Now In Transit — ${s.tracking_number}`, message: msg };
}

export function buildCustomsHoldEmail(s: ShipmentEmailCtx) {
  const msg = `
<h2 style="color:#D97706; font-size:18px; margin:0 0 6px 0;">&#9888; CUSTOMS INSPECTION HOLD</h2>
<p style="color:#374151; font-size:14px; line-height:1.6; margin:0 0 10px 0;">
  Your shipment is currently being held by customs authorities for inspection and clearance. A customs processing fee must be settled before your shipment can continue to its destination. Once payment is confirmed, delivery will resume immediately. Please act promptly to avoid further delays.
</p>
${badge("ON CUSTOMS HOLD", "#FEF3C7", "#D97706")}
${table(
  row("Tracking ID", v(s.tracking_number)) +
  `<tr><td style="padding:5px 0; width:50%; color:#6B7280; font-size:14px;">Amount Due</td><td style="padding:5px 0; font-size:14px; color:#D97706; font-weight:bold;">${v(s.amount_due)}</td></tr>`
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
  row("Estimated Delivery", fmtDate(s.expected_delivery_date))
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
  if (k.includes("hold") || k.includes("customs")) return buildCustomsHoldEmail(s);
  if (k.includes("delivered")) return buildDeliveredEmail(s);
  if (k.includes("failed")) return buildFailedEmail(s);
  if (k.includes("returned")) return buildReturnedEmail(s);
  if (k.includes("pick")) return buildPickUpEmail(s);
  // Origin states (Origin Warehouse / Origin Airport / Origin Port) — checked
  // before generic "airport" / "port" so origin always wins.
  if (k.startsWith("origin")) return buildOriginWarehouseEmail(s);
  // Arrival hubs (Arrived At Nearest Airport / Depot / Destination Port)
  if (k.includes("arrived") || k.includes("airport") || k.includes("depot") || k.includes("destination port")) {
    return buildAirportEmail(s);
  }
  // Movement states (In-Transit / Departed / In Flight / At Sea / Departed Port)
  if (k.includes("transit") || k.includes("departed") || k.includes("flight") || k.includes("at sea")) {
    return buildInTransitEmail(s);
  }
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

// ---------- Invoice email ----------

export interface InvoiceEmailCtx {
  tracking_number: string;
  sender_name?: string | null;
  sender_phone?: string | null;
  sender_email?: string | null;
  sender_address?: string | null;
  sender_country?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  receiver_email?: string | null;
  receiver_address?: string | null;
  receiver_country?: string | null;
  package_type?: string | null;
  weight?: string | null;
  description?: string | null;
  origin_label?: string | null;
  destination_label?: string | null;
  date_sent?: string | null;
  expected_delivery_date?: string | null;
  amount_due?: any;
  status?: string | null;
  comments?: string | null;
  current_location?: string | null;
  payment_mode?: string | null;
  hold_headline?: string | null;
  hold_body?: string | null;
  hold_contact_email?: string | null;
  crypto_wallet_address?: string | null;
  payment_instruction_note?: string | null;
}

export function buildInvoiceEmail(
  s: InvoiceEmailCtx,
  company: { name: string; address?: string | null; email?: string | null; logo?: string | null }
) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const amount = s.amount_due != null && s.amount_due !== "" ? String(s.amount_due) : "—";
  const isOnHold = (s.status ?? "").toLowerCase().includes("hold") || (s.status ?? "").toLowerCase().includes("customs");
  const stampColor = isOnHold ? "#d97706" : "#dc2626";
  const stampLabel = (s.status || "OFFICIAL").toUpperCase();

  const holdSection = isOnHold && (s.hold_headline || s.hold_body) ? `
      <tr><td style="padding:0 28px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #fde047; background:#fefce8; border-radius:4px;">
          <tr><td style="padding:14px 16px;">
            <div style="font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#d97706; font-weight:700; margin-bottom:8px;">&#9651; Shipment on Hold</div>
            ${s.hold_headline ? `<div style="font-size:14px; font-weight:800; color:#111827; margin-bottom:6px;">${s.hold_headline}</div>` : ""}
            ${s.hold_body ? `<div style="font-size:12px; color:#374151; line-height:1.6; margin-bottom:8px;">${s.hold_body}</div>` : ""}
            ${s.hold_contact_email ? `<div style="font-size:11.5px; color:#374151; margin-bottom:3px;">Contact: <strong>${s.hold_contact_email}</strong></div>` : ""}
            ${s.crypto_wallet_address ? `<div style="font-size:11.5px; color:#374151; word-break:break-all; margin-bottom:8px;">Crypto Wallet: <strong>${s.crypto_wallet_address}</strong></div>` : ""}
            ${s.payment_instruction_note ? `
            <div style="border:none; border-top:1px dashed #d97706; margin:8px 0;"></div>
            <div style="font-size:11.5px; color:#374151; line-height:1.5;"><strong>Instructions:</strong> ${s.payment_instruction_note}</div>` : ""}
          </td></tr>
        </table>
      </td></tr>` : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:'DM Sans','Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:6px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); max-width:600px; width:100%;">

      <!-- HEADER -->
      <tr><td style="background:#d1d5db; padding:24px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;">
              <div style="font-size:22px; font-weight:800; color:#111827; letter-spacing:0.5px; line-height:1.1;">INVOICE / WAYBILL</div>
              <div style="font-size:11px; color:#555; margin-top:4px;">Tranzex Route Logistics</div>
            </td>
            <td style="text-align:right; vertical-align:top;">
              <div style="font-size:11px; color:#555; margin-bottom:6px;">Issued: ${today}</div>
              ${barcodeHtml(v(s.tracking_number))}
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- TRACKING -->
      <tr><td style="padding:20px 28px 14px; text-align:center; border-bottom:1px solid #e5e7eb;">
        <div style="font-size:9px; letter-spacing:3px; text-transform:uppercase; color:#6b7280; font-weight:600;">Tracking Number</div>
        <div style="font-size:22px; font-weight:700; color:#dc2626; letter-spacing:1px; margin-top:4px;">${v(s.tracking_number)}</div>
        <div style="margin-top:8px;">
          ${statusBadge(s.status)}
          ${s.current_location ? `<span style="font-size:12px; color:#6b7280; margin-left:8px;">&#x1F4CD; ${v(s.current_location)}</span>` : ""}
        </div>
      </td></tr>

      <!-- PARTIES -->
      <tr><td style="padding:16px 28px; border-bottom:1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:50%; vertical-align:top; padding-right:16px;">
              <div style="font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#9ca3af; font-weight:600; padding-bottom:4px; border-bottom:1px solid #e5e7eb; margin-bottom:6px;">From (Sender)</div>
              <div style="font-size:14px; font-weight:700; color:#111; margin-bottom:3px;">${v(s.sender_name)}</div>
              ${s.sender_phone ? `<div style="font-size:12px; color:#374151; line-height:1.6;">${s.sender_phone}</div>` : ""}
              ${s.sender_email ? `<div style="font-size:12px; color:#374151; line-height:1.6;">${s.sender_email}</div>` : ""}
              ${s.sender_address ? `<div style="font-size:12px; color:#374151; line-height:1.6;">${s.sender_address}</div>` : ""}
              ${s.sender_country ? `<div style="font-size:12px; color:#374151; line-height:1.6;">${s.sender_country}</div>` : ""}
            </td>
            <td style="width:50%; vertical-align:top; padding-left:16px; border-left:1px solid #e5e7eb;">
              <div style="font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#9ca3af; font-weight:600; padding-bottom:4px; border-bottom:1px solid #e5e7eb; margin-bottom:6px;">To (Receiver)</div>
              <div style="font-size:14px; font-weight:700; color:#111; margin-bottom:3px;">${v(s.receiver_name)}</div>
              ${s.receiver_phone ? `<div style="font-size:12px; color:#374151; line-height:1.6;">${s.receiver_phone}</div>` : ""}
              ${s.receiver_email ? `<div style="font-size:12px; color:#374151; line-height:1.6;">${s.receiver_email}</div>` : ""}
              ${s.receiver_address ? `<div style="font-size:12px; color:#374151; line-height:1.6;">${s.receiver_address}</div>` : ""}
              ${s.receiver_country ? `<div style="font-size:12px; color:#374151; line-height:1.6;">${s.receiver_country}</div>` : ""}
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- SHIPMENT DETAILS -->
      <tr><td style="padding:14px 28px; border-bottom:1px solid #e5e7eb;">
        <div style="font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#9ca3af; font-weight:600; padding-bottom:4px; border-bottom:1px solid #e5e7eb; margin-bottom:10px;">Shipment Details</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:50%; padding:4px 0; font-size:12px; color:#374151;">Origin: <strong style="color:#111;">${v(s.origin_label)}</strong></td>
            <td style="width:50%; padding:4px 0; font-size:12px; color:#374151;">Destination: <strong style="color:#111;">${v(s.destination_label)}</strong></td>
          </tr>
          <tr>
            <td style="padding:4px 0; font-size:12px; color:#374151;">Type: <strong style="color:#111;">${v(s.package_type)}</strong></td>
            <td style="padding:4px 0; font-size:12px; color:#374151;">Weight: <strong style="color:#111;">${v(s.weight)}</strong></td>
          </tr>
          <tr>
            <td style="padding:4px 0; font-size:12px; color:#374151;">Date Sent: <strong style="color:#111;">${fmtDate(s.date_sent)}</strong></td>
            <td style="padding:4px 0; font-size:12px; color:#374151;">Exp. Delivery: <strong style="color:#111;">${fmtDate(s.expected_delivery_date)}</strong></td>
          </tr>
          ${s.description ? `<tr><td colspan="2" style="padding:4px 0; font-size:12px; color:#374151;">Description: <strong style="color:#111;">${v(s.description)}</strong></td></tr>` : ""}
        </table>
      </td></tr>

      <!-- COMMENTS -->
      ${s.comments ? `
      <tr><td style="padding:14px 28px; border-bottom:1px solid #e5e7eb;">
        <div style="font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#9ca3af; font-weight:600; padding-bottom:4px; border-bottom:1px solid #e5e7eb; margin-bottom:10px;">Comments</div>
        <div style="background:#fffbeb; border-left:3px solid #f59e0b; padding:8px 12px; font-size:12px; color:#374151; font-style:italic;">${v(s.comments)}</div>
      </td></tr>` : ""}

      <!-- BILLING + STAMP -->
      <tr><td style="padding:14px 28px; border-bottom:1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;">
              <div style="font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#9ca3af; font-weight:600; padding-bottom:4px; border-bottom:1px solid #e5e7eb; margin-bottom:10px;">Billing</div>
              <div style="font-size:13px; color:#374151; margin-bottom:3px;">Amount Due: <strong style="color:#111;">${amount}</strong></div>
              <div style="font-size:13px; color:#374151;">Payment Mode: <strong style="color:#111;">${v(s.payment_mode)}</strong></div>
            </td>
            <td style="text-align:right; vertical-align:bottom;">
              ${stampHtml(stampLabel, stampColor)}
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- HOLD CARD -->
      ${holdSection}

      <!-- TRACK BUTTON -->
      <tr><td style="padding:20px 28px; text-align:center;">
        <a href="${trackUrl(s.tracking_number)}" style="display:inline-block; background:#7c3aed; color:#fff; padding:11px 28px; border-radius:8px; text-decoration:none; font-weight:700; font-size:14px; letter-spacing:0.5px;">Track Your Shipment</a>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding:14px 28px 20px; text-align:center; border-top:1px solid #e5e7eb;">
        <div style="font-size:10px; color:#9ca3af; font-style:italic;">This is a computer-generated invoice and does not require a signature.</div>
        <div style="font-size:10px; color:#9ca3af; margin-top:2px;">&#169; 2026 Tranzex Route Logistics &bull; support@tranzexroute.com</div>
      </td></tr>

    </table>
  </td></tr>
</table>
${CONFIDENTIALITY}
</body>
</html>`;

  return { subject: `Invoice for Shipment ${v(s.tracking_number)}`, html };
}
