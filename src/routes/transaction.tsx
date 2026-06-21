import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Minus, Search, Receipt, FileText, Mail, X, MessageCircle, Link2, Wallet } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  buildQrisPayload, buildReceiptText, calcHppTotal, formatCurrency, generateInvoiceId,
  printByType, printNota, printResi, printInvoice, qrImageUrl, shortId, usePaymentLinks,
  useProducts, useStoreSettings, useTransactions, waLink,
  type CartItem, type PaymentMethod, type ReceiptType, type Transaction,
} from "@/lib/nota-store";
import { useServerFn } from "@tanstack/react-start";
import { getDanaProfile, type DanaProfile } from "@/lib/dana.functions";

export const Route = createFileRoute("/transaction")({
  head: () => ({ meta: [{ title: "Kasir — Nota Pro" }] }),
  component: KasirPage,
});

function KasirPage() {
  const [products] = useProducts();
  const [transactions, setTransactions] = useTransactions();
  const [settings] = useStoreSettings();
  const [paymentLinks, setPaymentLinks] = usePaymentLinks();

  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"nominal" | "percent">("nominal");
  const [payment, setPayment] = useState<PaymentMethod>("Tunai");
  const [amountPaid, setAmountPaid] = useState(0);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showQris, setShowQris] = useState(false);
  const [showDana, setShowDana] = useState(false);
  const [dana, setDana] = useState<DanaProfile | null>(null);
  const fetchDana = useServerFn(getDanaProfile);
  useEffect(() => { fetchDana().then(setDana).catch(() => setDana(null)); }, [fetchDana]);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(["Semua"]);
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(
      (p) =>
        (category === "Semua" || p.category === category) &&
        p.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [products, category, search]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discAmount =
    discountType === "percent" ? Math.round((subtotal * (discount || 0)) / 100) : discount || 0;
  const taxable = Math.max(0, subtotal - discAmount);
  const tax = settings.taxEnabled ? Math.round((taxable * (settings.taxPercentage || 0)) / 100) : 0;
  const total = taxable + tax;
  const change = Math.max(0, (amountPaid || 0) - total);
  const insufficient = amountPaid > 0 && amountPaid < total;

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
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, qty } : i)));
    }
  };

  const reset = () => {
    setItems([]);
    setCustomer("");
    setCustomerPhone("");
    setDiscount(0);
    setAmountPaid(0);
    setPayment("Tunai");
  };

  const processPayment = () => {
    if (items.length === 0) return alert("Keranjang kosong!");
    if (payment !== "QRIS" && amountPaid < total) return alert("Jumlah bayar kurang dari total!");
    const paid = payment === "QRIS" ? total : amountPaid;
    const tx: Transaction = {
      id: generateInvoiceId(transactions),
      date: new Date().toISOString(),
      customer: customer.trim() || "Umum",
      customerPhone: customerPhone.trim() || undefined,
      items,
      subtotal,
      discount: discAmount,
      discountType,
      tax,
      total,
      hppTotal: calcHppTotal(items, products),
      paymentMethod: payment,
      amountPaid: paid,
      change: Math.max(0, paid - total),
      status: "completed",
      receiptType: null,
    };
    setTransactions([tx, ...transactions]);
    setLastTx(tx);
    setShowQris(false);
    setShowReceipt(true);
    reset();
  };

  const handlePay = () => {
    if (items.length === 0) return alert("Keranjang kosong!");
    if (payment === "QRIS") {
      setShowQris(true);
      return;
    }
    processPayment();
  };

  const handlePrint = (type: ReceiptType) => {
    if (!lastTx) return;
    printByType(type, lastTx, settings);
  };

  const sendWaReceipt = () => {
    if (!lastTx) return;
    const phone = lastTx.customerPhone || customerPhone;
    if (!phone) return alert("Nomor HP customer belum diisi");
    window.open(waLink(phone, buildReceiptText(lastTx, settings)), "_blank");
  };

  const createPaymentLink = () => {
    if (!lastTx) return;
    const link = {
      id: shortId("PL"),
      customer: lastTx.customer,
      amount: lastTx.total,
      description: `Invoice ${lastTx.id}`,
      createdAt: new Date().toISOString(),
      status: "pending" as const,
      refTxId: lastTx.id,
    };
    setPaymentLinks([link, ...paymentLinks]);
    const url = `${window.location.origin}/pay/${link.id}`;
    setGeneratedLink(url);
    navigator.clipboard?.writeText(url).catch(() => {});
  };

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Kasir (POS)</h1>
        <p className="text-slate-600 mt-1">Proses transaksi secara realtime</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: products */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${
                    category === c
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.length === 0 && (
              <div className="col-span-full bg-white rounded-lg p-6 text-center text-slate-500 shadow-sm">
                Tidak ada produk
              </div>
            )}
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p.id)}
                disabled={p.stock <= 0}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-3 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-20 object-cover rounded mb-2 bg-slate-100" />
                ) : (
                  <div className="w-full h-20 rounded mb-2 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                    No image
                  </div>
                )}
                <h3 className="font-semibold text-slate-900 text-sm truncate">{p.name}</h3>
                <p className="text-blue-600 font-bold text-sm mt-0.5">{formatCurrency(p.price)}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Stok: {p.stock}</p>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: cart */}
        <aside className="bg-white rounded-lg shadow-md p-5 h-fit lg:sticky lg:top-6">
          <h2 className="font-bold text-slate-900 mb-3">Detail Transaksi</h2>
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Nama Customer (opsional)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-2"
          />
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="No. HP (untuk WA / e-struk)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4"
          />


          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {items.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Keranjang kosong</p>
            )}
            {items.map((i) => (
              <div key={i.productId} className="border-b border-slate-100 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-medium text-slate-800 flex-1">{i.name}</p>
                  <button
                    onClick={() => updateQty(i.productId, 0)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(i.productId, i.qty - 1)}
                      className="border border-slate-300 rounded p-1 hover:bg-slate-50"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm">{i.qty}</span>
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

          <div className="border-t border-slate-200 mt-4 pt-3 text-sm space-y-1.5">
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">Diskon</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-20 border border-slate-300 rounded px-2 py-1 text-right text-sm"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "nominal" | "percent")}
                  className="border border-slate-300 rounded px-1 py-1 text-xs"
                >
                  <option value="nominal">Rp</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
            {settings.taxEnabled && (
              <Row label={`Pajak (${settings.taxPercentage}%)`} value={formatCurrency(tax)} />
            )}
          </div>

          <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between items-center">
            <span className="text-slate-600 font-medium">TOTAL</span>
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-slate-600 mb-2">Metode Pembayaran</p>
            <div className="grid grid-cols-2 gap-2">
              {settings.paymentMethods.map((m) => (
                <button
                  key={m}
                  onClick={() => setPayment(m)}
                  className={`text-xs py-1.5 px-2 rounded border ${
                    payment === m
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <div>
              <label className="text-xs text-slate-600">Jumlah Bayar</label>
              <input
                type="number"
                min={0}
                value={amountPaid || ""}
                onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-right"
              />
            </div>
            <Row
              label="Kembalian"
              value={formatCurrency(change)}
              valueClass={insufficient ? "text-red-600" : "text-green-600 font-semibold"}
            />
            {insufficient && (
              <p className="text-xs text-red-600">Jumlah bayar kurang dari total</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={reset}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 rounded-lg font-medium text-sm"
            >
              Batal
            </button>
            <button
              onClick={handlePay}
              className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold text-sm"
            >
              {payment === "QRIS" ? "Bayar QRIS" : "Bayar & Cetak"}
            </button>

          </div>
        </aside>
      </div>

      {/* Receipt selection modal */}
      {showReceipt && lastTx && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowReceipt(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pilih Jenis Cetak</h2>
                <p className="text-sm text-slate-500">{lastTx.id} · {formatCurrency(lastTx.total)}</p>
              </div>
              <button onClick={() => setShowReceipt(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              <ReceiptOption
                icon={Receipt}
                title="Nota"
                desc="Struk kasir thermal 58mm"
                onClick={() => handlePrint("nota")}
              />
              <ReceiptOption
                icon={Mail}
                title="Resi"
                desc="Slip pengiriman / delivery"
                onClick={() => handlePrint("resi")}
              />
              <ReceiptOption
                icon={FileText}
                title="Invoice"
                desc="Tagihan formal A4"
                onClick={() => handlePrint("invoice")}
              />
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
              <p className="text-xs font-medium text-slate-600">Kirim e-Struk / Tagihan</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={sendWaReceipt}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-semibold"
                >
                  <MessageCircle className="h-4 w-4" /> Kirim WA
                </button>
                <button
                  onClick={createPaymentLink}
                  className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-semibold"
                >
                  <Link2 className="h-4 w-4" /> Payment Link
                </button>
              </div>
              {generatedLink && (
                <div className="bg-indigo-50 border border-indigo-200 rounded p-2 text-xs">
                  <p className="text-indigo-900 font-medium mb-1">Link disalin ke clipboard:</p>
                  <a href={generatedLink} target="_blank" rel="noreferrer" className="text-indigo-700 break-all underline">
                    {generatedLink}
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => { setShowReceipt(false); setGeneratedLink(null); }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  if (!lastTx) return;
                  printNota(lastTx, settings);
                  printResi(lastTx, settings);
                  printInvoice(lastTx, settings);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold"
              >
                Cetak Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QRIS dynamic modal */}
      {showQris && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setShowQris(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-bold text-slate-900">Scan QRIS</h2>
              <button onClick={() => setShowQris(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">{settings.qrisMerchantName || settings.storeName}</p>
            <div className="bg-slate-50 rounded-lg p-3 inline-block">
              <img
                src={qrImageUrl(
                  buildQrisPayload(
                    settings.qrisMerchantName || settings.storeName,
                    total,
                    `TMP-${Date.now()}`,
                    settings.qrisStaticPayload,
                  ),
                  220,
                )}
                alt="QRIS"
                className="w-[220px] h-[220px]"
              />
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-3">{formatCurrency(total)}</p>
            <p className="text-xs text-slate-500 mt-1">QRIS dinamis · nominal otomatis</p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                onClick={() => setShowQris(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-2.5 rounded-lg text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={processPayment}
                className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold"
              >
                Sudah Dibayar
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={valueClass || "text-slate-900"}>{value}</span>
    </div>
  );
}

function ReceiptOption({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-300 text-left"
    >
      <div className="bg-blue-50 text-blue-600 p-2 rounded">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-slate-900 text-sm">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </button>
  );
}
