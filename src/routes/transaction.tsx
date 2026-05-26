import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Minus } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  formatCurrency,
  nextInvoiceId,
  useProducts,
  useTransactions,
  type CartItem,
} from "@/lib/nota-store";

export const Route = createFileRoute("/transaction")({
  head: () => ({ meta: [{ title: "Buat Transaksi — Nota Pro" }] }),
  component: TransactionPage,
});

function TransactionPage() {
  const navigate = useNavigate();
  const [products] = useProducts();
  const [transactions, setTransactions] = useTransactions();
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState("");

  const addToCart = (productId: number) => {
    const p = products.find((p) => p.id === productId);
    if (!p) return;
    setItems((prev) => {
      const ex = prev.find((i) => i.productId === productId);
      if (ex) return prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { productId, name: p.name, price: p.price, qty: 1 }];
    });
  };

  const updateQty = (productId: number, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i)),
    );
  };

  const removeItem = (productId: number) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const save = () => {
    if (items.length === 0) {
      alert("Tambahkan minimal 1 produk");
      return;
    }
    const tx = {
      id: nextInvoiceId(transactions.length),
      date: new Date().toISOString(),
      customer: customer.trim() || "Umum",
      items,
      total,
    };
    setTransactions([tx, ...transactions]);
    setItems([]);
    setCustomer("");
    navigate({ to: "/history" });
  };

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Buat Transaksi</h1>
        <p className="text-slate-600 mt-1">Pilih produk dan buat nota baru</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.length === 0 && (
            <div className="col-span-full bg-white rounded-lg p-6 text-center text-slate-500 shadow-sm">
              Belum ada produk. Tambahkan di halaman Produk.
            </div>
          )}
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col">
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              <p className="text-blue-600 font-bold text-lg mt-1">{formatCurrency(p.price)}</p>
              {p.stock > 0 && (
                <span className="mt-2 inline-block self-start text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Stok: {p.stock}
                </span>
              )}
              <button
                onClick={() => addToCart(p.id)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Tambah
              </button>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-6 self-start bg-white rounded-lg shadow-md p-5 h-fit">
          <h2 className="font-bold text-slate-900 mb-3">Keranjang</h2>
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Nama Customer"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Keranjang kosong</p>
            )}
            {items.map((i) => (
              <div key={i.productId} className="border-b border-slate-100 pb-3">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-slate-800">{i.name}</p>
                  <button onClick={() => removeItem(i.productId)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(i.productId, i.qty - 1)}
                      className="border border-slate-300 rounded p-1 hover:bg-slate-50"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={i.qty}
                      onChange={(e) => updateQty(i.productId, Number(e.target.value) || 1)}
                      className="w-12 text-center border border-slate-300 rounded py-1 text-sm"
                    />
                    <button
                      onClick={() => updateQty(i.productId, i.qty + 1)}
                      className="border border-slate-300 rounded p-1 hover:bg-slate-50"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(i.price * i.qty)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 mt-4 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600">Total</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
            </div>
            <button
              onClick={save}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
            >
              Simpan & Cetak
            </button>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
