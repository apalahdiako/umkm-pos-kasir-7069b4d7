import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShoppingBag, Send, Minus, Plus, ArrowLeft, Copy } from "lucide-react";
import {
  formatCurrency,
  useProducts,
  useStoreSettings,
  waLink,
  type CartItem,
} from "@/lib/nota-store";

export const Route = createFileRoute("/catalog")({
  head: () => ({ meta: [{ title: "Toko Online — BY.UMKMKASIR" }] }),
  component: CatalogPage,
});

function CatalogPage() {
  const [products] = useProducts();
  const [settings] = useStoreSettings();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [search, setSearch] = useState("");

  const url = typeof window !== "undefined" ? window.location.href : "";

  const filtered = useMemo(
    () =>
      products
        .filter((p) => p.stock > 0)
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );

  const add = (id: number) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setCart((prev) => {
      const ex = prev.find((i) => i.productId === id);
      if (ex) return prev.map((i) => (i.productId === id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { productId: id, name: p.name, price: p.price, qty: 1 }];
    });
  };
  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) setCart(cart.filter((i) => i.productId !== id));
    else setCart(cart.map((i) => (i.productId === id ? { ...i, qty } : i)));
  };
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const sendOrder = () => {
    if (cart.length === 0) return alert("Keranjang kosong");
    const number = settings.waBusinessNumber || settings.phone;
    if (!number) return alert("Nomor WA toko belum di-set di Pengaturan");
    const lines = [
      `Halo *${settings.storeName}*, saya mau pesan:`,
      ...cart.map((i) => `• ${i.name} x${i.qty} = ${formatCurrency(i.price * i.qty)}`),
      `---`,
      `Total: *${formatCurrency(subtotal)}*`,
      customer ? `Nama: ${customer}` : "",
      `(via Toko Online BY.UMKMKASIR)`,
    ].filter(Boolean);
    window.open(waLink(number, lines.join("\n")), "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          {settings.logo && <img src={settings.logo} alt="" className="h-10 w-10 rounded object-cover bg-slate-100" />}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 truncate">{settings.storeName}</h1>
            <p className="text-xs text-slate-500 truncate">{settings.address}</p>
          </div>
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-5 mb-5 flex justify-between items-center flex-wrap gap-2">
          <div>
            <p className="text-blue-100 text-xs">Toko Online Instan</p>
            <p className="text-lg font-bold">{settings.storeName}</p>
            <p className="text-xs text-blue-200 mt-1">Bagikan link ini ke pelanggan</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(url);
              alert("Link disalin!");
            }}
            className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-xs flex items-center gap-1"
          >
            <Copy className="h-3 w-3" /> Salin Link
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 bg-white"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {filtered.length === 0 && (
            <div className="col-span-full bg-white rounded-lg p-6 text-center text-slate-500 text-sm shadow-sm">
              Tidak ada produk tersedia
            </div>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => add(p.id)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-3 text-left"
            >
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-24 object-cover rounded mb-2 bg-slate-100" />
              ) : (
                <div className="w-full h-24 rounded mb-2 bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="h-6 w-6" />
                </div>
              )}
              <h3 className="font-semibold text-slate-900 text-sm truncate">{p.name}</h3>
              <p className="text-blue-600 font-bold text-sm mt-0.5">{formatCurrency(p.price)}</p>
            </button>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sticky bottom-4">
            <h2 className="font-bold text-slate-900 mb-3">Keranjang Anda</h2>
            <ul className="space-y-2 mb-3 max-h-48 overflow-auto">
              {cart.map((i) => (
                <li key={i.productId} className="flex justify-between items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{i.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(i.productId, i.qty - 1)} className="border rounded p-1"><Minus className="h-3 w-3" /></button>
                    <span className="w-6 text-center">{i.qty}</span>
                    <button onClick={() => updateQty(i.productId, i.qty + 1)} className="border rounded p-1"><Plus className="h-3 w-3" /></button>
                  </div>
                  <span className="w-20 text-right font-semibold">{formatCurrency(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Nama Anda (opsional)"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-2"
            />
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-600 text-sm">Total</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(subtotal)}</span>
            </div>
            <button onClick={sendOrder} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
              <Send className="h-4 w-4" /> Kirim Pesanan via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
