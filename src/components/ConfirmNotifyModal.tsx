import { useState, useEffect } from "react";
import { Loader2, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md [&>button]:hidden">
        <div className="flex items-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] px-5 py-4 text-white">
          <Mail className="h-5 w-5" />
          <DialogTitle className="text-white">{title}</DialogTitle>
        </div>
        <div className="space-y-4 px-5 py-5">
          <p className="text-sm text-gray-700">{body}</p>
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={sendEmail}
              onCheckedChange={(v) => setSendEmail(!!v)}
              disabled={busy}
            />
            <Label className="cursor-pointer text-sm">Send email</Label>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="bg-gray-100 hover:bg-gray-200"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleYes}
              disabled={busy}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Yes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
