import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Send, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendMail, buildCustomEmail } from "@/lib/sendMail";

export default function CustomMessagePage() {
  const [shipmentId, setShipmentId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: shipments } = useQuery({
    queryKey: ["custom-msg-shipments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shipments")
        .select("id,tracking_number,receiver_name,receiver_email")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const selected = shipments?.find((s: any) => s.id === shipmentId);

  async function handleSend() {
    if (!selected) return toast.error("Select a shipment");
    if (!selected.receiver_email) return toast.error("Receiver has no email on file");
    if (!message.trim()) return toast.error("Message is required");
    setSending(true);
    const { subject, message: html } = buildCustomEmail(selected.tracking_number, message);
    const result = await sendMail({
      email: selected.receiver_email,
      subject,
      first_name: selected.receiver_name?.split(" ")[0] ?? "",
      message: html,
    });
    setSending(false);
    if (result.success) {
      toast.success("Email sent");
      setMessage("");
    } else {
      toast.error("Email failed", { description: result.error });
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <Mail className="h-6 w-6 text-violet-600" /> Custom Message
      </h2>
      <Card className="space-y-4 p-5">
        <div className="space-y-1">
          <Label>Shipment</Label>
          <select
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">Select a shipment…</option>
            {shipments?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.tracking_number} — {s.receiver_name ?? "—"} ({s.receiver_email ?? "no email"})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Message</Label>
          <Textarea
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message to the consignee…"
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={sending || !shipmentId}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Email
          </Button>
        </div>
      </Card>
    </div>
  );
}
