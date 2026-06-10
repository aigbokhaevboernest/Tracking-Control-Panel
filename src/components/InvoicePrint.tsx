import { createPortal } from "react-dom";
import { X, Send, Loader2 } from "lucide-react";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

interface InvoicePrintProps {
  open: boolean;
  onClose: () => void;
  shipment: any;
  onSend: () => void;
  sending: boolean;
}

function StampSVG({ label, color }: { label: string; color: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="45" r="42" stroke={color} strokeWidth="2.5" fill="none" />
      <circle cx="45" cy="45" r="36" stroke={color} strokeWidth="1" fill="none" strokeDasharray="3 3" />
      <text x="45" y="22" textAnchor="middle" fontSize="7" fontWeight="700" fill={color} fontFamily="DM Sans,Inter,sans-serif" letterSpacing="2">TRANZEX ROUTE</text>
      <text x="45" y="32" textAnchor="middle" fontSize="6" fontWeight="600" fill={color} fontFamily="DM Sans,Inter,sans-serif" letterSpacing="1.5">LOGISTICS</text>
      <text x="45" y="50" textAnchor="middle" fontSize="9" fontWeight="800" fill={color} fontFamily="DM Sans,Inter,sans-serif" letterSpacing="1">{label}</text>
      <text x="45" y="66" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={color} fontFamily="DM Sans,Inter,sans-serif" letterSpacing="2">* OFFICIAL *</text>
    </svg>
  );
}

