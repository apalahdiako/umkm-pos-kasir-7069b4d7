import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Edit2, Trash2, Clock, Calendar } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Modal, Field, inputCls, btnPrimary, btnDanger, btnGhost, PageHeader, Tabs, formatRp } from "@/components/CrudHelpers";
import {
  listEmployees, upsertEmployee, deleteEmployee,
  listShifts, openShift, closeShift,
  listAttendance, recordAttendance,
} from "@/lib/umkm.functions";

export const Route = createFileRoute("/employees")({
  head: () => ({ meta: [{ title: "Karyawan & Shift — Nota Pro" }] }),
  component: EmpPage,
});

function EmpPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"emp" | "shifts" | "att">("emp");

  const le = useServerFn(listEmployees);
  const ue = useServerFn(upsertEmployee);
  const de = useServerFn(deleteEmployee);
  const ls = useServerFn(listShifts);
  const os = useServerFn(openShift);
  const cs = useServerFn(closeShift);
  const la = useServerFn(listAttendance);
  const ra = useServerFn(recordAttendance);

  const eQ = useQuery({ queryKey: ["emp"], queryFn: () => le() });
  const sQ = useQuery({ queryKey: ["shifts"], queryFn: () => ls() });
  const aQ = useQuery({ queryKey: ["att"], queryFn: () => la() });

  const eUp = useMutation({ mutationFn: (d: any) => ue({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["emp"] }) });
  const eDel = useMutation({ mutationFn: (id: string) => de({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["emp"] }) });
  const sOpen = useMutation({ mutationFn: (d: any) => os({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }) });
  const sClose = useMutation({ mutationFn: (d: any) => cs({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }) });
  const aRec = useMutation({ mutationFn: (d: any) => ra({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["att"] }) });

  const [eForm, setEForm] = useState(false);
  const [eDraft, setEDraft] = useState<any>({ name: "", role: "kasir", phone: "", base_salary: 0, commission_percent: 0, is_active: true });
  const [sForm, setSForm] = useState(false);
  const [sDraft, setSDraft] = useState<any>({ employee_id: "", opening_cash: 0, notes: "" });
  const [closeForm, setCloseForm] = useState<any>(null);
  const [closeDraft, setCloseDraft] = useState({ closing_cash: 0, total_sales: 0, total_transactions: 0 });
  const [attForm, setAttForm] = useState(false);
  const [attDraft, setAttDraft] = useState({ employee_id: "", status: "hadir", notes: "" });

  const empMap = new Map<string, any>((eQ.data ?? []).map((e: any) => [e.id, e]));

  return (
    <AppLayout>
      <PageHeader title="Karyawan & Shift" subtitle="Karyawan, shift kasir, absensi, komisi" />
      <Tabs value={tab} onChange={setTab} options={[{ value: "emp", label: "Karyawan" }, { value: "shifts", label: "Shift Kasir" }, { value: "att", label: "Absensi" }]} />

      {tab === "emp" && (
        <>
          <button onClick={() => { setEDraft({ name: "", role: "kasir", phone: "", base_salary: 0, commission_percent: 0, is_active: true }); setEForm(true); }} className={`${btnPrimary} mb-4`}><Plus className="h-4 w-4" /> Tambah Karyawan</button>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700"><tr><th className="p-3 text-left">Nama</th><th className="p-3">Role</th><th className="p-3 text-right">Gaji Pokok</th><th className="p-3 text-right">Komisi %</th><th className="p-3"></th></tr></thead>
              <tbody>
                {(eQ.data ?? []).length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada karyawan</td></tr>}
                {(eQ.data ?? []).map((e: any) => (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{e.name} {!e.is_active && <span className="text-xs text-red-500">(nonaktif)</span>}<div className="text-xs text-slate-500">{e.phone}</div></td>
                    <td className="p-3 text-center"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{e.role}</span></td>
                    <td className="p-3 text-right">{formatRp(e.base_salary)}</td>
                    <td className="p-3 text-right">{e.commission_percent}%</td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button onClick={() => { setEDraft(e); setEForm(true); }} className={btnGhost}><Edit2 className="h-3 w-3 inline" /></button>
                      <button onClick={() => confirm("Hapus?") && eDel.mutate(e.id)} className={btnDanger}><Trash2 className="h-3 w-3 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "shifts" && (
        <>
          <button onClick={() => { setSDraft({ employee_id: "", opening_cash: 0, notes: "" }); setSForm(true); }} className={`${btnPrimary} mb-4`}><Plus className="h-4 w-4" /> Buka Shift</button>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700"><tr><th className="p-3 text-left">Mulai</th><th className="p-3">Karyawan</th><th className="p-3 text-right">Kas Awal</th><th className="p-3 text-right">Kas Akhir</th><th className="p-3 text-right">Penjualan</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
              <tbody>
                {(sQ.data ?? []).length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Belum ada shift</td></tr>}
                {(sQ.data ?? []).map((s: any) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="p-3 text-xs"><Clock className="h-3 w-3 inline" /> {new Date(s.start_at).toLocaleString("id-ID")}{s.end_at && <div className="text-slate-500">s/d {new Date(s.end_at).toLocaleString("id-ID")}</div>}</td>
                    <td className="p-3">{empMap.get(s.employee_id)?.name ?? "—"}</td>
                    <td className="p-3 text-right">{formatRp(s.opening_cash)}</td>
                    <td className="p-3 text-right">{s.closing_cash ? formatRp(s.closing_cash) : "—"}</td>
                    <td className="p-3 text-right font-semibold">{formatRp(s.total_sales)}</td>
                    <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded ${s.status === "open" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>{s.status}</span></td>
                    <td className="p-3 text-right">{s.status === "open" && <button onClick={() => { setCloseForm(s); setCloseDraft({ closing_cash: 0, total_sales: 0, total_transactions: 0 }); }} className="bg-orange-600 text-white px-3 py-1 rounded text-xs">Tutup</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "att" && (
        <>
          <button onClick={() => { setAttDraft({ employee_id: "", status: "hadir", notes: "" }); setAttForm(true); }} className={`${btnPrimary} mb-4`}><Plus className="h-4 w-4" /> Catat Absensi</button>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700"><tr><th className="p-3 text-left"><Calendar className="h-3 w-3 inline" /> Tanggal</th><th className="p-3">Karyawan</th><th className="p-3">Status</th><th className="p-3 text-left">Jam Masuk</th><th className="p-3 text-left">Catatan</th></tr></thead>
              <tbody>
                {(aQ.data ?? []).length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada absensi</td></tr>}
                {(aQ.data ?? []).map((a: any) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="p-3">{a.date}</td>
                    <td className="p-3">{empMap.get(a.employee_id)?.name ?? "—"}</td>
                    <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded ${a.status === "hadir" ? "bg-green-100 text-green-700" : a.status === "alpha" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{a.status}</span></td>
                    <td className="p-3 text-xs">{a.clock_in ? new Date(a.clock_in).toLocaleTimeString("id-ID") : "—"}</td>
                    <td className="p-3 text-slate-600">{a.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={eForm} onClose={() => setEForm(false)} title={eDraft.id ? "Edit Karyawan" : "Karyawan Baru"}>
        <Field label="Nama"><input className={inputCls} value={eDraft.name} onChange={(e) => setEDraft({ ...eDraft, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role"><select className={inputCls} value={eDraft.role} onChange={(e) => setEDraft({ ...eDraft, role: e.target.value })}><option value="owner">Owner</option><option value="manager">Manager</option><option value="kasir">Kasir</option><option value="staff">Staff</option></select></Field>
          <Field label="No HP"><input className={inputCls} value={eDraft.phone ?? ""} onChange={(e) => setEDraft({ ...eDraft, phone: e.target.value })} /></Field>
          <Field label="Gaji Pokok"><input type="number" className={inputCls} value={eDraft.base_salary} onChange={(e) => setEDraft({ ...eDraft, base_salary: Number(e.target.value) })} /></Field>
          <Field label="Komisi (%)"><input type="number" step="0.1" className={inputCls} value={eDraft.commission_percent} onChange={(e) => setEDraft({ ...eDraft, commission_percent: Number(e.target.value) })} /></Field>
        </div>
        <Field label="Status"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eDraft.is_active} onChange={(e) => setEDraft({ ...eDraft, is_active: e.target.checked })} /> Aktif</label></Field>
        <button onClick={() => eUp.mutate(eDraft, { onSuccess: () => setEForm(false) })} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold">Simpan</button>
      </Modal>

      <Modal open={sForm} onClose={() => setSForm(false)} title="Buka Shift Kasir">
        <Field label="Karyawan"><select className={inputCls} value={sDraft.employee_id} onChange={(e) => setSDraft({ ...sDraft, employee_id: e.target.value })}><option value="">— pilih —</option>{(eQ.data ?? []).map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
        <Field label="Kas Awal"><input type="number" className={inputCls} value={sDraft.opening_cash} onChange={(e) => setSDraft({ ...sDraft, opening_cash: Number(e.target.value) })} /></Field>
        <Field label="Catatan"><input className={inputCls} value={sDraft.notes} onChange={(e) => setSDraft({ ...sDraft, notes: e.target.value })} /></Field>
        <button onClick={() => sOpen.mutate(sDraft, { onSuccess: () => setSForm(false) })} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold">Buka Shift</button>
      </Modal>

      <Modal open={!!closeForm} onClose={() => setCloseForm(null)} title="Tutup Shift">
        <Field label="Kas Akhir"><input type="number" className={inputCls} value={closeDraft.closing_cash} onChange={(e) => setCloseDraft({ ...closeDraft, closing_cash: Number(e.target.value) })} /></Field>
        <Field label="Total Penjualan"><input type="number" className={inputCls} value={closeDraft.total_sales} onChange={(e) => setCloseDraft({ ...closeDraft, total_sales: Number(e.target.value) })} /></Field>
        <Field label="Jumlah Transaksi"><input type="number" className={inputCls} value={closeDraft.total_transactions} onChange={(e) => setCloseDraft({ ...closeDraft, total_transactions: Number(e.target.value) })} /></Field>
        <button onClick={() => sClose.mutate({ id: closeForm.id, ...closeDraft }, { onSuccess: () => setCloseForm(null) })} className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-semibold">Tutup Shift</button>
      </Modal>

      <Modal open={attForm} onClose={() => setAttForm(false)} title="Catat Absensi">
        <Field label="Karyawan"><select className={inputCls} value={attDraft.employee_id} onChange={(e) => setAttDraft({ ...attDraft, employee_id: e.target.value })}><option value="">— pilih —</option>{(eQ.data ?? []).map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
        <Field label="Status"><select className={inputCls} value={attDraft.status} onChange={(e) => setAttDraft({ ...attDraft, status: e.target.value })}><option value="hadir">Hadir</option><option value="izin">Izin</option><option value="sakit">Sakit</option><option value="cuti">Cuti</option><option value="alpha">Alpha</option></select></Field>
        <Field label="Catatan"><input className={inputCls} value={attDraft.notes} onChange={(e) => setAttDraft({ ...attDraft, notes: e.target.value })} /></Field>
        <button onClick={() => attDraft.employee_id && aRec.mutate(attDraft, { onSuccess: () => setAttForm(false) })} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold">Simpan</button>
      </Modal>
    </AppLayout>
  );
}
