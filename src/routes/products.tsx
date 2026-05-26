import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit2, Trash2, X, Check } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency, useProducts, type Product } from "@/lib/nota-store";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Kelola Produk — Nota Pro" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useProducts();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ name: "", price: "", stock: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; price: string; stock: string }>({
    name: "",
    price: "",
    stock: "",
  });

  const addProduct = () => {
    if (!draft.name.trim() || !draft.price) {
      alert("Nama dan harga wajib diisi");
      return;
    }
    const nextId = products.reduce((m, p) => Math.max(m, p.id), 0) + 1;
    const p: Product = {
      id: nextId,
      name: draft.name.trim(),
      price: Number(draft.price) || 0,
      stock: Number(draft.stock) || 0,
    };
    setProducts([...products, p]);
    setDraft({ name: "", price: "", stock: "" });
    setShowForm(false);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditDraft({ name: p.name, price: String(p.price), stock: String(p.stock) });
  };

  const saveEdit = () => {
    if (editingId == null) return;
    setProducts(
      products.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: editDraft.name.trim() || p.name,
              price: Number(editDraft.price) || 0,
              stock: Number(editDraft.stock) || 0,
            }
          : p,
      ),
    );
    setEditingId(null);
  };

  const deleteProduct = (id: number) => {
    if (!confirm("Hapus produk ini?")) return;
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <AppLayout>
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kelola Produk</h1>
          <p className="text-slate-600 mt-1">Tambah, edit, atau hapus produk</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Tambah Produk
        </button>
      </header>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <h2 className="font-semibold text-slate-900 mb-3">Produk Baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              placeholder="Nama produk"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Harga"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Stok"
              value={draft.stock}
              onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addProduct}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg"
            >
              Simpan
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setDraft({ name: "", price: "", stock: "" });
              }}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-4 py-2 rounded-lg"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.length === 0 && (
          <div className="col-span-full bg-white rounded-lg p-8 text-center text-slate-500 shadow-sm">
            Belum ada produk
          </div>
        )}
        {products.map((p) =>
          editingId === p.id ? (
            <div key={p.id} className="bg-white rounded-lg shadow-md p-5 ring-2 ring-blue-500">
              <div className="grid grid-cols-1 gap-2">
                <input
                  value={editDraft.name}
                  onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={editDraft.price}
                  onChange={(e) => setEditDraft({ ...editDraft, price: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={editDraft.stock}
                  onChange={(e) => setEditDraft({ ...editDraft, stock: e.target.value })}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={saveEdit}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-1"
                >
                  <Check className="h-4 w-4" /> Simpan
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg flex items-center justify-center gap-1"
                >
                  <X className="h-4 w-4" /> Batal
                </button>
              </div>
            </div>
          ) : (
            <div key={p.id} className="bg-white rounded-lg shadow-md p-5">
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              <p className="text-blue-600 font-bold text-lg mt-1">{formatCurrency(p.price)}</p>
              <p className="text-sm text-slate-600 mt-1">Stok: {p.stock}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => startEdit(p)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 text-sm"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 text-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </AppLayout>
  );
}
