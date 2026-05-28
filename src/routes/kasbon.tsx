import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, MessageCircle, CheckCircle2, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  formatCurrency,
  shortId,
  useCashbons,
  useStoreSettings,
  waLink,
  type Cashbon,
} from "@/lib/nota-store";

export const Route = createFileRoute("/kasbon")({
  head: () => ({ meta: [{ title: "Kasbon / Piutang — Nota Pro" }] }),
  component: KasbonPage,
});

function KasbonPage() {
  const [cashbons, setCashbons] = useCashbons();
  const [settings] = useStoreSettings();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({
    customer: "",
    phone: "",
    amount: "",
    description: "",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  const today = new Date().toISOString().slice(0, 10);
  const enriched: Cashbon[] = cashbons.map((c) => ({
    ...c,
    status:
      c.paid >= c.amount ? "paid" : c.dueDate < today ? "overdue" : "open",
  }));

  const totalOutstanding = enriched
    .filter((c) => c.status !== "paid")
    .reduce((s, c) => s + (c.amount - c.paid), 0);
  const overdueCount = enriched.filter((c) => c.status === "overdue").length;

  const save = () => {
    if (!draft.customer || !draft.amount) return alert("Nama & nominal wajib");
    setCashbons([
      {
        id: shortId("KB"),
        customer: draft.customer.trim(),
        phone: draft.phone,
        amount: Number(draft.amount) || 0,
        paid: 0,
        description: draft.description,
        dueDate: draft.dueDate,
        createdAt: new Date().toISOString(),
        status: "open",
        lastReminderAt: null,
      },
      ...cashbons,
    ]);
    setShowForm(false);
    setDraft({ customer: "", phone: "", amount: "", description: "", dueDate: draft.dueDate });
  };

  const markPaid = (id: string) => {
    setCashbons(cashbons.map((c) => (c.id === id ? { ...c, paid: c.amount, status: "paid" } : c)));
  };

  const sendReminder = (c: Cashbon) => {
    if (!c.phone) return alert("Nomor HP pelanggan belum diisi");
    const due = new Date(c.dueDate).toLocaleDateString("id-ID");
    const msg = `Halo ${c.customer}, ini pengingat sopan dari *${settings.storeName}*.\n\nMasih ada kasbon Rp ${formatCurrency(
      c.amount - c.paid,
    )} (${c.description || "tagihan"}) jatuh tempo ${due}.\n\nMohon segera diselesaikan, terima kasih 🙏`;
    setCashbons(
      cashbons.map((x) => (x.id === c.id ? { ...x, lastReminderAt: new Date().toISOString() } : x)),
    );
    window.open(waLink(c.phone, msg), "_blank");
  };

  const remove = (id: string) => {
    if (!confirm("Hapus kasbon?")) return;
    setCashbons(cashbons.filter((c) => c.id !== id));
  };

  return (
    <AppLayout>
      <header className="mb-6 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Buku Kasbon</h1>
          <p className="text-slate-600 mt-1">Catat piutang & kirim pengingat via WhatsApp</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Tambah Kasbon
        </button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Stat label="Total Piutang" value={formatCurrency(totalOutstanding)} color="orange" />
        <Stat label="Jatuh Tempo" value={String(overdueCount)} color="red" />
        <Stat label="Total Pelanggan" value={String(cashbons.length)} color="blue" />
      </section>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {enriched.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">Belum ada kasbon</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {enriched.map((c) => (
              <li key={c.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">{c.customer}</p>
                    <Badge status={c.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.phone || "—"} · Jatuh tempo {new Date(c.dueDate).toLocaleDateString("id-ID")}
                  </p>
                  {c.description && <p className="text-xs text-slate-600 mt-1">{c.description}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatCurrency(c.amount - c.paid)}</p>
                  <p className="text-[10px] text-slate-400">dari {formatCurrency(c.amount)}</p>
                </div>
                <div className="flex gap-1">
                  {c.status !== "paid" && (
                    <>
                      <button
                        onClick={() => sendReminder(c)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WA
                      </button>
                      <button
                        onClick={() => markPaid(c.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Lunas
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => remove(c.id)}
                    className="text-slate-400 hover:text-red-600 p-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-bold">Kasbon Baru</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Nama Pelanggan">
                <input value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </Field>
              <Field label="No. HP (untuk pengingat WA)">
                <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="08xxxx" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </Field>
              <Field label="Nominal">
                <input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </Field>
              <Field label="Keterangan">
                <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </Field>
              <Field label="Jatuh Tempo">
                <input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </Field>
            </div>
            <button onClick={save} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold">Simpan</button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-slate-700 font-medium mb-1">{label}</label>{children}</div>;
}
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 border-l-4 border-${color}-500`}>
      <p className="text-xs text-slate-600">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
  };
  const label: Record<string, string> = { open: "Aktif", paid: "Lunas", overdue: "Jatuh tempo" };
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${map[status]}`}>{label[status]}</span>;
}
