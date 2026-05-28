import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, X, Award, MessageCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  formatCurrency,
  shortId,
  useMembers,
  useStoreSettings,
  useTransactions,
  waLink,
} from "@/lib/nota-store";

export const Route = createFileRoute("/members")({
  head: () => ({ meta: [{ title: "Member & Loyalty — Nota Pro" }] }),
  component: MembersPage,
});

function MembersPage() {
  const [members, setMembers] = useMembers();
  const [transactions] = useTransactions();
  const [settings] = useStoreSettings();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "" });

  const enriched = useMemo(() => {
    return members
      .map((m) => {
        const txs = transactions.filter((t) => t.memberId === m.id);
        const totalSpent = txs.reduce((s, t) => s + t.total, 0);
        return { ...m, totalSpent, txCount: txs.length };
      })
      .filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.phone.includes(search),
      )
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [members, transactions, search]);

  const totalPoints = members.reduce((s, m) => s + m.points, 0);

  const add = () => {
    if (!draft.name || !draft.phone) return alert("Nama & HP wajib");
    if (members.some((m) => m.phone === draft.phone)) return alert("Nomor sudah terdaftar");
    setMembers([
      {
        id: shortId("MBR"),
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        points: 0,
        totalSpent: 0,
        joinedAt: new Date().toISOString(),
      },
      ...members,
    ]);
    setDraft({ name: "", phone: "" });
    setShowForm(false);
  };

  const sendPromo = (m: { name: string; phone: string; points: number }) => {
    const msg = `Halo ${m.name}! 🎉\n\nTerima kasih sudah jadi member *${settings.storeName}*.\nPoin Anda saat ini: *${m.points}* (≈ ${formatCurrency(m.points * settings.rupiahPerPoint)}).\n\nTukar poin untuk diskon di kunjungan berikutnya!`;
    window.open(waLink(m.phone, msg), "_blank");
  };

  const remove = (id: string) => {
    if (!confirm("Hapus member?")) return;
    setMembers(members.filter((m) => m.id !== id));
  };

  return (
    <AppLayout>
      <header className="mb-6 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Member & Loyalty</h1>
          <p className="text-slate-600 mt-1">CRM pelanggan & program poin</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Plus className="h-4 w-4" /> Tambah Member
        </button>
      </header>

      <section className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Total Member" value={String(members.length)} color="blue" />
        <Stat label="Total Poin Beredar" value={String(totalPoints)} color="purple" />
        <Stat label="Nilai Poin" value={formatCurrency(totalPoints * settings.rupiahPerPoint)} color="green" />
      </section>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau HP..." className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {enriched.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">Belum ada member</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Nama</th>
                <th className="text-left px-4 py-2 font-medium">HP</th>
                <th className="text-right px-4 py-2 font-medium">Poin</th>
                <th className="text-right px-4 py-2 font-medium">Total Belanja</th>
                <th className="text-right px-4 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{m.name}</td>
                  <td className="px-4 py-2 text-slate-700">{m.phone}</td>
                  <td className="px-4 py-2 text-right">
                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                      <Award className="h-3 w-3" /> {m.points}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">{formatCurrency(m.totalSpent)}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => sendPromo(m)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1.5 rounded flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> WA
                      </button>
                      <button onClick={() => remove(m.id)} className="text-slate-400 hover:text-red-600 p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-bold">Daftar Member</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nama" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="08xxxx" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <button onClick={add} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold">Daftar</button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 border-l-4 border-${color}-500`}>
      <p className="text-xs text-slate-600">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1 truncate">{value}</p>
    </div>
  );
}
