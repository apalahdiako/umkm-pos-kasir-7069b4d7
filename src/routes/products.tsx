import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Edit2, Trash2, X, Upload, Search } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency, useProducts, type Product } from "@/lib/nota-store";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Kelola Produk — Nota Pro" }] }),
  component: ProductsPage,
});

type Draft = {
  name: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  image: string | null;
};

const emptyDraft: Draft = {
  name: "",
  category: "Lain-lain",
  price: "",
  stock: "",
  description: "",
  image: null,
};

const CATEGORY_PRESETS = ["Makanan", "Minuman", "Barang", "Jasa", "Lain-lain"];


function ProductsPage() {
  const [products, setProducts] = useProducts();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Semua");

  const categories = useMemo(() => {
    const set = new Set<string>(["Semua", ...CATEGORY_PRESETS]);
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const filtered = products.filter(
    (p) =>
      (filterCat === "Semua" || p.category === filterCat) &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setDraft({
      name: p.name,
      category: p.category || "Lain-lain",
      price: String(p.price),
      stock: String(p.stock),
      description: p.description || "",
      image: p.image ?? null,
    });
    setShowForm(true);
  };

  const handleImage = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setDraft((d) => ({ ...d, image: (e.target?.result as string) || null }));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!draft.name.trim() || !draft.price) {
      alert("Nama dan harga wajib diisi");
      return;
    }
    if (editingId != null) {
      setProducts(
        products.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: draft.name.trim(),
                category: draft.category,
                price: Number(draft.price) || 0,
                stock: Number(draft.stock) || 0,
                description: draft.description,
                image: draft.image,
              }
            : p,
        ),
      );
    } else {
      const nextId = products.reduce((m, p) => Math.max(m, p.id), 0) + 1;
      setProducts([
        ...products,
        {
          id: nextId,
          name: draft.name.trim(),
          category: draft.category,
          price: Number(draft.price) || 0,
          stock: Number(draft.stock) || 0,
          description: draft.description,
          image: draft.image,
        },
      ]);
    }
    setShowForm(false);
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const remove = (id: number) => {
    if (!confirm("Hapus produk ini?")) return;
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <AppLayout>
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kelola Produk</h1>
          <p className="text-slate-600 mt-1">CRUD produk dengan kategori & foto</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Tambah Produk
        </button>
      </header>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="relative mb-3">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${
                filterCat === c ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full bg-white rounded-lg p-8 text-center text-slate-500 shadow-sm">
            Belum ada produk
          </div>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {p.image ? (
              <img src={p.image} alt={p.name} className="w-full h-32 object-cover bg-slate-100" />
            ) : (
              <div className="w-full h-32 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                No image
              </div>
            )}
            <div className="p-4">
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{p.category || "—"}</span>
              <h3 className="font-semibold text-slate-900 mt-1">{p.name}</h3>
              <p className="text-blue-600 font-bold text-lg mt-1">{formatCurrency(p.price)}</p>
              <p className={`text-xs mt-1 ${p.stock > 0 ? "text-slate-600" : "text-red-600"}`}>
                Stok: {p.stock}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 text-sm"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 text-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Produk" : "Produk Baru"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Nama Produk">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kategori">
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {CATEGORY_PRESETS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Harga">
                  <input
                    type="number"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </Field>
              </div>
              <Field label="Stok">
                <input
                  type="number"
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Deskripsi">
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Foto Produk">
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleImage(e.dataTransfer.files?.[0] || null);
                  }}
                  className="block border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50"
                >
                  {draft.image ? (
                    <img src={draft.image} alt="" className="max-h-32 mx-auto rounded" />
                  ) : (
                    <div className="text-slate-500 text-sm flex flex-col items-center gap-1">
                      <Upload className="h-5 w-5" />
                      Klik atau drag file
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImage(e.target.files?.[0] || null)}
                  />
                </label>
                {draft.image && (
                  <button
                    onClick={() => setDraft({ ...draft, image: null })}
                    className="text-xs text-red-600 mt-1"
                  >
                    Hapus foto
                  </button>
                )}
              </Field>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={save}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold"
              >
                Simpan
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 rounded-lg font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
