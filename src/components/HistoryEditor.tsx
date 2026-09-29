import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type H = { status?: string; location?: string; comments?: string; remarks?: string; date?: string; at?: string; [k: string]: any };
type Draft = { status: string; location: string; comments: string; when: string };

const pad = (n: number) => String(n).padStart(2, "0");
const whenOf = (h: H) => h.at || h.date;
const ts = (v?: string) => { const t = v ? new Date(v).getTime() : 0; return isNaN(t) ? 0 : t; };
function toInput(v?: string) {
  const d = v ? new Date(v) : new Date();
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmt(v?: string) {
  const t = ts(v);
  return t ? new Date(t).toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : (v ?? "—");
}

const field: React.CSSProperties = { fontSize: 16, width: "100%", height: 40, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", padding: "0 10px", boxSizing: "border-box" };

export function HistoryEditor({
  shipmentId, history, onSaved,
}: { shipmentId: string; history: any[]; onSaved?: (next: H[]) => void }) {
  const [rows, setRows] = useState<H[]>([]);
  const [editing, setEditing] = useState<number | null>(null); // -1 = new row
  const [draft, setDraft] = useState<Draft>({ status: "", location: "", comments: "", when: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRows(Array.isArray(history) ? history : []);
    setEditing(null);
  }, [history]);

  async function persist(next: H[]) {
    setBusy(true);
    const { error } = await supabase.from("shipments").update({ history: next }).eq("id", shipmentId);
    setBusy(false);
    if (error) { toast.error("Could not save history", { description: error.message }); return false; }
    setRows(next);
    toast.success("History updated");
    onSaved?.(next);
    return true;
  }

  function startEdit(i: number) {
    const r = rows[i];
    setDraft({ status: r.status ?? "", location: r.location ?? "", comments: r.comments ?? r.remarks ?? "", when: toInput(whenOf(r)) });
    setEditing(i);
  }
  function startNew() {
    setDraft({ status: "", location: "", comments: "", when: toInput() });
    setEditing(-1);
  }

  async function saveDraft() {
    if (editing === null) return;
    const iso = draft.when ? new Date(draft.when).toISOString() : new Date().toISOString();
    const entry: H = {
      ...(editing >= 0 ? rows[editing] : {}),
      status: draft.status, location: draft.location, comments: draft.comments,
      date: iso, at: iso,
    };
    const next = editing === -1 ? [entry, ...rows] : rows.map((r, i) => (i === editing ? entry : r));
    next.sort((a, b) => ts(whenOf(b)) - ts(whenOf(a)));
    if (await persist(next)) setEditing(null);
  }

  async function remove(i: number) {
    if (!window.confirm("Delete this history entry?")) return;
    await persist(rows.filter((_, idx) => idx !== i));
  }

  const editor = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10, background: "#faf5ff", borderRadius: 10, border: "1px solid #e9d5ff" }}>
      <input style={field} placeholder="Status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} />
      <input style={field} placeholder="Location" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
      <input style={field} type="datetime-local" value={draft.when} onChange={(e) => setDraft({ ...draft, when: e.target.value })} />
      <textarea style={{ ...field, height: "auto", padding: 10 }} rows={2} placeholder="Comments" value={draft.comments} onChange={(e) => setDraft({ ...draft, comments: e.target.value })} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" disabled={busy} onClick={() => setEditing(null)} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-sm">
          <X size={14} /> Cancel
        </button>
        <button type="button" disabled={busy} onClick={saveDraft} className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-sm text-white">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-violet-600">Shipment History</h3>
        <button type="button" onClick={startNew} disabled={busy || editing !== null} className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs text-white disabled:opacity-50">
          <Plus size={12} /> Add entry
        </button>
      </div>

      {editing === -1 && editor}
      {rows.length === 0 && editing !== -1 && <p className="text-sm text-gray-500">No history yet.</p>}

      {rows.map((r, i) =>
        editing === i ? (
          <div key={i}>{editor}</div>
        ) : (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 text-sm">
                <div className="font-semibold text-gray-900 break-words">{r.status || "—"}{r.location ? ` · ${r.location}` : ""}</div>
                <div className="text-xs text-gray-500">{fmt(whenOf(r))}</div>
                {(r.comments || r.remarks) && <div className="mt-1 text-xs text-gray-700 break-words">{r.comments || r.remarks}</div>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" disabled={busy || editing !== null} onClick={() => startEdit(i)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-40"><Pencil size={15} /></button>
                <button type="button" disabled={busy || editing !== null} onClick={() => remove(i)} className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
