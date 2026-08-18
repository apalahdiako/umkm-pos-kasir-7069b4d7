import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Edit2, Trash2, ArrowDownUp, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Modal, Field, inputCls, btnPrimary, btnDanger, btnGhost, PageHeader, Tabs, formatRp } from "@/components/CrudHelpers";
import { listInventory, upsertInventory, deleteInventory, listMovements, recordMovement } from "@/lib/umkm.functions";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory & Stok — BY.UMKMKASIR" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"items" | "movements">("items");
  const list = useServerFn(listInventory);
  const upsert = useServerFn(upsertInventory);
  const del = useServerFn(deleteInventory);
  const moveList = useServerFn(listMovements);
  const move = useServerFn(recordMovement);

  const itemsQ = useQuery({ queryKey: ["inv-items"], queryFn: () => list() });
  const movesQ = useQuery({ queryKey: ["inv-moves"], queryFn: () => moveList() });

  const upsertM = useMutation({ mutationFn: (d: any) => upsert({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["inv-items"] }) });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["inv-items"] }) });
  const moveM = useMutation({
    mutationFn: (d: any) => move({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv-items"] }); qc.invalidateQueries({ queryKey: ["inv-moves"] }); },
  });

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<any>({ name: "", sku: "", category: "", unit: "pcs", cost_price: 0, sell_price: 0, current_stock: 0, min_stock: 0 });
  const [showMove, setShowMove] = useState<any>(null);
  const [moveDraft, setMoveDraft] = useState({ movement_type: "in", qty: 0, notes: "" });

  const openCreate = () => { setDraft({ name: "", sku: "", category: "", unit: "pcs", cost_price: 0, sell_price: 0, current_stock: 0, min_stock: 0 }); setShowForm(true); };
  const openEdit = (it: any) => { setDraft(it); setShowForm(true); };
  const save = () => { if (!draft.name) return alert("Nama wajib"); upsertM.mutate(draft, { onSuccess: () => setShowForm(false) }); };
  const remove = (id: string) => { if (confirm("Hapus item?")) delM.mutate(id); };
  const doMove = () => { moveM.mutate({ item_id: showMove.id, ...moveDraft, qty: Number(moveDraft.qty) }, { onSuccess: () => { setShowMove(null); setMoveDraft({ movement_type: "in", qty: 0, notes: "" }); } }); };

  const items = itemsQ.data ?? [];
  const lowStock = items.filter((i: any) => Number(i.current_stock) <= Number(i.min_stock) && Number(i.min_stock) > 0);

  return (
    <AppLayout>
      <PageHeader title="Inventory & Stok" subtitle="Kelola stok, multi-gudang, stock opname"
        action={<button onClick={openCreate} className={btnPrimary}><Plus className="h-4 w-4" /> Tambah Item</button>} />

      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
          <div className="text-sm text-orange-800">
            <strong>{lowStock.length} item</strong> stoknya menipis: {lowStock.slice(0, 3).map((i: any) => i.name).join(", ")}{lowStock.length > 3 ? "..." : ""}
          </div>
        </div>
      )}

      <Tabs value={tab} onChange={setTab} options={[{ value: "items", label: "Daftar Item" }, { value: "movements", label: "Mutasi Stok" }]} />

      {tab === "items" && (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase">
              <tr><th className="p-3 text-left">Nama / SKU</th><th className="p-3 text-right">Stok</th><th className="p-3 text-right">Min</th><th className="p-3 text-right">Harga Jual</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada item</td></tr>}
              {items.map((it: any) => (
                <tr key={it.id} className="border-t border-slate-100">
                  <td className="p-3"><div className="font-medium">{it.name}</div><div className="text-xs text-slate-500">{it.sku} · {it.category} · {it.unit}</div></td>
                  <td className={`p-3 text-right font-semibold ${Number(it.current_stock) <= Number(it.min_stock) && Number(it.min_stock) > 0 ? "text-orange-600" : ""}`}>{it.current_stock}</td>
                  <td className="p-3 text-right text-slate-500">{it.min_stock}</td>
                  <td className="p-3 text-right">{formatRp(it.sell_price)}</td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    <button onClick={() => { setShowMove(it); }} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs inline-flex items-center gap-1"><ArrowDownUp className="h-3 w-3" />Mutasi</button>
                    <button onClick={() => openEdit(it)} className={btnGhost}><Edit2 className="h-3 w-3 inline" /></button>
                    <button onClick={() => remove(it.id)} className={btnDanger}><Trash2 className="h-3 w-3 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "movements" && (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase">
              <tr><th className="p-3 text-left">Waktu</th><th className="p-3 text-left">Tipe</th><th className="p-3 text-right">Qty</th><th className="p-3 text-left">Catatan</th></tr>
            </thead>
            <tbody>
              {(movesQ.data ?? []).length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Belum ada mutasi</td></tr>}
              {(movesQ.data ?? []).map((m: any) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="p-3 text-xs">{new Date(m.created_at).toLocaleString("id-ID")}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${m.movement_type === "in" ? "bg-green-100 text-green-700" : m.movement_type === "out" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{m.movement_type}</span></td>
                  <td className="p-3 text-right font-semibold">{m.qty}</td>
                  <td className="p-3 text-slate-600">{m.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={draft.id ? "Edit Item" : "Item Baru"}>
        <Field label="Nama"><input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU"><input className={inputCls} value={draft.sku ?? ""} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} /></Field>
          <Field label="Kategori"><input className={inputCls} value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></Field>
          <Field label="Satuan"><input className={inputCls} value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} /></Field>
          <Field label="Stok Awal"><input type="number" className={inputCls} value={draft.current_stock} onChange={(e) => setDraft({ ...draft, current_stock: Number(e.target.value) })} /></Field>
          <Field label="Stok Minimum"><input type="number" className={inputCls} value={draft.min_stock} onChange={(e) => setDraft({ ...draft, min_stock: Number(e.target.value) })} /></Field>
          <Field label="Harga Modal"><input type="number" className={inputCls} value={draft.cost_price} onChange={(e) => setDraft({ ...draft, cost_price: Number(e.target.value) })} /></Field>
          <Field label="Harga Jual"><input type="number" className={inputCls} value={draft.sell_price} onChange={(e) => setDraft({ ...draft, sell_price: Number(e.target.value) })} /></Field>
        </div>
        <button onClick={save} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold mt-2">Simpan</button>
      </Modal>

      <Modal open={!!showMove} onClose={() => setShowMove(null)} title={`Mutasi: ${showMove?.name}`}>
        <Field label="Tipe">
          <select className={inputCls} value={moveDraft.movement_type} onChange={(e) => setMoveDraft({ ...moveDraft, movement_type: e.target.value })}>
            <option value="in">Stok Masuk</option>
            <option value="out">Stok Keluar</option>
            <option value="opname">Opname (set stok)</option>
          </select>
        </Field>
        <Field label="Qty"><input type="number" className={inputCls} value={moveDraft.qty} onChange={(e) => setMoveDraft({ ...moveDraft, qty: Number(e.target.value) })} /></Field>
        <Field label="Catatan"><input className={inputCls} value={moveDraft.notes} onChange={(e) => setMoveDraft({ ...moveDraft, notes: e.target.value })} /></Field>
        <button onClick={doMove} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold">Catat Mutasi</button>
      </Modal>
    </AppLayout>
  );
}
