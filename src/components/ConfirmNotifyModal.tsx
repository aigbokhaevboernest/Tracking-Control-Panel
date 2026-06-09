import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (sendEmail: boolean) => Promise<void> | void;
  title?: string;
  body?: string;
  defaultChecked?: boolean;
}

export function ConfirmNotifyModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Save & Notify Consignee",
  body = "Do you want to save these shipment details and notify the consignee/receiver by email?",
  defaultChecked = true,
}: Props) {
  const [sendEmail, setSendEmail] = useState(defaultChecked);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSendEmail(defaultChecked);
      setBusy(false);
    }
  }, [open, defaultChecked]);

  async function handleYes() {
    setBusy(true);
    try {
      await onConfirm(sendEmail);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop — higher than shipment modal */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          background: "rgba(0,0,0,0.6)",
        }}
        onClick={() => !busy && onOpenChange(false)}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10001,
          width: "calc(100vw - 48px)",
          maxWidth: 440,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          background: "#fff",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(90deg, #7c3aed, #6d28d9)",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          <Mail size={18} />
          <span>{title}</span>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>{body}</p>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Checkbox
              checked={sendEmail}
              onCheckedChange={(v) => setSendEmail(!!v)}
              disabled={busy}
            />
            <Label style={{ cursor: "pointer", fontSize: 14 }}>Send email notification to consignee</Label>
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              style={{ background: "#f3f4f6" }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleYes}
              disabled={busy}
              style={{ background: "#7c3aed", color: "#fff" }}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Save
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
