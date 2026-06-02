import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Calculator, Package, BarChart3, Layers, ChefHat, Tag, FileDown,
  Save, RotateCcw, Trash2, Edit, Copy, Plus, Search, AlertTriangle, TrendingUp, X, Download, Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  ScatterChart, Scatter, CartesianGrid,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { HppImageUploader } from "@/components/HppImageUploader";
import {
  type HppProduct, type ProductChannel, type Recipe, type ExtraCost, type RecipeIngredient,
  CATEGORIES, CHANNELS, calcHpp, suggestedPrice, marginInfo, fmtRp,
  listHppProducts, upsertHppProduct, deleteHppProduct,
  listChannels, upsertChannel, deleteChannel,
  listRecipes, upsertRecipe, deleteRecipe,
} from "@/lib/hpp-store";

export const Route = createFileRoute("/hpp")({ component: HppPage });

type Tab = "calc" | "list" | "analytics" | "channels" | "recipes" | "promo" | "io";

const emptyForm: Partial<HppProduct> = {
  sku: "", name: "", category: "Makanan", description: "",
  images: [], harga_beli: 0, ongkir: 0, kemasan: 0, pajak: 0, handling: 0, shrinkage: 0, packaging_final: 0,
  biaya_lain: [], harga_jual: 0, margin_target: 30, stock: 0, min_stock: 0, notes: "", is_active: true,
};

