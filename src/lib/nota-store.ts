import { useEffect, useState } from "react";

// ============= Types =============
export type RecipeItem = { name: string; qty: number; unit: string; costPerUnit: number };

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  hpp?: number; // Harga Pokok Penjualan / cost
  image?: string | null;
  description?: string;
  recipe?: RecipeItem[]; // BOM
};

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  qty: number;
};

export type PaymentMethod = "Tunai" | "Kartu" | "Transfer" | "QRIS" | "DANA";
export type ReceiptType = "nota" | "resi" | "invoice";
export type TxStatus = "completed" | "pending" | "cancelled";

export type Transaction = {
  id: string;
  date: string;
  customer: string;
  customerPhone?: string;
  memberId?: string | null;
  tableNo?: string | null;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType?: "nominal" | "percent";
  loyaltyDiscount?: number;
  tax: number;
  total: number;
  hppTotal?: number; // total HPP for laba/rugi
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  status: TxStatus;
  receiptType?: ReceiptType | null;
  notes?: string;
  shiftId?: string | null;
  cashierName?: string;
  pointsEarned?: number;
};

export type StoreSettings = {
  storeName: string;
  storeSlug: string; // for catalog URL
  phone: string;
  email: string;
  address: string;
  city: string;
  npwp: string;
  logo: string | null;
  taxEnabled: boolean;
  taxPercentage: number;
  paymentMethods: PaymentMethod[];
  customNotes: string;
  showLogoInReceipt: boolean;
  showTaxNumberInReceipt: boolean;
  // Wallet & QRIS
  qrisMerchantName: string;
  qrisStaticPayload: string; // optional static QRIS string
  // Loyalty
  loyaltyEnabled: boolean;
  pointsPerRupiah: number; // e.g. 1 point per 10000
  rupiahPerPoint: number; // e.g. 1 point = Rp 100
  // Operators / PIN
  managerPin: string;
  ownerPin: string;
  // Fixed costs (per day) for laba/rugi
  dailyRent: number;
  dailyUtilities: number;
  // WA business number for notifications
  waBusinessNumber: string;
};

export type Member = {
  id: string;
  name: string;
  phone: string;
  points: number;
  totalSpent: number;
  joinedAt: string;
};

export type LedgerEntry = {
  id: string;
  date: string;
  type: "sale" | "withdrawal" | "fee" | "refund" | "topup" | "adjustment";
  description: string;
  amount: number; // positive = in, negative = out
  refTxId?: string | null;
};

export type Cashbon = {
  id: string;
  customer: string;
  phone: string;
  amount: number;
  paid: number;
  description: string;
  dueDate: string;
  createdAt: string;
  status: "open" | "paid" | "overdue";
  lastReminderAt?: string | null;
};

export type Shift = {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string | null;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  notes?: string;
  status: "open" | "closed";
};

export type PaymentLink = {
  id: string;
  customer: string;
  amount: number;
  description: string;
  createdAt: string;
  paidAt?: string | null;
  status: "pending" | "paid" | "expired";
  refTxId?: string | null;
};

// ============= Defaults =============
const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, name: "Kopi Susu", category: "Minuman", price: 18000, hpp: 7000, stock: 50, recipe: [
    { name: "Espresso", qty: 30, unit: "ml", costPerUnit: 80 },
    { name: "Susu", qty: 150, unit: "ml", costPerUnit: 20 },
    { name: "Gula aren", qty: 15, unit: "ml", costPerUnit: 50 },
    { name: "Cup + tutup", qty: 1, unit: "pcs", costPerUnit: 800 },
  ] },
  { id: 2, name: "Teh Manis", category: "Minuman", price: 8000, hpp: 2500, stock: 80 },
  { id: 3, name: "Nasi Goreng", category: "Makanan", price: 25000, hpp: 12000, stock: 20 },
  { id: 4, name: "Mie Ayam", category: "Makanan", price: 20000, hpp: 9000, stock: 15 },
];

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Toko Saya",
  storeSlug: "tokosaya",
  phone: "08xx-xxxx-xxxx",
  email: "toko@email.com",
  address: "Jl. Alamat Toko",
  city: "Jakarta",
  npwp: "",
  logo: null,
  taxEnabled: false,
  taxPercentage: 10,
  paymentMethods: ["Tunai", "Kartu", "Transfer", "QRIS"],
  customNotes: "Terima kasih atas pembelian Anda!",
  showLogoInReceipt: true,
  showTaxNumberInReceipt: true,
  qrisMerchantName: "TOKO SAYA",
  qrisStaticPayload: "",
  loyaltyEnabled: true,
  pointsPerRupiah: 10000, // 1 poin tiap Rp 10.000
  rupiahPerPoint: 100,
  managerPin: "1234",
  ownerPin: "9999",
  dailyRent: 0,
  dailyUtilities: 0,
  waBusinessNumber: "",
};

