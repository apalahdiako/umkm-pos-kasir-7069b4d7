import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, X, ChefHat, Receipt, Trash2, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, useProducts, useStoreSettings, printNota, shortId, type Product } from "@/lib/nota-store";
import { DocumentActions } from "@/components/DocumentActions";
import type { DocData } from "@/components/DocumentImage";
import { toast } from "sonner";

export const Route = createFileRoute("/tables")({
  head: () => ({ meta: [{ title: "Meja & Open Bill (F&B) — BY.UMKMKASIR" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: TablesPage,
});

type TableRow = {
  id: string;
  name: string;
  capacity: number;
  status: "available" | "open" | "reserved";
};

type BillItem = { productId: number; name: string; price: number; qty: number; sentToKitchen?: boolean };

type OpenBill = {
  id: string;
  table_id: string | null;
  table_name: string | null;
  items: BillItem[];
  subtotal: number;
  status: "open" | "closed" | "cancelled";
  opened_at: string;
  notes: string | null;
};

function TablesPage() {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [bills, setBills] = useState<OpenBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", capacity: 4 });
  const [activeTable, setActiveTable] = useState<TableRow | null>(null);
  const [products] = useProducts();
  const [settings] = useStoreSettings();

  const load = async () => {
    setLoading(true);
    const [t, b] = await Promise.all([
      supabase.from("tables").select("*").order("name"),
      supabase.from("open_bills").select("*").eq("status", "open"),
    ]);
    if (t.data) setTables(t.data as TableRow[]);
    if (b.data) setBills(b.data as unknown as OpenBill[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addTable = async () => {
    if (!draft.name.trim()) return toast.error("Nama meja wajib");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("tables").insert({
      name: draft.name.trim(), capacity: draft.capacity, owner_id: user.id,
    });
    if (error) return toast.error(error.message);
    setDraft({ name: "", capacity: 4 });
    setShowAdd(false);
    load();
  };

  const removeTable = async (id: string) => {
    if (!confirm("Hapus meja?")) return;
    await supabase.from("tables").delete().eq("id", id);
    load();
  };

  const billOf = (tableId: string) => bills.find((b) => b.table_id === tableId);

  const openBill = async (table: TableRow) => {
    let bill = billOf(table.id);
    if (!bill) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("open_bills").insert({
        owner_id: user.id, table_id: table.id, table_name: table.name, items: [], subtotal: 0,
      }).select().single();
      if (error) return toast.error(error.message);
      await supabase.from("tables").update({ status: "open" }).eq("id", table.id);
      bill = data as unknown as OpenBill;
      await load();
    }
    setActiveTable(table);
  };

  const activeBill = activeTable ? bills.find((b) => b.table_id === activeTable.id) : null;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Meja & Open Bill (F&B)</h2>
          <p className="text-sm text-slate-600">Kelola meja, kirim pesanan ke dapur (KOT), tutup bill saat customer bayar.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> Tambah Meja
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Memuat...</p>
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-dashed">
          <p className="text-slate-500">Belum ada meja. Tambah meja pertamamu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tables.map((t) => {
            const bill = billOf(t.id);
            const isOpen = !!bill;
            return (
              <button
                key={t.id}
                onClick={() => openBill(t)}
                className={`rounded-xl p-4 text-left border-2 transition ${
                  isOpen ? "bg-orange-50 border-orange-400" : "bg-white border-slate-200 hover:border-blue-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{t.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isOpen ? "bg-orange-200 text-orange-800" : "bg-green-100 text-green-700"}`}>
                    {isOpen ? "OPEN" : "AVAILABLE"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{t.capacity} kursi</p>
                {bill && (
                  <p className="text-sm font-semibold text-orange-700 mt-2">
                    {bill.items.length} item · {formatCurrency(bill.subtotal)}
                  </p>
                )}
                <button onClick={(e) => { e.stopPropagation(); removeTable(t.id); }} className="text-[10px] text-red-500 mt-2 hover:underline">
                  hapus
                </button>
              </button>
            );
          })}
        </div>
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title="Tambah Meja">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-600">Nama Meja</label>
              <input className="w-full border rounded px-3 py-2" value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Meja 1" />
            </div>
            <div>
              <label className="text-xs text-slate-600">Kapasitas</label>
              <input type="number" min={1} className="w-full border rounded px-3 py-2" value={draft.capacity}
                onChange={(e) => setDraft({ ...draft, capacity: +e.target.value || 1 })} />
            </div>
            <button onClick={addTable} className="w-full bg-blue-600 text-white py-2 rounded font-medium">Simpan</button>
          </div>
        </Modal>
      )}

      {activeTable && activeBill && (
        <BillPanel
          table={activeTable}
          bill={activeBill}
          products={products}
          onClose={() => setActiveTable(null)}
          onChanged={load}
          settings={settings}
        />
      )}
    </AppLayout>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-5 max-w-md w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BillPanel({
  table, bill, products, onClose, onChanged, settings,
}: {
  table: TableRow; bill: OpenBill; products: Product[]; onClose: () => void; onChanged: () => void; settings: ReturnType<typeof useStoreSettings>[0];
}) {
  const [items, setItems] = useState<BillItem[]>(bill.items || []);
  const [search, setSearch] = useState("");

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 12);

  const addItem = (p: Product) => {
    const existing = items.find((i) => i.productId === p.id && !i.sentToKitchen);
    if (existing) {
      setItems(items.map((i) => i === existing ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItems([...items, { productId: p.id, name: p.name, price: p.price, qty: 1 }]);
    }
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) setItems(items.filter((_, i) => i !== idx));
    else setItems(items.map((it, i) => i === idx ? { ...it, qty } : it));
  };

  const persist = async (next: BillItem[]) => {
    const sub = next.reduce((s, i) => s + i.price * i.qty, 0);
    await supabase.from("open_bills").update({
      items: next as unknown as never, subtotal: sub,
    }).eq("id", bill.id);
  };

  const sendToKitchen = async () => {
    const next = items.map((i) => ({ ...i, sentToKitchen: true }));
    setItems(next);
    await persist(next);
    // Print KOT (no price)
    const newOnly = items.filter((i) => !i.sentToKitchen);
    if (newOnly.length === 0) return toast.info("Tidak ada item baru");
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>KOT ${table.name}</title>
      <style>body{font-family:monospace;width:58mm;padding:8px;font-size:13px}
      h1{font-size:16px;text-align:center;margin:4px 0}.row{display:flex;justify-content:space-between;padding:2px 0}
      hr{border:none;border-top:1px dashed #000}</style></head><body>
      <h1>KITCHEN ORDER</h1>
      <div style="text-align:center;font-size:11px">${new Date().toLocaleString("id-ID")}</div>
      <hr/>
      <div><b>${table.name}</b></div>
      <hr/>
      ${newOnly.map(i => `<div class="row"><span>${i.name}</span><span>x${i.qty}</span></div>`).join("")}
      <hr/>
      <div style="text-align:center;font-size:11px">** ${newOnly.reduce((s,i)=>s+i.qty,0)} item **</div>
      <script>setTimeout(()=>window.print(),200)</script></body></html>`);
    w.document.close();
    toast.success("KOT terkirim ke dapur");
    onChanged();
  };

  const [shareDoc, setShareDoc] = useState<DocData | null>(null);

  const closeBill = async () => {
    if (items.length === 0) return toast.error("Bill kosong");
    if (!confirm(`Tutup bill ${table.name} — total ${formatCurrency(subtotal)}?`)) return;
    await supabase.from("open_bills").update({
      items: items as unknown as never, subtotal, status: "closed", closed_at: new Date().toISOString(),
    }).eq("id", bill.id);
    await supabase.from("tables").update({ status: "available" }).eq("id", table.id);

    const docNo = shortId("INV");
    const now = new Date().toISOString();

    // Print final receipt
    printNota({
      id: docNo,
      date: now,
      customer: table.name,
      items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
      subtotal, discount: 0, tax: 0, total: subtotal,
      paymentMethod: "Tunai", amountPaid: subtotal, change: 0, status: "completed", tableNo: table.name,
    }, settings);

    // Offer share-as-image
    setShareDoc({
      type: "Closed Bill",
      docNo,
      date: now,
      tableNo: table.name,
      items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      subtotal,
      total: subtotal,
      paymentMethod: "Tunai",
      amountPaid: subtotal,
      status: "LUNAS",
    });

    toast.success("Bill ditutup, struk dicetak");
    onChanged();
  };

  const cancelBill = async () => {
    if (!confirm("Batalkan bill? Meja akan kosong kembali.")) return;
    await supabase.from("open_bills").update({ status: "cancelled" }).eq("id", bill.id);
    await supabase.from("tables").update({ status: "available" }).eq("id", table.id);
    onClose();
    onChanged();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-bold text-lg">{table.name}</h3>
            <p className="text-xs text-slate-500">Open Bill · dibuka {new Date(bill.opened_at).toLocaleTimeString("id-ID")}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">PILIH MENU</p>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari menu..." className="w-full border rounded px-3 py-2 text-sm mb-2" />
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {filtered.map((p) => (
                <button key={p.id} onClick={() => addItem(p)} className="border rounded-lg p-2 text-left hover:bg-blue-50">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-blue-600">{formatCurrency(p.price)}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">PESANAN ({items.length})</p>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {items.length === 0 && <p className="text-xs text-slate-400">Belum ada item</p>}
              {items.map((i, idx) => (
                <div key={idx} className={`flex items-center justify-between gap-2 p-2 rounded text-sm ${i.sentToKitchen ? "bg-green-50" : "bg-slate-50"}`}>
                  <div className="flex-1">
                    <p className="font-medium truncate">{i.name} {i.sentToKitchen && <CheckCircle2 className="inline h-3 w-3 text-green-600" />}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(i.price)} × {i.qty}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(idx, i.qty - 1)} className="w-6 h-6 border rounded">−</button>
                    <span className="w-6 text-center">{i.qty}</span>
                    <button onClick={() => updateQty(idx, i.qty + 1)} className="w-6 h-6 border rounded">+</button>
                    <button onClick={() => updateQty(idx, 0)} className="text-red-500 ml-1"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t p-4 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-600">Subtotal</span>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => persist(items).then(() => toast.success("Tersimpan"))} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded text-sm font-medium">
              Simpan
            </button>
            <button onClick={sendToKitchen} className="flex-1 bg-orange-500 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-1">
              <ChefHat className="h-4 w-4" /> Kirim ke Dapur
            </button>
            <button
              onClick={() => items.length > 0 && setShareDoc({
                type: "Closed Bill",
                docNo: shortId("PREV"),
                date: new Date().toISOString(),
                tableNo: table.name,
                items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
                subtotal,
                total: subtotal,
              })}
              className="px-3 bg-purple-100 text-purple-700 py-2 rounded text-sm flex items-center justify-center gap-1"
              title="Kirim preview bill sebagai gambar"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button onClick={closeBill} className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-1">
              <Receipt className="h-4 w-4" /> Close Bill
            </button>
            <button onClick={cancelBill} className="px-3 bg-red-100 text-red-700 py-2 rounded text-sm">Batal</button>
          </div>
        </div>
      </div>

      {shareDoc && (
        <DocumentActions
          open
          layout="thermal"
          data={shareDoc}
          onClose={() => {
            setShareDoc(null);
            // if this was the closed bill (status set), also close the panel
            if (shareDoc.status === "LUNAS") onClose();
          }}
        />
      )}
    </div>
  );
}
