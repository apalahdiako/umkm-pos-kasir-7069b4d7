import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, X, Download, MessageCircle, Trash2, FileText } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, useStoreSettings, waLink, printInvoice } from "@/lib/nota-store";
import { toast } from "sonner";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Invoice B2B — Nota Pro" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: InvoicesPage,
});

type LineItem = { name: string; qty: number; price: number };
type Status = "DRAFT" | "OUTSTANDING" | "PAID" | "CANCELLED";

type Invoice = {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  items: LineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: Status;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
};

const STATUS_COLOR: Record<Status, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  OUTSTANDING: "bg-orange-100 text-orange-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [editing, setEditing] = useState<Invoice | "new" | null>(null);
  const [settings] = useStoreSettings();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (data) setInvoices(data as unknown as Invoice[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => filter === "ALL" ? invoices : invoices.filter((i) => i.status === filter),
    [invoices, filter],
  );

  const stats = useMemo(() => ({
    outstanding: invoices.filter((i) => i.status === "OUTSTANDING").reduce((s, i) => s + Number(i.total), 0),
    paid: invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + Number(i.total), 0),
    draft: invoices.filter((i) => i.status === "DRAFT").length,
  }), [invoices]);

  const exportCsv = () => {
    const rows = [
      ["Invoice No", "Tanggal", "Customer", "Subtotal", "Pajak", "Diskon", "Total", "Status", "Jatuh Tempo", "Metode"],
      ...invoices.map((i) => [
        i.invoice_no, i.issue_date, i.customer_name, i.subtotal, i.tax, i.discount, i.total,
        i.status, i.due_date || "", i.payment_method || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV diekspor (siap import ke Kledo)");
  };

  const markPaid = async (inv: Invoice) => {
    const method = prompt("Metode bayar (Transfer / Tunai / QRIS):", "Transfer") || "Transfer";
    await supabase.from("invoices").update({
      status: "PAID", paid_at: new Date().toISOString(), payment_method: method,
    }).eq("id", inv.id);
    toast.success("Invoice ditandai LUNAS");
    load();
  };

  const send = async (inv: Invoice) => {
    if (inv.status === "DRAFT") {
      await supabase.from("invoices").update({ status: "OUTSTANDING" }).eq("id", inv.id);
      toast.success("Invoice dikirim, status OUTSTANDING");
      load();
    }
    if (inv.customer_phone) {
      const msg = `Halo ${inv.customer_name}, berikut invoice *${inv.invoice_no}* dari ${settings.storeName}\nTotal: ${formatCurrency(Number(inv.total))}\nJatuh tempo: ${inv.due_date || "-"}\nTerima kasih.`;
      window.open(waLink(inv.customer_phone, msg), "_blank");
    }
  };

  const removeInv = async (inv: Invoice) => {
    if (!confirm(`Hapus invoice ${inv.invoice_no}?`)) return;
    await supabase.from("invoices").delete().eq("id", inv.id);
    load();
  };

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-2xl font-bold">Invoice B2B</h2>
          <p className="text-sm text-slate-600">Draft → Outstanding → Paid. Export CSV siap untuk Kledo.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded text-sm flex items-center gap-1">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => setEditing("new")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> Invoice Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Outstanding" value={formatCurrency(stats.outstanding)} color="text-orange-600" />
        <StatCard label="Lunas" value={formatCurrency(stats.paid)} color="text-green-600" />
        <StatCard label="Draft" value={`${stats.draft} invoice`} color="text-slate-600" />
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {(["ALL", "DRAFT", "OUTSTANDING", "PAID", "CANCELLED"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full ${filter === s ? "bg-blue-600 text-white" : "bg-white border"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Memuat...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Tidak ada invoice.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="text-left p-3">No</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Tanggal</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-right p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">{inv.invoice_no}</td>
                    <td className="p-3">{inv.customer_name}</td>
                    <td className="p-3 text-xs text-slate-500">{inv.issue_date}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(Number(inv.total))}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLOR[inv.status]}`}>{inv.status}</span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => printInvoiceFromRow(inv, settings)} className="text-blue-600 mr-2" title="Print"><FileText className="h-4 w-4 inline" /></button>
                      <button onClick={() => send(inv)} className="text-green-600 mr-2" title="Kirim WA"><MessageCircle className="h-4 w-4 inline" /></button>
                      {inv.status !== "PAID" && (
                        <button onClick={() => markPaid(inv)} className="text-xs text-green-700 mr-2 hover:underline">Lunas</button>
                      )}
                      <button onClick={() => setEditing(inv)} className="text-xs text-blue-700 mr-2 hover:underline">Edit</button>
                      <button onClick={() => removeInv(inv)} className="text-red-500"><Trash2 className="h-3.5 w-3.5 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <InvoiceEditor invoice={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </AppLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-3 border">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function printInvoiceFromRow(inv: Invoice, settings: ReturnType<typeof useStoreSettings>[0]) {
  printInvoice({
    id: inv.invoice_no, date: inv.issue_date, customer: inv.customer_name,
    items: inv.items.map((it, i) => ({ productId: i, name: it.name, price: it.price, qty: it.qty })),
    subtotal: Number(inv.subtotal), discount: Number(inv.discount), tax: Number(inv.tax), total: Number(inv.total),
    paymentMethod: (inv.payment_method as never) || "Transfer", amountPaid: inv.status === "PAID" ? Number(inv.total) : 0,
    change: 0, status: inv.status === "PAID" ? "completed" : "pending",
  }, settings);
}

function InvoiceEditor({ invoice, onClose, onSaved }: { invoice: Invoice | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    invoice_no: invoice?.invoice_no || `INV-${Date.now().toString().slice(-6)}`,
    customer_name: invoice?.customer_name || "",
    customer_phone: invoice?.customer_phone || "",
    customer_email: invoice?.customer_email || "",
    issue_date: invoice?.issue_date || new Date().toISOString().slice(0, 10),
    due_date: invoice?.due_date || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    tax: invoice?.tax || 0,
    discount: invoice?.discount || 0,
    notes: invoice?.notes || "",
  });
  const [items, setItems] = useState<LineItem[]>(invoice?.items || [{ name: "", qty: 1, price: 0 }]);

  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const total = subtotal - Number(form.discount || 0) + Number(form.tax || 0);

  const save = async (asDraft: boolean) => {
    if (!form.customer_name.trim()) return toast.error("Nama customer wajib");
    if (items.length === 0 || items.every((i) => !i.name)) return toast.error("Minimal 1 item");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      owner_id: user.id,
      invoice_no: form.invoice_no,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone || null,
      customer_email: form.customer_email || null,
      items: items.filter((i) => i.name) as unknown as never,
      subtotal, tax: Number(form.tax), discount: Number(form.discount), total,
      status: asDraft ? "DRAFT" : "OUTSTANDING",
      issue_date: form.issue_date,
      due_date: form.due_date || null,
      notes: form.notes || null,
    };
    const op = invoice
      ? supabase.from("invoices").update(payload).eq("id", invoice.id)
      : supabase.from("invoices").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Tersimpan");
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">{invoice ? "Edit Invoice" : "Invoice Baru"}</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="No Invoice" value={form.invoice_no} onChange={(v) => setForm({ ...form, invoice_no: v })} />
            <Field label="Customer" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} />
            <Field label="Telp/WA" value={form.customer_phone} onChange={(v) => setForm({ ...form, customer_phone: v })} />
            <Field label="Email" value={form.customer_email} onChange={(v) => setForm({ ...form, customer_email: v })} />
            <Field label="Tanggal" type="date" value={form.issue_date} onChange={(v) => setForm({ ...form, issue_date: v })} />
            <Field label="Jatuh Tempo" type="date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-600">ITEM</p>
              <button onClick={() => setItems([...items, { name: "", qty: 1, price: 0 }])} className="text-xs text-blue-600">+ Tambah baris</button>
            </div>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-1 mb-1">
                <input placeholder="Deskripsi" value={it.name} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} className="col-span-6 border rounded px-2 py-1.5 text-sm" />
                <input type="number" placeholder="Qty" value={it.qty} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, qty: +e.target.value } : x))} className="col-span-2 border rounded px-2 py-1.5 text-sm" />
                <input type="number" placeholder="Harga" value={it.price} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, price: +e.target.value } : x))} className="col-span-3 border rounded px-2 py-1.5 text-sm" />
                <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="col-span-1 text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Diskon (Rp)" type="number" value={String(form.discount)} onChange={(v) => setForm({ ...form, discount: +v })} />
            <Field label="Pajak (Rp)" type="number" value={String(form.tax)} onChange={(v) => setForm({ ...form, tax: +v })} />
          </div>

          <div className="bg-slate-50 rounded p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(Number(form.discount))}</span></div>
            <div className="flex justify-between"><span>Pajak</span><span>{formatCurrency(Number(form.tax))}</span></div>
            <div className="flex justify-between font-bold text-base text-blue-600 border-t pt-1"><span>TOTAL</span><span>{formatCurrency(total)}</span></div>
          </div>

          <div>
            <label className="text-xs text-slate-600">Catatan</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" rows={2} />
          </div>
        </div>
        <div className="border-t p-3 flex gap-2">
          <button onClick={() => save(true)} className="flex-1 bg-slate-200 py-2 rounded text-sm font-medium">Simpan Draft</button>
          <button onClick={() => save(false)} className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-medium">Simpan & Kirim (Outstanding)</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-slate-600">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm" />
    </div>
  );
}