// ============= Hooks =============
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue({ ...initial, ...JSON.parse(raw) } as T);
    } catch {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error("localStorage error", e);
      }
    }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}

function useLocalStorageArray<T>(key: string, initial: T[]) {
  const [value, setValue] = useState<T[]>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error("localStorage error", e);
      }
    }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}

export const useProducts = () =>
  useLocalStorageArray<Product>("nota_pro_products", DEFAULT_PRODUCTS);
export const useTransactions = () =>
  useLocalStorageArray<Transaction>("nota_pro_transactions", []);
export const useStoreSettings = () =>
  useLocalStorage<StoreSettings>("nota_pro_store_settings", DEFAULT_SETTINGS);
export const useMembers = () => useLocalStorageArray<Member>("nota_pro_members", []);
export const useLedger = () => useLocalStorageArray<LedgerEntry>("nota_pro_ledger", []);
export const useCashbons = () => useLocalStorageArray<Cashbon>("nota_pro_cashbons", []);
export const useShifts = () => useLocalStorageArray<Shift>("nota_pro_shifts", []);
export const usePaymentLinks = () =>
  useLocalStorageArray<PaymentLink>("nota_pro_payment_links", []);

// ============= Utils =============
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
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

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function generateInvoiceId(existing: Transaction[]) {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const count =
    existing.filter((t) => t.id.startsWith(`INV${dateStr}`)).length + 1;
  return `INV${dateStr}${String(count).padStart(3, "0")}`;
}

