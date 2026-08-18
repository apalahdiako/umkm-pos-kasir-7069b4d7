import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, BookOpen, TrendingUp, TrendingDown } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Modal, Field, inputCls, btnPrimary, btnDanger, btnGhost, PageHeader, Tabs, formatRp } from "@/components/CrudHelpers";
import {
  listAccounts, upsertAccount, deleteAccount,
  listJournal, postJournal,
  listReceivables, upsertReceivable,
  listPayables, upsertPayable,
  profitLoss,
} from "@/lib/umkm.functions";

export const Route = createFileRoute("/accounting")({
  head: () => ({ meta: [{ title: "Akuntansi — BY.UMKMKASIR" }] }),
  component: AccPage,
});

const accountTypes = [
  { value: "asset", label: "Aset" },
  { value: "liability", label: "Liabilitas" },
  { value: "equity", label: "Ekuitas" },
  { value: "revenue", label: "Pendapatan" },
  { value: "expense", label: "Beban" },
];

function AccPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"coa" | "journal" | "ar" | "ap" | "pl">("pl");

  const la = useServerFn(listAccounts);
  const ua = useServerFn(upsertAccount);
  const da = useServerFn(deleteAccount);
  const lj = useServerFn(listJournal);
  const pj = useServerFn(postJournal);
  const lr = useServerFn(listReceivables);
  const ur = useServerFn(upsertReceivable);
  const lp = useServerFn(listPayables);
  const up = useServerFn(upsertPayable);
  const pl = useServerFn(profitLoss);

  const aQ = useQuery({ queryKey: ["acc-coa"], queryFn: () => la() });
  const jQ = useQuery({ queryKey: ["acc-j"], queryFn: () => lj() });
  const rQ = useQuery({ queryKey: ["acc-r"], queryFn: () => lr() });
  const pQ = useQuery({ queryKey: ["acc-p"], queryFn: () => lp() });
  const plQ = useQuery({ queryKey: ["acc-pl"], queryFn: () => pl() });

  const aUp = useMutation({ mutationFn: (d: any) => ua({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["acc-coa"] }) });
  const aDel = useMutation({ mutationFn: (id: string) => da({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["acc-coa"] }) });
  const jPost = useMutation({
    mutationFn: (d: any) => pj({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["acc-j"] }); qc.invalidateQueries({ queryKey: ["acc-pl"] }); },
  });
  const rUp = useMutation({ mutationFn: (d: any) => ur({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["acc-r"] }) });
  const pUp = useMutation({ mutationFn: (d: any) => up({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["acc-p"] }) });

  const [aForm, setAForm] = useState(false);
  const [aDraft, setADraft] = useState<any>({ code: "", name: "", account_type: "asset" });
  const [jForm, setJForm] = useState(false);
  const [jDraft, setJDraft] = useState<any>({
    entry_date: new Date().toISOString().slice(0, 10), description: "", reference: "",
    lines: [{ account_code: "", account_name: "", debit: 0, credit: 0 }, { account_code: "", account_name: "", debit: 0, credit: 0 }],
  });
  const [rForm, setRForm] = useState(false);
  const [rDraft, setRDraft] = useState<any>({ customer_name: "", amount: 0, due_date: "", status: "open", notes: "" });
  const [pForm, setPForm] = useState(false);
  const [pDraft, setPDraft] = useState<any>({ vendor_name: "", amount: 0, due_date: "", status: "open", notes: "" });

  const accounts = aQ.data ?? [];
  const setLine = (i: number, patch: any) => {
    const lines = [...jDraft.lines];
    lines[i] = { ...lines[i], ...patch };
    if (patch.account_code) {
      const acc = accounts.find((a: any) => a.code === patch.account_code);
      if (acc) lines[i].account_name = acc.name;
    }
    setJDraft({ ...jDraft, lines });
  };
  const totalDebit = jDraft.lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
  const totalCredit = jDraft.lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);

  return (
    <AppLayout>
      <PageHeader title="Akuntansi & Keuangan" subtitle="COA, jurnal, hutang/piutang, laba rugi" />
      <Tabs value={tab} onChange={setTab} options={[
        { value: "pl", label: "Laba Rugi" },
        { value: "journal", label: "Jurnal" },
        { value: "coa", label: "Bagan Akun" },
        { value: "ar", label: "Piutang" },
        { value: "ap", label: "Hutang" },
      ]} />

      {tab === "pl" && plQ.data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card label="Pendapatan" value={formatRp(plQ.data.revenue)} icon={<TrendingUp className="h-6 w-6 text-green-600" />} color="green" />
          <Card label="Beban" value={formatRp(plQ.data.expense)} icon={<TrendingDown className="h-6 w-6 text-red-600" />} color="red" />
          <Card label="Laba Bersih" value={formatRp(plQ.data.profit)} icon={<BookOpen className="h-6 w-6 text-blue-600" />} color={plQ.data.profit >= 0 ? "blue" : "orange"} />
        </div>
      )}

      {tab === "coa" && (
        <>
          <button onClick={() => { setADraft({ code: "", name: "", account_type: "asset" }); setAForm(true); }} className={`${btnPrimary} mb-4`}><Plus className="h-4 w-4" /> Tambah Akun</button>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700"><tr><th className="p-3 text-left">Kode</th><th className="p-3 text-left">Nama Akun</th><th className="p-3">Tipe</th><th className="p-3"></th></tr></thead>
              <tbody>
                {accounts.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Belum ada akun. Mulai dengan: 1100 Kas, 1200 Bank, 4100 Penjualan, 5100 Beban Operasional.</td></tr>}
                {accounts.map((a: any) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="p-3 font-mono">{a.code}</td>
                    <td className="p-3 font-medium">{a.name}</td>
                    <td className="p-3 text-center"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{a.account_type}</span></td>
                    <td className="p-3 text-right"><button onClick={() => confirm("Hapus?") && aDel.mutate(a.id)} className={btnDanger}><Trash2 className="h-3 w-3 inline" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "journal" && (
        <>
          <button onClick={() => setJForm(true)} className={`${btnPrimary} mb-4`} disabled={accounts.length === 0}><Plus className="h-4 w-4" /> Jurnal Baru</button>
          {accounts.length === 0 && <p className="text-sm text-orange-600 mb-2">Buat akun di tab Bagan Akun dulu.</p>}
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700"><tr><th className="p-3 text-left">Tanggal</th><th className="p-3 text-left">Keterangan</th><th className="p-3 text-right">Total</th></tr></thead>
              <tbody>
                {(jQ.data?.entries ?? []).length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500">Belum ada jurnal</td></tr>}
                {(jQ.data?.entries ?? []).map((e: any) => (
                  <tr key={e.id} className="border-t border-slate-100"><td className="p-3">{e.entry_date}</td><td className="p-3"><div className="font-medium">{e.description}</div><div className="text-xs text-slate-500">{(jQ.data?.lines ?? []).filter((l: any) => l.entry_id === e.id).map((l: any) => `${l.account_code} ${l.account_name}`).join(" / ")}</div></td><td className="p-3 text-right font-semibold">{formatRp(e.total_amount)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "ar" && (
        <>
          <button onClick={() => { setRDraft({ customer_name: "", amount: 0, due_date: "", status: "open", notes: "" }); setRForm(true); }} className={`${btnPrimary} mb-4`}><Plus className="h-4 w-4" /> Piutang Baru</button>
          <RecvTable rows={rQ.data ?? []} onEdit={(r: any) => { setRDraft(r); setRForm(true); }} />
        </>
      )}

      {tab === "ap" && (
        <>
          <button onClick={() => { setPDraft({ vendor_name: "", amount: 0, due_date: "", status: "open", notes: "" }); setPForm(true); }} className={`${btnPrimary} mb-4`}><Plus className="h-4 w-4" /> Hutang Baru</button>
          <PayTable rows={pQ.data ?? []} onEdit={(p: any) => { setPDraft(p); setPForm(true); }} />
        </>
      )}

      <Modal open={aForm} onClose={() => setAForm(false)} title="Akun Baru">
        <Field label="Kode (contoh: 1100)"><input className={inputCls} value={aDraft.code} onChange={(e) => setADraft({ ...aDraft, code: e.target.value })} /></Field>
        <Field label="Nama Akun"><input className={inputCls} value={aDraft.name} onChange={(e) => setADraft({ ...aDraft, name: e.target.value })} /></Field>
        <Field label="Tipe"><select className={inputCls} value={aDraft.account_type} onChange={(e) => setADraft({ ...aDraft, account_type: e.target.value })}>{accountTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
        <button onClick={() => aUp.mutate(aDraft, { onSuccess: () => setAForm(false) })} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold">Simpan</button>
      </Modal>

      <Modal open={jForm} onClose={() => setJForm(false)} title="Jurnal Baru">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal"><input type="date" className={inputCls} value={jDraft.entry_date} onChange={(e) => setJDraft({ ...jDraft, entry_date: e.target.value })} /></Field>
          <Field label="Ref"><input className={inputCls} value={jDraft.reference} onChange={(e) => setJDraft({ ...jDraft, reference: e.target.value })} /></Field>
        </div>
        <Field label="Keterangan"><input className={inputCls} value={jDraft.description} onChange={(e) => setJDraft({ ...jDraft, description: e.target.value })} /></Field>
        <div className="text-xs font-medium text-slate-700 mb-1">Baris Jurnal</div>
        {jDraft.lines.map((l: any, i: number) => (
          <div key={i} className="grid grid-cols-12 gap-1 mb-1">
            <select className={`col-span-6 ${inputCls}`} value={l.account_code} onChange={(e) => setLine(i, { account_code: e.target.value })}>
              <option value="">— akun —</option>
              {accounts.map((a: any) => <option key={a.id} value={a.code}>{a.code} {a.name}</option>)}
            </select>
            <input type="number" placeholder="Debit" className={`col-span-3 ${inputCls}`} value={l.debit} onChange={(e) => setLine(i, { debit: Number(e.target.value) })} />
            <input type="number" placeholder="Kredit" className={`col-span-3 ${inputCls}`} value={l.credit} onChange={(e) => setLine(i, { credit: Number(e.target.value) })} />
          </div>
        ))}
        <button onClick={() => setJDraft({ ...jDraft, lines: [...jDraft.lines, { account_code: "", account_name: "", debit: 0, credit: 0 }] })} className="text-xs text-blue-600 mb-2">+ Tambah baris</button>
        <div className={`text-xs mb-2 ${totalDebit === totalCredit ? "text-green-600" : "text-red-600"}`}>Total Debit: {formatRp(totalDebit)} · Kredit: {formatRp(totalCredit)} {totalDebit !== totalCredit && "(belum balance)"}</div>
        <button disabled={totalDebit !== totalCredit || totalDebit === 0 || !jDraft.description} onClick={() => jPost.mutate(jDraft, { onSuccess: () => setJForm(false) })} className="w-full bg-green-600 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-semibold">Posting</button>
      </Modal>

      <Modal open={rForm} onClose={() => setRForm(false)} title={rDraft.id ? "Edit Piutang" : "Piutang Baru"}>
        <Field label="Customer"><input className={inputCls} value={rDraft.customer_name} onChange={(e) => setRDraft({ ...rDraft, customer_name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jumlah"><input type="number" className={inputCls} value={rDraft.amount} onChange={(e) => setRDraft({ ...rDraft, amount: Number(e.target.value) })} /></Field>
          <Field label="Dibayar"><input type="number" className={inputCls} value={rDraft.paid_amount ?? 0} onChange={(e) => setRDraft({ ...rDraft, paid_amount: Number(e.target.value) })} /></Field>
          <Field label="Jatuh Tempo"><input type="date" className={inputCls} value={rDraft.due_date ?? ""} onChange={(e) => setRDraft({ ...rDraft, due_date: e.target.value })} /></Field>
          <Field label="Status"><select className={inputCls} value={rDraft.status} onChange={(e) => setRDraft({ ...rDraft, status: e.target.value })}><option value="open">Belum</option><option value="partial">Sebagian</option><option value="paid">Lunas</option><option value="overdue">Lewat</option></select></Field>
        </div>
        <button onClick={() => rUp.mutate(rDraft, { onSuccess: () => setRForm(false) })} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold">Simpan</button>
      </Modal>

      <Modal open={pForm} onClose={() => setPForm(false)} title={pDraft.id ? "Edit Hutang" : "Hutang Baru"}>
        <Field label="Vendor"><input className={inputCls} value={pDraft.vendor_name} onChange={(e) => setPDraft({ ...pDraft, vendor_name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jumlah"><input type="number" className={inputCls} value={pDraft.amount} onChange={(e) => setPDraft({ ...pDraft, amount: Number(e.target.value) })} /></Field>
          <Field label="Dibayar"><input type="number" className={inputCls} value={pDraft.paid_amount ?? 0} onChange={(e) => setPDraft({ ...pDraft, paid_amount: Number(e.target.value) })} /></Field>
          <Field label="Jatuh Tempo"><input type="date" className={inputCls} value={pDraft.due_date ?? ""} onChange={(e) => setPDraft({ ...pDraft, due_date: e.target.value })} /></Field>
          <Field label="Status"><select className={inputCls} value={pDraft.status} onChange={(e) => setPDraft({ ...pDraft, status: e.target.value })}><option value="open">Belum</option><option value="partial">Sebagian</option><option value="paid">Lunas</option><option value="overdue">Lewat</option></select></Field>
        </div>
        <button onClick={() => pUp.mutate(pDraft, { onSuccess: () => setPForm(false) })} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold">Simpan</button>
      </Modal>
    </AppLayout>
  );
}

function Card({ label, value, icon, color }: any) {
  const map: any = { green: "border-green-500", red: "border-red-500", blue: "border-blue-500", orange: "border-orange-500" };
  return (
    <div className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${map[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function RecvTable({ rows, onEdit }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-700"><tr><th className="p-3 text-left">Customer</th><th className="p-3 text-right">Jumlah</th><th className="p-3 text-right">Dibayar</th><th className="p-3">Jatuh Tempo</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada piutang</td></tr>}
          {rows.map((r: any) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="p-3 font-medium">{r.customer_name}</td>
              <td className="p-3 text-right">{formatRp(r.amount)}</td>
              <td className="p-3 text-right">{formatRp(r.paid_amount)}</td>
              <td className="p-3 text-center text-xs">{r.due_date ?? "—"}</td>
              <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded ${r.status === "paid" ? "bg-green-100 text-green-700" : r.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{r.status}</span></td>
              <td className="p-3 text-right"><button onClick={() => onEdit(r)} className={btnGhost}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayTable({ rows, onEdit }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-700"><tr><th className="p-3 text-left">Vendor</th><th className="p-3 text-right">Jumlah</th><th className="p-3 text-right">Dibayar</th><th className="p-3">Jatuh Tempo</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada hutang</td></tr>}
          {rows.map((p: any) => (
            <tr key={p.id} className="border-t border-slate-100">
              <td className="p-3 font-medium">{p.vendor_name}</td>
              <td className="p-3 text-right">{formatRp(p.amount)}</td>
              <td className="p-3 text-right">{formatRp(p.paid_amount)}</td>
              <td className="p-3 text-center text-xs">{p.due_date ?? "—"}</td>
              <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded ${p.status === "paid" ? "bg-green-100 text-green-700" : p.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span></td>
              <td className="p-3 text-right"><button onClick={() => onEdit(p)} className={btnGhost}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