function HppPage() {
  const [tab, setTab] = useState<Tab>("calc");
  const [products, setProducts] = useState<HppProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<HppProduct>>(emptyForm);

  const reload = async () => {
    try { setProducts(await listHppProducts()); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Gagal load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const editProduct = (p: HppProduct) => {
    setForm({ ...p, biaya_lain: p.biaya_lain || [], images: p.images || [] });
    setTab("calc");
  };

  const dupProduct = (p: HppProduct) => {
    setForm({ ...p, id: undefined, sku: p.sku + "-COPY", name: p.name + " (Copy)" });
    setTab("calc");
    toast.success("Form duplikat siap — ubah SKU lalu simpan");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Calculator className="h-6 w-6 text-blue-600" /> HPP Calculator Pro</h1>
          <p className="text-sm text-slate-600">Hitung harga pokok, kelola gambar, channel, resep & simulasi promo — semua tersimpan di cloud.</p>
        </header>

        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <div className="flex gap-1 p-1 min-w-max">
            <TabBtn id="calc" cur={tab} onClick={setTab} icon={<Calculator className="h-4 w-4" />}>Kalkulator</TabBtn>
            <TabBtn id="list" cur={tab} onClick={setTab} icon={<Package className="h-4 w-4" />}>Daftar ({products.length})</TabBtn>
            <TabBtn id="analytics" cur={tab} onClick={setTab} icon={<BarChart3 className="h-4 w-4" />}>Analitik</TabBtn>
            <TabBtn id="channels" cur={tab} onClick={setTab} icon={<Layers className="h-4 w-4" />}>Channel</TabBtn>
            <TabBtn id="recipes" cur={tab} onClick={setTab} icon={<ChefHat className="h-4 w-4" />}>Resep</TabBtn>
            <TabBtn id="promo" cur={tab} onClick={setTab} icon={<Tag className="h-4 w-4" />}>Promo</TabBtn>
            <TabBtn id="io" cur={tab} onClick={setTab} icon={<FileDown className="h-4 w-4" />}>Import/Export</TabBtn>
          </div>
        </div>

        {loading && <div className="text-center py-10 text-slate-500">Memuat…</div>}

        {!loading && tab === "calc" && <CalcTab form={form} setForm={setForm} onSaved={reload} />}
        {!loading && tab === "list" && <ListTab products={products} onEdit={editProduct} onDup={dupProduct} onReload={reload} />}
        {!loading && tab === "analytics" && <AnalyticsTab products={products} />}
        {!loading && tab === "channels" && <ChannelsTab products={products} />}
        {!loading && tab === "recipes" && <RecipesTab products={products} />}
        {!loading && tab === "promo" && <PromoTab products={products} />}
        {!loading && tab === "io" && <IoTab products={products} onReload={reload} />}
      </div>
    </AppLayout>
  );
}

function TabBtn({ id, cur, onClick, children, icon }: { id: Tab; cur: Tab; onClick: (t: Tab) => void; children: React.ReactNode; icon: React.ReactNode }) {
  const active = id === cur;
  return (
    <button onClick={() => onClick(id)} className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg whitespace-nowrap ${active ? "bg-blue-600 text-white font-semibold" : "text-slate-600 hover:bg-slate-100"}`}>
      {icon}{children}
    </button>
  );
}

/* =========================== CALCULATOR TAB =========================== */

function CalcTab({ form, setForm, onSaved }: { form: Partial<HppProduct>; setForm: (f: Partial<HppProduct>) => void; onSaved: () => Promise<void> }) {
  const total = calcHpp(form);
  const suggested = suggestedPrice(total, Number(form.margin_target) || 0);
  const harga = Number(form.harga_jual) || 0;
  const m = marginInfo(total, harga);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof HppProduct>(k: K, v: HppProduct[K]) => setForm({ ...form, [k]: v });

  const addExtra = () => set("biaya_lain", [...(form.biaya_lain || []), { name: "", amount: 0 }] as ExtraCost[]);
  const updExtra = (i: number, patch: Partial<ExtraCost>) => {
    const next = [...(form.biaya_lain || [])];
    next[i] = { ...next[i], ...patch };
    set("biaya_lain", next as ExtraCost[]);
  };
  const delExtra = (i: number) => set("biaya_lain", (form.biaya_lain || []).filter((_, j) => j !== i) as ExtraCost[]);

  const save = async () => {
    if (!form.sku?.trim() || !form.name?.trim()) return toast.error("SKU & Nama wajib diisi");
    if (harga > 0 && harga < total && !window.confirm("Harga jual < HPP. Anda akan rugi. Tetap simpan?")) return;
    setSaving(true);
    try {
      await upsertHppProduct(form);
      toast.success(form.id ? "Produk diupdate" : "Produk disimpan");
      await onSaved();
      setForm(emptyForm);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal";
      toast.error(msg.includes("duplicate") || msg.includes("unique") ? "SKU sudah digunakan" : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Identitas */}
        <Card title="Identitas Produk">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Nama Produk *"><input className={inp} value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="SKU / Kode *"><input className={inp} value={form.sku || ""} onChange={(e) => set("sku", e.target.value)} /></Field>
            <Field label="Kategori">
              <select className={inp} value={form.category || ""} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Stok Awal"><NumIn value={form.stock || 0} onChange={(v) => set("stock", v)} /></Field>
            <div className="md:col-span-2">
              <Field label="Deskripsi"><textarea className={inp} rows={2} value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
            </div>
          </div>
        </Card>

        {/* Images */}
        <Card title="Gambar Produk">
          <HppImageUploader images={form.images || []} onChange={(imgs) => set("images", imgs)} />
        </Card>

        {/* Breakdown Cost */}
        <Card title="Komponen HPP">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Harga Beli Pokok *"><NumIn value={form.harga_beli || 0} onChange={(v) => set("harga_beli", v)} /></Field>
            <Field label="Ongkir / Pengiriman"><NumIn value={form.ongkir || 0} onChange={(v) => set("ongkir", v)} /></Field>
            <Field label="Kemasan"><NumIn value={form.kemasan || 0} onChange={(v) => set("kemasan", v)} /></Field>
            <Field label="Pajak / Bea"><NumIn value={form.pajak || 0} onChange={(v) => set("pajak", v)} /></Field>
            <Field label="Handling / Admin"><NumIn value={form.handling || 0} onChange={(v) => set("handling", v)} /></Field>
            <Field label="Shrinkage / Rusak"><NumIn value={form.shrinkage || 0} onChange={(v) => set("shrinkage", v)} /></Field>
            <Field label="Packaging Final"><NumIn value={form.packaging_final || 0} onChange={(v) => set("packaging_final", v)} /></Field>
          </div>

          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Biaya Tambahan</h4>
              <button onClick={addExtra} className="text-xs text-blue-600 flex items-center gap-1"><Plus className="h-3 w-3" /> Tambah</button>
            </div>
            {(form.biaya_lain || []).map((b, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_auto] gap-2 mb-2">
                <input className={inp} placeholder="Nama biaya" value={b.name} onChange={(e) => updExtra(i, { name: e.target.value })} />
                <NumIn value={b.amount} onChange={(v) => updExtra(i, { amount: v })} />
                <button onClick={() => delExtra(i)} className="text-red-600 px-2"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Summary Sidebar */}
      <div className="space-y-4">
        <Card title="Ringkasan Real-Time" highlight>
          <div className="space-y-1.5 text-sm">
            <Row label="Harga Beli" value={fmtRp(form.harga_beli || 0)} />
            <Row label="Ongkir" value={fmtRp(form.ongkir || 0)} />
            <Row label="Kemasan" value={fmtRp(form.kemasan || 0)} />
            <Row label="Pajak" value={fmtRp(form.pajak || 0)} />
            <Row label="Handling" value={fmtRp(form.handling || 0)} />
            <Row label="Shrinkage" value={fmtRp(form.shrinkage || 0)} />
            <Row label="Packaging Final" value={fmtRp(form.packaging_final || 0)} />
            {(form.biaya_lain || []).map((b, i) => <Row key={i} label={b.name || "Lainnya"} value={fmtRp(b.amount)} />)}
            <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between font-bold text-blue-700 text-base">
              <span>TOTAL HPP</span><span>{fmtRp(total)}</span>
            </div>
          </div>
        </Card>

        <Card title="Margin & Harga Jual">
          <Field label={`Target Margin (${form.margin_target}%)`}>
            <input type="range" min={5} max={100} value={form.margin_target || 30} onChange={(e) => set("margin_target", Number(e.target.value))} className="w-full" />
          </Field>
          <div className="bg-blue-50 rounded p-2 text-xs mb-3">
            <span className="text-slate-600">Rekomendasi: </span>
            <button className="font-bold text-blue-700 hover:underline" onClick={() => set("harga_jual", suggested)}>{fmtRp(suggested)}</button>
            <span className="text-slate-500 ml-1">(klik untuk pakai)</span>
          </div>
          <Field label="Harga Jual Aktual"><NumIn value={form.harga_jual || 0} onChange={(v) => set("harga_jual", v)} /></Field>

          <div className={`mt-3 rounded-lg p-3 ${m.bg}`}>
            <div className={`flex items-center gap-1 font-semibold text-sm ${m.color}`}>
              {m.level === "loss" || m.level === "low" ? <AlertTriangle className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {m.label}
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>Profit: <b>{fmtRp(m.rp)}</b></span>
              <span>Margin: <b>{m.pct.toFixed(1)}%</b></span>
            </div>
            <div className="w-full bg-white/60 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className={`h-full ${m.level === "good" ? "bg-green-500" : m.level === "ok" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.max(0, Math.min(100, m.pct))}%` }} />
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          <button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "Menyimpan…" : form.id ? "Update Produk" : "Simpan Produk"}
          </button>
          <button onClick={() => setForm(emptyForm)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2">
            <RotateCcw className="h-4 w-4" /> Reset Form
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================== LIST TAB =========================== */

function ListTab({ products, onEdit, onDup, onReload }: { products: HppProduct[]; onEdit: (p: HppProduct) => void; onDup: (p: HppProduct) => void; onReload: () => Promise<void> }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState<"name" | "hpp" | "harga" | "margin">("name");
  const filtered = useMemo(() => {
    let r = products.filter((p) =>
      (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())) &&
      (!cat || p.category === cat),
    );
    r = [...r].sort((a, b) => {
      if (sort === "hpp") return b.total_hpp - a.total_hpp;
      if (sort === "harga") return b.harga_jual - a.harga_jual;
      if (sort === "margin") return marginInfo(b.total_hpp, b.harga_jual).pct - marginInfo(a.total_hpp, a.harga_jual).pct;
      return a.name.localeCompare(b.name);
    });
    return r;
  }, [products, q, cat, sort]);

  const del = async (p: HppProduct) => {
    if (!window.confirm(`Hapus "${p.name}"?`)) return;
    try { await deleteHppProduct(p.id); toast.success("Dihapus"); await onReload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Gagal"); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-2 top-2.5 text-slate-400" />
          <input className={`${inp} pl-8`} placeholder="Cari nama atau SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={inp} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Semua kategori</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={inp} value={sort} onChange={(e) => setSort(e.target.value as "name" | "hpp" | "harga" | "margin")}>
          <option value="name">Sort: Nama</option>
          <option value="hpp">Sort: HPP</option>
          <option value="harga">Sort: Harga</option>
          <option value="margin">Sort: Margin%</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="text-left p-2">Foto</th>
              <th className="text-left p-2">Produk</th>
              <th className="text-left p-2">Kategori</th>
              <th className="text-right p-2">HPP</th>
              <th className="text-right p-2">Harga Jual</th>
              <th className="text-right p-2">Margin</th>
              <th className="text-center p-2">Status</th>
              <th className="text-center p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const m = marginInfo(p.total_hpp, p.harga_jual);
              const primary = (p.images || []).find((i) => i.isPrimary) || (p.images || [])[0];
              return (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="p-2">
                    {primary ? <img src={primary.url} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="h-12 w-12 rounded bg-slate-100" />}
                  </td>
                  <td className="p-2">
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.sku}</div>
                  </td>
                  <td className="p-2 text-xs">{p.category}</td>
                  <td className="p-2 text-right">{fmtRp(p.total_hpp)}</td>
                  <td className="p-2 text-right font-semibold">{fmtRp(p.harga_jual)}</td>
                  <td className="p-2 text-right">{m.pct.toFixed(1)}%</td>
                  <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${m.bg} ${m.color}`}>{m.label}</span></td>
                  <td className="p-2">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => onEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => onDup(p)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                      <button onClick={() => del(p)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={8} className="p-8 text-center text-slate-400">Belum ada produk</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================== ANALYTICS TAB =========================== */

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function AnalyticsTab({ products }: { products: HppProduct[] }) {
  const stats = useMemo(() => {
    const margins = products.map((p) => ({ p, m: marginInfo(p.total_hpp, p.harga_jual) }));
    const avgMargin = margins.length ? margins.reduce((s, x) => s + x.m.pct, 0) / margins.length : 0;
    const totalHpp = products.reduce((s, p) => s + p.total_hpp * (p.stock || 1), 0);
    const totalRevenue = products.reduce((s, p) => s + p.harga_jual * (p.stock || 1), 0);
    const sorted = [...margins].sort((a, b) => b.m.pct - a.m.pct);
    const top = sorted[0]; const bottom = sorted[sorted.length - 1];
    const atRisk = margins.filter((x) => x.m.pct < 15).map((x) => x.p);
    const topByMargin = sorted.slice(0, 10).map((x) => ({ name: x.p.name.slice(0, 12), margin: +x.m.pct.toFixed(1) }));
    const byCat = Object.entries(products.reduce<Record<string, number>>((a, p) => { a[p.category] = (a[p.category] || 0) + 1; return a; }, {})).map(([name, value]) => ({ name, value }));
    const scatter = products.map((p) => ({ hpp: p.total_hpp, harga: p.harga_jual, name: p.name }));
    return { avgMargin, totalHpp, totalRevenue, top, bottom, atRisk, topByMargin, byCat, scatter, count: products.length };
  }, [products]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Total Produk" value={String(stats.count)} />
        <Metric label="Rata-rata Margin" value={`${stats.avgMargin.toFixed(1)}%`} />
        <Metric label="Modal (HPP × Stok)" value={fmtRp(stats.totalHpp)} />
        <Metric label="Potensi Revenue" value={fmtRp(stats.totalRevenue)} />
      </div>

      {stats.atRisk.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">{stats.atRisk.length} produk margin rendah (&lt;15%)</p>
            <p className="text-xs text-red-700">{stats.atRisk.slice(0, 5).map((p) => p.name).join(", ")}{stats.atRisk.length > 5 ? "…" : ""}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Top 10 Produk by Margin %">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.topByMargin} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid stroke="#eee" />
              <XAxis type="number" /><YAxis type="category" dataKey="name" width={80} fontSize={11} />
              <Tooltip /><Bar dataKey="margin" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Distribusi per Kategori">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.byCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {stats.byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend /><Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="HPP vs Harga Jual">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid /><XAxis dataKey="hpp" name="HPP" /><YAxis dataKey="harga" name="Harga" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} /><Scatter data={stats.scatter} fill="#10b981" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Highlights">
          <div className="space-y-2 text-sm">
            {stats.top && <div className="flex justify-between p-2 bg-green-50 rounded"><span>🏆 Tertinggi: <b>{stats.top.p.name}</b></span><b className="text-green-700">{stats.top.m.pct.toFixed(1)}%</b></div>}
            {stats.bottom && <div className="flex justify-between p-2 bg-red-50 rounded"><span>⚠️ Terendah: <b>{stats.bottom.p.name}</b></span><b className="text-red-700">{stats.bottom.m.pct.toFixed(1)}%</b></div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* =========================== CHANNELS TAB =========================== */

function ChannelsTab({ products }: { products: HppProduct[] }) {
  const [pid, setPid] = useState<string>(products[0]?.id || "");
  const [channels, setChannels] = useState<ProductChannel[]>([]);
  const product = products.find((p) => p.id === pid);

  const reload = async () => { if (pid) setChannels(await listChannels(pid)); };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [pid]);

  const add = async () => {
    if (!pid) return toast.error("Pilih produk dulu");
    try { await upsertChannel({ product_id: pid, channel_name: "Tokopedia", harga_jual: product?.harga_jual || 0, fee_persen: 5, fee_nominal: 0 }); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Gagal"); }
  };
  const save = async (c: ProductChannel) => { try { await upsertChannel(c); toast.success("Tersimpan"); } catch (e) { toast.error(e instanceof Error ? e.message : "Gagal"); } };
  const del = async (id: string) => { await deleteChannel(id); await reload(); };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select className={inp} value={pid} onChange={(e) => setPid(e.target.value)}>
          <option value="">— Pilih Produk —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
        </select>
        {product && <span className="text-xs text-slate-600">HPP: <b>{fmtRp(product.total_hpp)}</b></span>}
        <button onClick={add} disabled={!pid} className="ml-auto bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Channel</button>
      </div>

      {!product ? <p className="text-slate-400 text-center py-6">Pilih produk untuk mengatur harga per channel.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="p-2 text-left">Channel</th><th className="p-2 text-right">Harga Jual</th><th className="p-2 text-right">Fee %</th><th className="p-2 text-right">Fee Rp</th><th className="p-2 text-right">Net</th><th className="p-2 text-right">Net Margin</th><th></th></tr>
            </thead>
            <tbody>
              {channels.map((c) => {
                const fee = (c.harga_jual * c.fee_persen) / 100 + c.fee_nominal;
                const net = c.harga_jual - fee;
                const nm = marginInfo(product.total_hpp, net);
                return (
                  <tr key={c.id} className="border-t">
                    <td className="p-2"><select className={inp} value={c.channel_name} onChange={(e) => save({ ...c, channel_name: e.target.value })}>{CHANNELS.map((ch) => <option key={ch}>{ch}</option>)}</select></td>
                    <td className="p-2"><NumIn value={c.harga_jual} onChange={(v) => save({ ...c, harga_jual: v })} small /></td>
                    <td className="p-2"><NumIn value={c.fee_persen} onChange={(v) => save({ ...c, fee_persen: v })} small /></td>
                    <td className="p-2"><NumIn value={c.fee_nominal} onChange={(v) => save({ ...c, fee_nominal: v })} small /></td>
                    <td className="p-2 text-right">{fmtRp(net)}</td>
                    <td className={`p-2 text-right font-semibold ${nm.color}`}>{nm.pct.toFixed(1)}%</td>
                    <td className="p-2"><button onClick={() => del(c.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                );
              })}
              {!channels.length && <tr><td colSpan={7} className="p-6 text-center text-slate-400">Belum ada channel</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================== RECIPES TAB =========================== */

function RecipesTab({ products }: { products: HppProduct[] }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editing, setEditing] = useState<Partial<Recipe> | null>(null);

  const reload = async () => { setRecipes(await listRecipes()); };
  useEffect(() => { reload(); }, []);

  const newRecipe = () => setEditing({ name: "", images: [], ingredients: [], yield_qty: 1, difficulty: "easy" });

  const save = async () => {
    if (!editing?.name?.trim()) return toast.error("Nama resep wajib");
    try { await upsertRecipe(editing); toast.success("Tersimpan"); setEditing(null); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Gagal"); }
  };

  const del = async (id: string) => { if (!window.confirm("Hapus resep?")) return; await deleteRecipe(id); await reload(); };

  if (editing) {
    const total = (editing.ingredients || []).reduce((s, x) => s + (x.qty || 0) * (x.costPerUnit || 0), 0);
    const perPorsi = total / Math.max(1, editing.yield_qty || 1);
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
        <div className="flex justify-between"><h3 className="font-bold">{editing.id ? "Edit" : "Resep Baru"}</h3><button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button></div>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Nama Resep"><input className={inp} value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
          <Field label="Yield (porsi)"><NumIn value={editing.yield_qty || 1} onChange={(v) => setEditing({ ...editing, yield_qty: v })} /></Field>
          <Field label="Difficulty">
            <select className={inp} value={editing.difficulty || "easy"} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </Field>
        </div>
        <Field label="Foto Resep">
          <HppImageUploader images={editing.images || []} onChange={(imgs) => setEditing({ ...editing, images: imgs })} />
        </Field>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">Bahan</h4>
            <button onClick={() => setEditing({ ...editing, ingredients: [...(editing.ingredients || []), { name: "", qty: 0, unit: "gr", costPerUnit: 0 }] })} className="text-xs text-blue-600 flex items-center gap-1"><Plus className="h-3 w-3" /> Tambah Bahan</button>
          </div>
          {(editing.ingredients || []).map((ing, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_120px_auto] gap-2 mb-2">
              <select className={inp} value={ing.name} onChange={(e) => {
                const found = products.find((p) => p.name === e.target.value);
                const next = [...(editing.ingredients || [])];
                next[i] = { ...next[i], name: e.target.value, costPerUnit: found?.total_hpp || ing.costPerUnit };
                setEditing({ ...editing, ingredients: next });
              }}>
                <option value="">— pilih atau ketik —</option>
                {products.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              <NumIn value={ing.qty} onChange={(v) => { const n = [...(editing.ingredients || [])]; n[i] = { ...n[i], qty: v }; setEditing({ ...editing, ingredients: n }); }} small />
              <input className={inp} value={ing.unit} onChange={(e) => { const n = [...(editing.ingredients || [])]; n[i] = { ...n[i], unit: e.target.value }; setEditing({ ...editing, ingredients: n }); }} placeholder="gr/ml/pcs" />
              <NumIn value={ing.costPerUnit} onChange={(v) => { const n = [...(editing.ingredients || [])]; n[i] = { ...n[i], costPerUnit: v }; setEditing({ ...editing, ingredients: n }); }} small />
              <button onClick={() => { const n = (editing.ingredients || []).filter((_, j) => j !== i); setEditing({ ...editing, ingredients: n }); }} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 rounded-lg p-3 flex justify-between font-semibold text-blue-800">
          <span>Total HPP Resep: {fmtRp(total)}</span>
          <span>Per Porsi: {fmtRp(perPorsi)}</span>
        </div>
        <button onClick={save} className="bg-green-600 text-white rounded-lg px-4 py-2 font-semibold flex items-center gap-2"><Save className="h-4 w-4" /> Simpan Resep</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex justify-between mb-3"><h3 className="font-bold">Resep ({recipes.length})</h3><button onClick={newRecipe} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Resep Baru</button></div>
      <div className="grid md:grid-cols-3 gap-3">
        {recipes.map((r) => {
          const img = (r.images || []).find((i) => i.isPrimary) || (r.images || [])[0];
          return (
            <div key={r.id} className="border rounded-lg overflow-hidden">
              {img ? <img src={img.url} alt="" className="w-full h-32 object-cover" /> : <div className="w-full h-32 bg-slate-100" />}
              <div className="p-3">
                <h4 className="font-semibold">{r.name}</h4>
                <p className="text-xs text-slate-500">{r.ingredients.length} bahan · {r.yield_qty} porsi · {r.difficulty}</p>
                <p className="text-sm mt-1">HPP/porsi: <b className="text-blue-700">{fmtRp(r.hpp_per_porsi)}</b></p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditing(r)} className="text-blue-600 text-xs flex items-center gap-1"><Edit className="h-3 w-3" /> Edit</button>
                  <button onClick={() => del(r.id)} className="text-red-600 text-xs flex items-center gap-1"><Trash2 className="h-3 w-3" /> Hapus</button>
                </div>
              </div>
            </div>
          );
        })}
        {!recipes.length && <p className="col-span-3 text-center py-8 text-slate-400">Belum ada resep</p>}
      </div>
    </div>
  );
}

/* =========================== PROMO TAB =========================== */

function PromoTab({ products }: { products: HppProduct[] }) {
  const [pid, setPid] = useState("");
  const [discType, setDiscType] = useState<"pct" | "rp">("pct");
  const [disc, setDisc] = useState(10);
  const [volume, setVolume] = useState(50);
  const [budget, setBudget] = useState(500000);

  const p = products.find((x) => x.id === pid);
  if (!p) return (
    <div className="bg-white rounded-xl border p-4">
      <select className={inp} value={pid} onChange={(e) => setPid(e.target.value)}>
        <option value="">— Pilih Produk —</option>
        {products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      <p className="text-slate-400 text-center py-6">Pilih produk untuk simulasi promo</p>
    </div>
  );

  const discAmt = discType === "pct" ? (p.harga_jual * disc) / 100 : disc;
  const newPrice = Math.max(0, p.harga_jual - discAmt);
  const mBefore = marginInfo(p.total_hpp, p.harga_jual);
  const mAfter = marginInfo(p.total_hpp, newPrice);
  const profitPerUnit = newPrice - p.total_hpp;
  const breakEven = profitPerUnit > 0 ? Math.ceil(budget / profitPerUnit) : Infinity;
  const totalProfit = profitPerUnit * volume - budget;
  const feasible = totalProfit > 0;

  const compare = [
    { name: "Sebelum", margin: +mBefore.pct.toFixed(1) },
    { name: "Sesudah", margin: +mAfter.pct.toFixed(1) },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title="Setting Promo">
        <Field label="Produk"><select className={inp} value={pid} onChange={(e) => setPid(e.target.value)}>{products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
        <Field label="Harga Normal"><input className={`${inp} bg-slate-50`} value={fmtRp(p.harga_jual)} readOnly /></Field>
        <Field label="Tipe Diskon">
          <div className="flex gap-2">
            <button onClick={() => setDiscType("pct")} className={`flex-1 py-1.5 rounded text-sm ${discType === "pct" ? "bg-blue-600 text-white" : "bg-slate-100"}`}>Persen</button>
            <button onClick={() => setDiscType("rp")} className={`flex-1 py-1.5 rounded text-sm ${discType === "rp" ? "bg-blue-600 text-white" : "bg-slate-100"}`}>Nominal</button>
          </div>
        </Field>
        <Field label={`Diskon (${discType === "pct" ? "%" : "Rp"})`}><NumIn value={disc} onChange={setDisc} /></Field>
        <Field label="Target Volume Penjualan (pcs)"><NumIn value={volume} onChange={setVolume} /></Field>
        <Field label="Budget Promo (Rp)"><NumIn value={budget} onChange={setBudget} /></Field>
      </Card>

      <div className="space-y-3">
        <Card title="Hasil Simulasi" highlight>
          <div className="space-y-2 text-sm">
            <Row label="Harga setelah diskon" value={fmtRp(newPrice)} />
            <Row label="Profit per unit" value={fmtRp(profitPerUnit)} />
            <Row label="Margin sebelum" value={`${mBefore.pct.toFixed(1)}%`} />
            <Row label="Margin sesudah" value={`${mAfter.pct.toFixed(1)}%`} />
            <Row label="Break-even point" value={Number.isFinite(breakEven) ? `${breakEven} pcs` : "Tidak tercapai"} />
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Estimasi profit @ {volume} pcs</span>
              <span className={feasible ? "text-green-700" : "text-red-700"}>{fmtRp(totalProfit)}</span>
            </div>
            <div className={`mt-2 p-2 rounded text-sm font-semibold text-center ${feasible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {feasible ? "✓ Promo FEASIBLE" : "✗ Promo TIDAK FEASIBLE — rugi"}
            </div>
          </div>
        </Card>
        <Card title="Margin Sebelum vs Sesudah">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={compare}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="margin" fill="#3b82f6" /></BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* =========================== IMPORT/EXPORT TAB =========================== */

const CSV_HEADERS = ["nama_produk", "sku", "kategori", "harga_beli", "ongkir", "kemasan", "pajak", "handling", "shrinkage", "packaging_final", "biaya_lain", "harga_jual", "margin_target", "catatan"];

function IoTab({ products, onReload }: { products: HppProduct[]; onReload: () => Promise<void> }) {
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<{ ok: number; fail: { row: number; reason: string }[] } | null>(null);

  const exportCsv = () => {
    const rows = products.map((p) => ({
      nama_produk: p.name, sku: p.sku, kategori: p.category,
      harga_beli: p.harga_beli, ongkir: p.ongkir, kemasan: p.kemasan, pajak: p.pajak,
      handling: p.handling, shrinkage: p.shrinkage, packaging_final: p.packaging_final,
      biaya_lain: (p.biaya_lain || []).reduce((s, x) => s + x.amount, 0),
      harga_jual: p.harga_jual, margin_target: p.margin_target, catatan: p.notes || "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `hpp-products-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const sample = "Nasi Goreng,NSG001,Makanan,15000,2000,500,0,500,500,1000,0,25000,30,Spesial\nKopi Susu,KOP001,Minuman,5000,0,1000,0,0,0,500,0,12000,40,Hot/Iced";
    const csv = CSV_HEADERS.join(",") + "\n" + sample;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "template-hpp.csv"; a.click();
  };

  const handleFile = (file: File) => {
    setImporting(true);
    setReport(null);
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true,
      complete: async (res) => {
        const fail: { row: number; reason: string }[] = [];
        let ok = 0;
        for (let i = 0; i < res.data.length; i++) {
          const r = res.data[i];
          try {
            if (!r.sku || !r.nama_produk) throw new Error("sku/nama kosong");
            const extra = Number(r.biaya_lain) || 0;
            await upsertHppProduct({
              sku: r.sku, name: r.nama_produk, category: r.kategori || "Lainnya",
              harga_beli: +r.harga_beli || 0, ongkir: +r.ongkir || 0, kemasan: +r.kemasan || 0,
              pajak: +r.pajak || 0, handling: +r.handling || 0, shrinkage: +r.shrinkage || 0,
              packaging_final: +r.packaging_final || 0,
              biaya_lain: extra ? [{ name: "Lainnya", amount: extra }] : [],
              harga_jual: +r.harga_jual || 0, margin_target: +r.margin_target || 30,
              notes: r.catatan || null, images: [],
            });
            ok++;
          } catch (e) {
            fail.push({ row: i + 2, reason: e instanceof Error ? e.message : "error" });
          }
        }
        setReport({ ok, fail });
        setImporting(false);
        await onReload();
        toast.success(`${ok} berhasil, ${fail.length} gagal`);
      },
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Import CSV">
        <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 block">
          <Upload className="h-7 w-7 mx-auto mb-1 text-slate-400" />
          <p className="text-sm">{importing ? "Memproses…" : "Klik atau drop CSV"}</p>
          <input type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
        <button onClick={downloadTemplate} className="mt-3 text-sm text-blue-600 underline">Download template CSV</button>
        {report && (
          <div className="mt-3 text-sm">
            <p className="text-green-700">✓ {report.ok} produk berhasil</p>
            {report.fail.length > 0 && (
              <div className="bg-red-50 rounded p-2 mt-2 max-h-32 overflow-y-auto">
                {report.fail.map((f, i) => <p key={i} className="text-xs text-red-700">Baris {f.row}: {f.reason}</p>)}
              </div>
            )}
          </div>
        )}
      </Card>
      <Card title="Export Data">
        <p className="text-sm text-slate-600 mb-3">Export semua {products.length} produk ke CSV — bisa dibuka di Excel atau diimpor ke Kledo/akuntansi lain.</p>
        <button onClick={exportCsv} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"><Download className="h-4 w-4" /> Download CSV</button>
      </Card>
    </div>
  );
}

/* =========================== Shared UI =========================== */

const inp = "border rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400";

function Card({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border shadow-sm p-4 ${highlight ? "bg-gradient-to-br from-blue-50 to-white border-blue-200" : "bg-white"}`}>
      <h3 className="font-semibold text-slate-800 mb-3 text-sm">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-slate-600 font-medium">{label}</span><div className="mt-1">{children}</div></label>;
}
function NumIn({ value, onChange, small }: { value: number; onChange: (v: number) => void; small?: boolean }) {
  return <input type="number" min={0} className={`${inp} ${small ? "text-right" : ""}`} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-slate-700"><span>{label}</span><span>{value}</span></div>;
}
function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-white rounded-xl border p-3"><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-bold text-slate-800 mt-1">{value}</p></div>;
}