export function shortId(prefix = "ID") {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)
    .toString(36)
    .toUpperCase()}`;
}

// QRIS dinamis — dummy: encode merchant + amount as text, render via api.qrserver.com
export function buildQrisPayload(
  merchant: string,
  amount: number,
  invoiceId: string,
  staticPayload?: string,
) {
  if (staticPayload && staticPayload.trim()) {
    // Append amount to a real static QRIS payload (simplified mock; real QRIS uses tag 54)
    return `${staticPayload.trim()}|AMT:${amount}|INV:${invoiceId}`;
  }
  return `QRIS|MERCHANT:${merchant}|AMT:${amount}|INV:${invoiceId}|TS:${Date.now()}`;
}

export function qrImageUrl(data: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

export function waLink(phone: string, message: string) {
  const clean = (phone || "").replace(/[^0-9]/g, "").replace(/^0/, "62");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function calcHppTotal(items: CartItem[], products: Product[]) {
  return items.reduce((s, i) => {
    const p = products.find((pp) => pp.id === i.productId);
    return s + (p?.hpp || 0) * i.qty;
  }, 0);
}

// ============= Print helpers =============
function openPrintWindow(html: string, width = 600, height = 800) {
  const w = window.open("", "_blank", `width=${width},height=${height}`);
  if (!w) {
    alert("Pop-up diblokir. Aktifkan pop-up untuk mencetak.");
    return;
  }
  w.document.write(html);
  w.document.close();
}

const baseStyle = `
  body{font-family:Arial,sans-serif;color:#0f172a;margin:0;padding:16px}
  .center{text-align:center} .right{text-align:right} .bold{font-weight:bold}
  hr{border:none;border-top:1px dashed #475569;margin:8px 0}
  table{width:100%;border-collapse:collapse}
  .logo{max-width:80px;max-height:80px;margin:0 auto;display:block}
  @media print { @page { margin: 8mm } }
`;

export function printNota(tx: Transaction, s: StoreSettings) {
  const rows = tx.items
    .map(
      (i) => `<tr>
        <td>${i.name} <small>x${i.qty}</small></td>
        <td style="text-align:right">${formatCurrency(i.price * i.qty)}</td>
      </tr>`,
    )
    .join("");
  openPrintWindow(
    `<!doctype html><html><head><title>Nota ${tx.id}</title>
    <style>
      body{font-family:'Courier New',monospace;width:58mm;margin:0;padding:8px;font-size:12px;color:#000}
      h1{font-size:14px;margin:4px 0;text-align:center}
      .meta{text-align:center;font-size:10px}
      hr{border:none;border-top:1px dashed #000;margin:6px 0}
      table{width:100%;border-collapse:collapse}
      td{padding:2px 0;vertical-align:top;font-size:11px}
      .total{font-size:14px;font-weight:bold;display:flex;justify-content:space-between}
      .foot{text-align:center;margin-top:8px;font-size:10px}
      .logo{display:block;margin:0 auto 4px;max-width:48px;max-height:48px}
      @media print { @page { margin: 0 } }
    </style></head><body>
      ${s.showLogoInReceipt && s.logo ? `<img class="logo" src="${s.logo}"/>` : ""}
      <h1>${s.storeName}</h1>
      <div class="meta">${s.phone}<br/>${s.address}</div>
      ${s.showTaxNumberInReceipt && s.npwp ? `<div class="meta">NPWP: ${s.npwp}</div>` : ""}
      <hr/>
      <div><b>${tx.id}</b></div>
      <div>${formatDate(tx.date)}</div>
      <div>Customer: ${tx.customer || "-"}</div>
      ${tx.tableNo ? `<div>Meja: ${tx.tableNo}</div>` : ""}
      <hr/>
      <table>${rows}</table>
      <hr/>
      <div class="right">Subtotal: ${formatCurrency(tx.subtotal)}</div>
      ${tx.discount > 0 ? `<div class="right">Diskon: -${formatCurrency(tx.discount)}</div>` : ""}
      ${tx.loyaltyDiscount ? `<div class="right">Poin: -${formatCurrency(tx.loyaltyDiscount)}</div>` : ""}
      ${tx.tax > 0 ? `<div class="right">Pajak: ${formatCurrency(tx.tax)}</div>` : ""}
      <hr/>
      <div class="total"><span>TOTAL</span><span>${formatCurrency(tx.total)}</span></div>
      <hr/>
      <div>Metode: ${tx.paymentMethod}</div>
      <div>Bayar: ${formatCurrency(tx.amountPaid)}</div>
      <div>Kembalian: ${formatCurrency(tx.change)}</div>
      ${tx.pointsEarned ? `<div>Poin diperoleh: +${tx.pointsEarned}</div>` : ""}
      <hr/>
      <div class="foot">${s.customNotes || "Terima kasih!"}</div>
      <script>setTimeout(()=>window.print(),200);</script>
    </body></html>`,
    400,
    600,
  );
}

export function printResi(tx: Transaction, s: StoreSettings) {
  const rows = tx.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0">${i.name}</td><td class="right">x${i.qty}</td></tr>`,
    )
    .join("");
  openPrintWindow(
    `<!doctype html><html><head><title>Resi ${tx.id}</title><style>${baseStyle}
    .box{border:2px solid #0f172a;padding:16px;max-width:480px;margin:0 auto;border-radius:8px}
    h1{text-align:center;font-size:20px;margin:0 0 8px}
    .sec{margin-top:12px} .sec h3{margin:0 0 4px;font-size:13px;text-transform:uppercase;color:#475569}
    .row{display:flex;justify-content:space-between;font-size:13px;margin:2px 0}
    .sign{margin-top:24px;border-top:1px solid #0f172a;padding-top:6px;font-size:11px;text-align:center}
    </style></head><body>
    <div class="box">
      ${s.showLogoInReceipt && s.logo ? `<img class="logo" src="${s.logo}"/>` : ""}
      <h1>RESI PENGIRIMAN</h1>
      <div class="row"><span><b>No:</b> ${tx.id}</span><span>${formatDate(tx.date)}</span></div>
      <div class="sec"><h3>Pengirim</h3>
        <div>${s.storeName}</div>
        <div>${s.address}, ${s.city}</div>
        <div>Telp: ${s.phone}</div>
      </div>
      <div class="sec"><h3>Penerima</h3>
        <div>${tx.customer || "-"}</div>
        <div>${tx.notes || "-"}</div>
      </div>
      <div class="sec"><h3>Barang</h3>
        <table>${rows}</table>
      </div>
      <div class="sec row bold" style="font-size:16px;margin-top:12px">
        <span>TOTAL</span><span>${formatCurrency(tx.total)}</span>
      </div>
      <div class="row"><span>Metode Bayar</span><span>${tx.paymentMethod}</span></div>
      <div class="row"><span>Status</span><span>${tx.status.toUpperCase()}</span></div>
      <div style="display:flex;gap:16px;margin-top:24px">
        <div style="flex:1" class="sign">Tanda Pengirim</div>
        <div style="flex:1" class="sign">Tanda Penerima</div>
      </div>
    </div>
    <script>setTimeout(()=>window.print(),200);</script>
    </body></html>`,
    700,
    900,
  );
}

export function printInvoice(tx: Transaction, s: StoreSettings) {
  const rows = tx.items
    .map(
      (i, idx) => `<tr>
      <td>${idx + 1}</td>
      <td>${i.name}</td>
      <td class="right">${i.qty}</td>
      <td class="right">${formatCurrency(i.price)}</td>
      <td class="right">${formatCurrency(i.price * i.qty)}</td>
    </tr>`,
    )
    .join("");
  const due = new Date(new Date(tx.date).getTime() + 7 * 24 * 3600 * 1000);
  openPrintWindow(
    `<!doctype html><html><head><title>Invoice ${tx.id}</title><style>${baseStyle}
    .wrap{max-width:780px;margin:0 auto;padding:24px}
    .head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;border-bottom:3px solid #2563eb;padding-bottom:12px}
    .head h1{margin:0;font-size:28px;color:#2563eb}
    .from-to{display:flex;justify-content:space-between;gap:24px;margin:16px 0}
    .from-to>div{flex:1}
    table.items{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
    table.items th,table.items td{border:1px solid #cbd5e1;padding:8px}
    table.items th{background:#f1f5f9;text-align:left}
    .totals{margin-top:12px;margin-left:auto;width:300px;font-size:13px}
    .totals .row{display:flex;justify-content:space-between;padding:4px 0}
    .totals .grand{border-top:2px solid #0f172a;font-size:18px;font-weight:bold;color:#2563eb;padding-top:8px;margin-top:6px}
    .sign{display:flex;justify-content:space-between;margin-top:48px;gap:24px}
    .sign div{flex:1;border-top:1px solid #0f172a;padding-top:6px;text-align:center;font-size:12px}
    h3{font-size:13px;text-transform:uppercase;color:#475569;margin:0 0 6px}
    </style></head><body>
    <div class="wrap">
      <div class="head">
        <div>
          ${s.showLogoInReceipt && s.logo ? `<img src="${s.logo}" style="max-height:64px;margin-bottom:8px"/>` : ""}
          <div style="font-weight:bold;font-size:18px">${s.storeName}</div>
          <div>${s.address}, ${s.city}</div>
          <div>Telp: ${s.phone} · ${s.email}</div>
          ${s.showTaxNumberInReceipt && s.npwp ? `<div>NPWP: ${s.npwp}</div>` : ""}
        </div>
        <div style="text-align:right">
          <h1>INVOICE</h1>
          <div><b>${tx.id}</b></div>
          <div>Tanggal: ${formatDay(tx.date)}</div>
          <div>Jatuh Tempo: ${due.toLocaleDateString("id-ID")}</div>
        </div>
      </div>
      <div class="from-to">
        <div><h3>Ditagihkan kepada</h3>
          <div style="font-weight:bold">${tx.customer || "-"}</div>
        </div>
        <div style="text-align:right"><h3>Status Pembayaran</h3>
          <div style="font-weight:bold;color:${tx.status === "completed" ? "#16a34a" : "#ea580c"}">${tx.status.toUpperCase()}</div>
        </div>
      </div>
      <table class="items">
        <thead><tr><th>No</th><th>Deskripsi</th><th class="right">Qty</th><th class="right">Harga</th><th class="right">Jumlah</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${formatCurrency(tx.subtotal)}</span></div>
        ${tx.discount > 0 ? `<div class="row"><span>Diskon</span><span>-${formatCurrency(tx.discount)}</span></div>` : ""}
        ${tx.tax > 0 ? `<div class="row"><span>PPN</span><span>${formatCurrency(tx.tax)}</span></div>` : ""}
        <div class="row grand"><span>TOTAL</span><span>${formatCurrency(tx.total)}</span></div>
        <div class="row" style="margin-top:8px"><span>Metode Bayar</span><span>${tx.paymentMethod}</span></div>
        <div class="row"><span>Dibayar</span><span>${formatCurrency(tx.amountPaid)}</span></div>
      </div>
      ${s.customNotes ? `<p style="margin-top:32px;font-size:12px;color:#475569">${s.customNotes}</p>` : ""}
      <div class="sign">
        <div>Hormat Kami,<br/><br/>${s.storeName}</div>
        <div>Penerima,<br/><br/>${tx.customer || "________"}</div>
      </div>
    </div>
    <script>setTimeout(()=>window.print(),200);</script>
    </body></html>`,
    900,
    1100,
  );
}

export function printByType(
  type: ReceiptType,
  tx: Transaction,
  s: StoreSettings,
) {
  if (type === "nota") printNota(tx, s);
  else if (type === "resi") printResi(tx, s);
  else printInvoice(tx, s);
}

export const printReceipt = printNota;

// Build a plain text receipt for sharing via WhatsApp
export function buildReceiptText(tx: Transaction, s: StoreSettings) {
  const lines: string[] = [];
  lines.push(`*${s.storeName}*`);
  if (s.address) lines.push(s.address);
  lines.push("--------------------------------");
  lines.push(`Invoice: ${tx.id}`);
  lines.push(`Tanggal: ${formatDate(tx.date)}`);
  lines.push(`Customer: ${tx.customer || "-"}`);
  lines.push("--------------------------------");
  tx.items.forEach((i) => {
    lines.push(`${i.name} x${i.qty}  ${formatCurrency(i.price * i.qty)}`);
  });
  lines.push("--------------------------------");
  lines.push(`Subtotal : ${formatCurrency(tx.subtotal)}`);
  if (tx.discount) lines.push(`Diskon   : -${formatCurrency(tx.discount)}`);
  if (tx.loyaltyDiscount) lines.push(`Poin     : -${formatCurrency(tx.loyaltyDiscount)}`);
  if (tx.tax) lines.push(`Pajak    : ${formatCurrency(tx.tax)}`);
  lines.push(`*TOTAL    : ${formatCurrency(tx.total)}*`);
  lines.push(`Bayar    : ${formatCurrency(tx.amountPaid)} (${tx.paymentMethod})`);
  if (tx.change) lines.push(`Kembali  : ${formatCurrency(tx.change)}`);
  lines.push("--------------------------------");
  if (tx.pointsEarned) lines.push(`+${tx.pointsEarned} poin loyalty 🎉`);
  lines.push(s.customNotes || "Terima kasih!");
  return lines.join("\n");
}
