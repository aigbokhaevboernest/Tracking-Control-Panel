import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HoldNotifyType = "plain" | "custom";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: (type: HoldNotifyType) => Promise<void> | void;
}

const OPTIONS: { value: HoldNotifyType; title: string; desc: string }[] = [
  { value: "plain", title: "Send normal hold notification", desc: "Standard “Action Required” hold notice." },
  { value: "custom", title: "Send custom hold notification", desc: "Uses this shipment's custom hold headline, body and footer." },
];

export function HoldNotifyTypeModal({ open, onCancel, onConfirm }: Props) {
  const [choice, setChoice] = useState<HoldNotifyType | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setChoice(null); setBusy(false); }
  }, [open]);

  async function handleConfirm() {
    if (!choice) return;
    setBusy(true);
    try { await onConfirm(choice); } finally { setBusy(false); }
  }

  if (!open) return null;

  return createPortal(
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 10002, background: "rgba(0,0,0,0.6)" }}
        onClick={() => !busy && onCancel()}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 10003, width: "calc(100vw - 48px)", maxWidth: 440, borderRadius: 14,
        overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.4)", background: "#fff",
      }}>
        <div style={{
          background: "linear-gradient(90deg, #d97706, #b45309)", padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 600, fontSize: 15,
        }}>
          <AlertTriangle size={18} />
          <span>Choose Hold Notification</span>
        </div>

        <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>
            Which hold email should the consignee receive?
          </p>

          {OPTIONS.map((o) => {
            const active = choice === o.value;
            return (
              <label key={o.value} style={{
                display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer",
                padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${active ? "#d97706" : "#e5e7eb"}`,
                background: active ? "#fffbeb" : "#fff",
              }}>
                <input
                  type="radio"
                  name="hold-notify-type"
                  checked={active}
                  onChange={() => setChoice(o.value)}
                  disabled={busy}
                  style={{ marginTop: 3 }}
                />
                <span>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#111827" }}>{o.title}</span>
                  <span style={{ display: "block", fontSize: 12, color: "#6b7280" }}>{o.desc}</span>
                </span>
              </label>
            );
          })}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <Button type="button" variant="outline" onClick={onCancel} disabled={busy} style={{ background: "#f3f4f6" }}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!choice || busy}
              style={{ background: "#d97706", color: "#fff", opacity: !choice || busy ? 0.5 : 1 }}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Send
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
