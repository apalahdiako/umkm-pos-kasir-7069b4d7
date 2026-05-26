import { useEffect, useState } from "react";

export type Product = { id: number; name: string; price: number; stock: number };
export type CartItem = { productId: number; name: string; price: number; qty: number };
export type Transaction = {
  id: string;
  date: string;
  customer: string;
  items: CartItem[];
  total: number;
};
export type StoreSettings = { storeName: string; phone: string; address: string };

const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, name: "Kopi Susu", price: 18000, stock: 50 },
  { id: 2, name: "Teh Manis", price: 8000, stock: 80 },
  { id: 3, name: "Nasi Goreng", price: 25000, stock: 20 },
  { id: 4, name: "Mie Ayam", price: 20000, stock: 15 },
];

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Toko Saya",
  phone: "08xx-xxxx-xxxx",
  address: "Alamat Toko",
};

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}

export const useProducts = () => useLocalStorage<Product[]>("nota.products", DEFAULT_PRODUCTS);
export const useTransactions = () => useLocalStorage<Transaction[]>("nota.transactions", []);
export const useStoreSettings = () => useLocalStorage<StoreSettings>("nota.settings", DEFAULT_SETTINGS);

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nextInvoiceId(count: number) {
  return "INV" + String(count + 1).padStart(3, "0");
}

export function printReceipt(tx: Transaction, settings: StoreSettings) {
  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) return;
  const rows = tx.items
    .map(
      (i) =>
        `<tr><td>${i.name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">${formatCurrency(
          i.price * i.qty,
        )}</td></tr>`,
    )
    .join("");
  w.document.write(`<!doctype html><html><head><title>${tx.id}</title>
  <style>
    body{font-family:'Courier New',monospace;width:58mm;margin:0;padding:8px;font-size:12px;color:#000}
    h1{font-size:14px;margin:0;text-align:center}
    .meta{text-align:center;margin-bottom:4px}
    hr{border:none;border-top:1px dashed #000;margin:6px 0}
    table{width:100%;border-collapse:collapse}
    td{padding:2px 0;vertical-align:top}
    .total{font-size:14px;font-weight:bold;display:flex;justify-content:space-between}
    .foot{text-align:center;margin-top:8px}
    @media print { @page { margin: 0 } }
  </style></head><body>
    <h1>${settings.storeName}</h1>
    <div class="meta">${settings.phone}<br/>${settings.address}</div>
    <hr/>
    <div>${tx.id}</div>
    <div>${formatDate(tx.date)}</div>
    <div>Customer: ${tx.customer || "-"}</div>
    <hr/>
    <table>${rows}</table>
    <hr/>
    <div class="total"><span>TOTAL</span><span>${formatCurrency(tx.total)}</span></div>
    <hr/>
    <div class="foot">Terima kasih atas pembelian Anda!</div>
    <script>setTimeout(()=>window.print(),200);</script>
  </body></html>`);
  w.document.close();
}