export function InvoicePrint({ open, onClose, shipment: s, onSend, sending }: InvoicePrintProps) {
  if (!open || !s) return null;

  const isOnHold = s.status === "On Hold" || s.status === "Customs Hold";
  const stampColor = isOnHold ? "#d97706" : "#dc2626";
  const issued = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const styles: Record<string, React.CSSProperties> = {
    overlay: { position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.65)", overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center" },
    topbar: { width: "100%", maxWidth: 760, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", flexShrink: 0 },
    topbarLabel: { color: "#fff", fontSize: 13, fontWeight: 500 },
    topbarBtns: { display: "flex", gap: 8 },
    btnSend: { background: sending ? "#15803d99" : "#16a34a", color: "#fff", border: "none", padding: "7px 18px", borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "DM Sans, Inter, sans-serif" },
    btnClose: { background: "#fff", color: "#111", border: "none", padding: "7px 14px", borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, Inter, sans-serif" },
    page: { background: "#fff", width: "100%", maxWidth: 760, marginBottom: 32, boxShadow: "0 8px 40px rgba(0,0,0,0.4)", fontFamily: "DM Sans, Inter, sans-serif" },
    header: { background: "#d1d5db", padding: "22px 28px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
    headerLeft: { display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: 4 },
    invTitle: { fontFamily: "DM Sans, Inter, sans-serif", fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "0.03em", lineHeight: 1.1 },
    invSubtitle: { fontSize: 11, color: "#555", marginTop: 4, fontWeight: 400 },
    headerRight: { textAlign: "right" },
    invIssued: { fontSize: 11, color: "#555", marginBottom: 8, fontWeight: 400 },
    barcodeBox: { border: "1.5px solid #999", padding: "6px 8px 2px", background: "#fff", display: "inline-block" },
    barcodeNum: { fontSize: 10, textAlign: "center", color: "#111", fontFamily: "monospace", marginTop: 2, letterSpacing: "0.05em" },
    trackingBlock: { textAlign: "center", padding: "18px 28px 12px", borderBottom: "1px solid #e5e7eb" },
    trackingLabel: { fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6b7280", fontWeight: 600 },
    trackingNum: { fontSize: 22, fontWeight: 700, color: "#dc2626", letterSpacing: "0.04em", marginTop: 2 },
    trackingMeta: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 6 },
    badgeHold: { padding: "3px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", border: "1px solid #fde047", background: "#fef9c3", color: "#854d0e" },
    badgeNormal: { padding: "3px 12px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", border: "1px solid #93c5fd", background: "#dbeafe", color: "#1e40af" },
    locationTag: { fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 3 },
    parties: { display: "grid", gridTemplateColumns: "1fr 1fr", padding: "16px 28px", borderBottom: "1px solid #e5e7eb" },
    party: { paddingRight: 20 },
    partyRight: { paddingLeft: 16, paddingRight: 0, borderLeft: "1px solid #e5e7eb" },
    partyLabel: { fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#9ca3af", fontWeight: 600, marginBottom: 6, borderBottom: "1px solid #e5e7eb", paddingBottom: 4 },
    partyName: { fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4 },
    partyLine: { fontSize: 12, color: "#374151", lineHeight: 1.6, fontWeight: 400 },
    section: { padding: "14px 28px", borderBottom: "1px solid #e5e7eb" },
    sectionTitle: { fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#9ca3af", fontWeight: 600, marginBottom: 10, borderBottom: "1px solid #e5e7eb", paddingBottom: 4 },
    detailsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 16px" },
    detailRow: { fontSize: 12, color: "#374151", fontWeight: 400 },
    commentsBox: { background: "#fffbeb", borderLeft: "3px solid #f59e0b", padding: "8px 12px", borderRadius: 2, fontSize: 12, color: "#374151", fontStyle: "italic" },
    billingStampRow: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid #e5e7eb" },
    billingRow: { fontSize: 13, color: "#374151", marginBottom: 3, fontWeight: 400 },
    holdCard: { margin: "0 28px 16px", border: "1.5px solid #fde047", background: "#fefce8", borderRadius: 4, padding: "14px 16px" },
    holdHeader: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 },
    holdTag: { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#d97706", fontWeight: 700 },
    holdTitle: { fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 6 },
    holdBody: { fontSize: 12, color: "#374151", lineHeight: 1.55, marginBottom: 8 },
    holdContact: { fontSize: 11.5, color: "#374151", marginBottom: 3 },
    holdWallet: { fontSize: 11.5, color: "#374151", wordBreak: "break-all", marginBottom: 8 },
    holdDivider: { border: "none", borderTop: "1px dashed #d97706", margin: "8px 0" },
    holdInstruction: { fontSize: 11.5, color: "#374151", lineHeight: 1.5 },
    footer: { padding: "14px 28px 18px", textAlign: "center" },
    footerLine: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  };

  return createPortal(
    <div style={styles.overlay}>
      {/* Topbar */}
      <div style={styles.topbar}>
        <span style={styles.topbarLabel}>Invoice Preview</span>
        <div style={styles.topbarBtns}>
          <button style={styles.btnSend} onClick={onSend} disabled={sending}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
            {sending ? "Sending..." : "Send Invoice"}
          </button>
          <button style={styles.btnClose} onClick={onClose}>x Close</button>
        </div>
      </div>

      {/* Page */}
      <div style={styles.page}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.invTitle}>INVOICE</div>
            <div style={styles.invSubtitle}>Tranzex Route Logistics</div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.invIssued}>Issued: {issued}</div>
            <div style={styles.barcodeBox}>
              <svg width="140" height="48" viewBox="0 0 140 48">
                {[
                  [0,3],[4,1],[6,2],[9,1],[11,3],[15,2],[18,1],[20,2],[23,1],[25,3],
                  [29,1],[31,2],[34,3],[38,1],[40,2],[43,1],[45,3],[49,2],[52,1],[54,2],
                  [57,3],[61,1],[63,2],[66,1],[68,3],[72,1],[74,2],[77,2],[80,1],[82,3],
                  [86,1],[88,2],[91,1],[93,3],[97,2],[100,1],[102,2],[105,1],[107,3],[111,2],
                  [114,1],[116,3],[120,1],[122,2],[125,1],[127,3],[131,2],[134,1],[136,3],
                ].map(([x, w], i) => (
                  <rect key={i} x={x} width={w} height={48} fill="#111" />
                ))}
              </svg>
              <div style={styles.barcodeNum}>{s.tracking_number}</div>
            </div>
          </div>
        </div>

        {/* Tracking */}
        <div style={styles.trackingBlock}>
          <div style={styles.trackingLabel}>Tracking Number</div>
          <div style={styles.trackingNum}>{s.tracking_number}</div>
          <div style={styles.trackingMeta}>
            <span style={invoiceBadgeStyle(s.status)}>
              {(s.status || "").toUpperCase()}
            </span>
            {s.current_location && (
              <span style={styles.locationTag}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {s.current_location}
              </span>
            )}
          </div>
        </div>

        {/* Parties */}
        <div style={styles.parties}>
          <div style={styles.party}>
            <div style={styles.partyLabel}>From (Sender)</div>
            <div style={styles.partyName}>{s.sender_name}</div>
            {s.sender_phone && <div style={styles.partyLine}>{s.sender_phone}</div>}
            {s.sender_email && <div style={styles.partyLine}>{s.sender_email}</div>}
            {s.sender_address && <div style={styles.partyLine}>{s.sender_address}</div>}
          </div>
          <div style={{ ...styles.party, ...styles.partyRight }}>
            <div style={styles.partyLabel}>To (Receiver)</div>
            <div style={styles.partyName}>{s.receiver_name}</div>
            {s.receiver_phone && <div style={styles.partyLine}>{s.receiver_phone}</div>}
            {s.receiver_email && <div style={styles.partyLine}>{s.receiver_email}</div>}
            {s.receiver_address && <div style={styles.partyLine}>{s.receiver_address}</div>}
            {s.receiver_country && <div style={styles.partyLine}>{s.receiver_country}</div>}
          </div>
        </div>

        {/* Shipment Details */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Shipment Details</div>
          <div style={styles.detailsGrid}>
            {s.origin_label && <div style={styles.detailRow}>Origin: <strong>{s.origin_label}</strong></div>}
            {s.destination_label && <div style={styles.detailRow}>Destination: <strong>{s.destination_label}</strong></div>}
            {s.package_type && <div style={styles.detailRow}>Type: <strong>{s.package_type}</strong></div>}
            {s.weight && <div style={styles.detailRow}>Weight: <strong>{s.weight}</strong></div>}
            {s.date_sent && <div style={styles.detailRow}>Date Sent: <strong>{s.date_sent}</strong></div>}
            {s.expected_delivery_date && <div style={styles.detailRow}>Expected Delivery: <strong>{s.expected_delivery_date}</strong></div>}
            {s.description && <div style={{ ...styles.detailRow, gridColumn: "1 / -1" }}>Description: <strong>{s.description}</strong></div>}
          </div>
        </div>

        {/* Comments */}
        {s.comments && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Comments</div>
            <div style={styles.commentsBox}>{s.comments}</div>
          </div>
        )}

        {/* Billing + Stamp */}
        <div style={styles.billingStampRow}>
          <div>
            <div style={{ ...styles.sectionTitle, marginBottom: 8 }}>Billing</div>
            {s.amount_due && <div style={styles.billingRow}>Amount Due: <strong>{s.amount_due}</strong></div>}
            {s.payment_mode && <div style={styles.billingRow}>Payment Mode: <strong>{s.payment_mode}</strong></div>}
          </div>
          <StampSVG label={(s.status || "OFFICIAL").toUpperCase()} color={stampColor} />
        </div>

        {/* Customs Hold — only if ON HOLD */}
        {isOnHold && (s.hold_headline || s.hold_body) && (
          <div style={styles.holdCard}>
            <div style={styles.holdHeader}>
              <span style={{ color: "#d97706", fontSize: 13 }}>&#9651;</span>
              <span style={styles.holdTag}>Shipment on Hold</span>
            </div>
            {s.hold_headline && <div style={styles.holdTitle}>{s.hold_headline}</div>}
            {s.hold_body && <div style={styles.holdBody}>{s.hold_body}</div>}
            {s.hold_contact_email && <div style={styles.holdContact}>Contact: <strong>{s.hold_contact_email}</strong></div>}
            {s.crypto_wallet_address && <div style={styles.holdWallet}>Crypto Wallet: <strong>{s.crypto_wallet_address}</strong></div>}
            {s.payment_instruction_note && (
              <>
                <hr style={styles.holdDivider} />
                <div style={styles.holdInstruction}><strong>Instructions:</strong> {s.payment_instruction_note}</div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={{ ...styles.footerLine, fontStyle: "italic" }}>This is a computer-generated document and does not require a signature.</div>
          <div style={styles.footerLine}>&#169; 2026 Tranzex Route Logistics &bull; For inquiries: support@tranzexroute.com</div>
        </div>

      </div>
    </div>,
    document.body
  );
}
