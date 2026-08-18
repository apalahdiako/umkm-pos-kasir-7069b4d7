import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Edit2, Trash2, Award, Gift } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Modal, Field, inputCls, btnPrimary, btnDanger, btnGhost, PageHeader, Tabs, formatRp } from "@/components/CrudHelpers";
import {
  listCustomers, upsertCustomer, deleteCustomer, adjustPoints,
  listVouchers, upsertVoucher, deleteVoucher,
} from "@/lib/umkm.functions";

export const Route = createFileRoute("/crm")({
  head: () => ({ meta: [{ title: "CRM & Loyalty — BY.UMKMKASIR" }] }),
  component: CrmPage,
});

function CrmPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"customers" | "vouchers">("customers");

  const lc = useServerFn(listCustomers);
  const uc = useServerFn(upsertCustomer);
  const dc = useServerFn(deleteCustomer);
  const ap = useServerFn(adjustPoints);
  const lv = useServerFn(listVouchers);
  const uv = useServerFn(upsertVoucher);
  const dv = useServerFn(deleteVoucher);

  const cQ = useQuery({ queryKey: ["crm-c"], queryFn: () => lc() });
  const vQ = useQuery({ queryKey: ["crm-v"], queryFn: () => lv() });

  const cUp = useMutation({ mutationFn: (d: any) => uc({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-c"] }) });
  const cDel = useMutation({ mutationFn: (id: string) => dc({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-c"] }) });
  const pAdj = useMutation({ mutationFn: (d: any) => ap({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-c"] }) });
  const vUp = useMutation({ mutationFn: (d: any) => uv({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-v"] }) });
  const vDel = useMutation({ mutationFn: (id: string) => dv({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-v"] }) });

  const [cForm, setCForm] = useState(false);
  const [cDraft, setCDraft] = useState<any>({ name: "", phone: "", email: "", tier: "silver" });
  const [pForm, setPForm] = useState<any>(null);
  const [pDraft, setPDraft] = useState({ tx_type: "earn", points: 0, notes: "" });
  const [vForm, setVForm] = useState(false);
  const [vDraft, setVDraft] = useState<any>({ code: "", discount_type: "percent", discount_value: 0, min_purchase: 0, quota: 0, is_active: true });

  return (
    <AppLayout>
      <PageHeader title="CRM & Loyalty" subtitle="Pelanggan, tier member, poin, dan voucher" />
      <Tabs value={tab} onChange={setTab} options={[{ value: "customers", label: "Pelanggan" }, { value: "vouchers", label: "Voucher" }]} />

      {tab === "customers" && (
        <>
          <button onClick={() => { setCDraft({ name: "", phone: "", email: "", tier: "silver" }); setCForm(true); }} className={`${btnPrimary} mb-4`}><Plus className="h-4 w-4" /> Tambah Pelanggan</button>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700"><tr><th className="p-3 text-left">Nama</th><th className="p-3 text-left">Kontak</th><th className="p-3">Tier</th><th className="p-3 text-right">Total Belanja</th><th className="p-3 text-right">Poin</th><th className="p-3"></th></tr></thead>
              <tbody>
                {(cQ.data ?? []).length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada pelanggan</td></tr>}
                {(cQ.data ?? []).map((c: any) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-xs">{c.phone}<br /><span className="text-slate-500">{c.email}</span></td>
                    <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded ${c.tier === "platinum" ? "bg-purple-100 text-purple-700" : c.tier === "gold" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-700"}`}>{c.tier}</span></td>
                    <td className="p-3 text-right">{formatRp(c.total_spent)}</td>
                    <td className="p-3 text-right font-bold text-blue-600">{c.points}</td>
                    <td className="p-3 text-right whitespace-nowrap space-x-1">
                      <button onClick={() => { setPForm(c); setPDraft({ tx_type: "earn", points: 0, notes: "" }); }} className="bg-blue-600 text-white px-2 py-1 rounded text-xs inline-flex items-center gap-1"><Award className="h-3 w-3" />Poin</button>
                      <button onClick={() => { setCDraft(c); setCForm(true); }} className={btnGhost}><Edit2 className="h-3 w-3 inline" /></button>
                      <button onClick={() => confirm("Hapus?") && cDel.mutate(c.id)} className={btnDanger}><Trash2 className="h-3 w-3 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "vouchers" && (
        <>
          <button onClick={() => { setVDraft({ code: "", discount_type: "percent", discount_value: 0, min_purchase: 0, quota: 0, is_active: true }); setVForm(true); }} className={`${btnPrimary} mb-4`}><Plus className="h-4 w-4" /> Voucher Baru</button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(vQ.data ?? []).length === 0 && <div className="col-span-full bg-white rounded-lg p-8 text-center text-slate-500 shadow-sm">Belum ada voucher</div>}
            {(vQ.data ?? []).map((v: any) => (
              <div key={v.id} className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-lg">{v.code}</div>
                  <Gift className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-1">{v.discount_type === "percent" ? `${v.discount_value}%` : formatRp(v.discount_value)}</p>
                <p className="text-xs text-slate-500 mt-1">Min belanja: {formatRp(v.min_purchase)}</p>
                <p className="text-xs text-slate-500">Pemakaian: {v.used_count}/{v.quota || "∞"}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setVDraft(v); setVForm(true); }} className={`flex-1 ${btnGhost}`}>Edit</button>
                  <button onClick={() => confirm("Hapus?") && vDel.mutate(v.id)} className={`flex-1 ${btnDanger}`}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={cForm} onClose={() => setCForm(false)} title={cDraft.id ? "Edit Pelanggan" : "Pelanggan Baru"}>
        <Field label="Nama"><input className={inputCls} value={cDraft.name} onChange={(e) => setCDraft({ ...cDraft, name: e.target.value })} /></Field>
        <Field label="No HP"><input className={inputCls} value={cDraft.phone ?? ""} onChange={(e) => setCDraft({ ...cDraft, phone: e.target.value })} /></Field>
        <Field label="Email"><input className={inputCls} value={cDraft.email ?? ""} onChange={(e) => setCDraft({ ...cDraft, email: e.target.value })} /></Field>
        <Field label="Alamat"><textarea className={inputCls} value={cDraft.address ?? ""} onChange={(e) => setCDraft({ ...cDraft, address: e.target.value })} /></Field>
        <Field label="Tier"><select className={inputCls} value={cDraft.tier} onChange={(e) => setCDraft({ ...cDraft, tier: e.target.value })}><option value="silver">Silver</option><option value="gold">Gold</option><option value="platinum">Platinum</option></select></Field>
        <button onClick={() => cUp.mutate(cDraft, { onSuccess: () => setCForm(false) })} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold">Simpan</button>
      </Modal>

      <Modal open={!!pForm} onClose={() => setPForm(null)} title={`Poin: ${pForm?.name}`}>
        <p className="text-sm text-slate-600 mb-3">Poin saat ini: <strong>{pForm?.points}</strong></p>
        <Field label="Tipe"><select className={inputCls} value={pDraft.tx_type} onChange={(e) => setPDraft({ ...pDraft, tx_type: e.target.value })}><option value="earn">Tambah (earn)</option><option value="redeem">Tukar (redeem)</option></select></Field>
        <Field label="Poin"><input type="number" className={inputCls} value={pDraft.points} onChange={(e) => setPDraft({ ...pDraft, points: Number(e.target.value) })} /></Field>
        <Field label="Catatan"><input className={inputCls} value={pDraft.notes} onChange={(e) => setPDraft({ ...pDraft, notes: e.target.value })} /></Field>
        <button onClick={() => pAdj.mutate({ customer_id: pForm.id, ...pDraft }, { onSuccess: () => setPForm(null) })} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold">Proses</button>
      </Modal>

      <Modal open={vForm} onClose={() => setVForm(false)} title={vDraft.id ? "Edit Voucher" : "Voucher Baru"}>
        <Field label="Kode"><input className={`${inputCls} font-mono uppercase`} value={vDraft.code} onChange={(e) => setVDraft({ ...vDraft, code: e.target.value.toUpperCase() })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipe"><select className={inputCls} value={vDraft.discount_type} onChange={(e) => setVDraft({ ...vDraft, discount_type: e.target.value })}><option value="percent">Persen (%)</option><option value="amount">Nominal (Rp)</option></select></Field>
          <Field label="Nilai"><input type="number" className={inputCls} value={vDraft.discount_value} onChange={(e) => setVDraft({ ...vDraft, discount_value: Number(e.target.value) })} /></Field>
          <Field label="Min Belanja"><input type="number" className={inputCls} value={vDraft.min_purchase} onChange={(e) => setVDraft({ ...vDraft, min_purchase: Number(e.target.value) })} /></Field>
          <Field label="Kuota (0=tak terbatas)"><input type="number" className={inputCls} value={vDraft.quota} onChange={(e) => setVDraft({ ...vDraft, quota: Number(e.target.value) })} /></Field>
        </div>
        <Field label="Status"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={vDraft.is_active} onChange={(e) => setVDraft({ ...vDraft, is_active: e.target.checked })} /> Aktif</label></Field>
        <button onClick={() => vUp.mutate(vDraft, { onSuccess: () => setVForm(false) })} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold">Simpan</button>
      </Modal>
    </AppLayout>
  );
}
