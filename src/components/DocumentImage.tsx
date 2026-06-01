import { forwardRef } from "react";
import { formatCurrency, formatDate, type StoreSettings } from "@/lib/nota-store";

export type DocItem = { name: string; qty: number; price: number };
export type DocData = {
  type: "Nota" | "Invoice" | "Resi" | "Closed Bill";
  docNo: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNo?: string;
  items: DocItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  amountPaid?: number;
  change?: number;
  paymentMethod?: string;
  dueDate?: string;
  status?: string;
  notes?: string;
};

type Props = { data: DocData; settings: StoreSettings };

/** Thermal-style 80mm receipt (Nota / Closed Bill / Resi) */
export const ThermalDoc = forwardRef<HTMLDivElement, Props>(({ data, settings }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: "380px",
        background: "#ffffff",
        color: "#000",
        fontFamily: "'Courier New', monospace",
        padding: "20px",
        fontSize: "13px",
        lineHeight: 1.5,
        boxSizing: "border-box",
      }}
    >
      {settings.showLogoInReceipt && settings.logo && (
        <img src={settings.logo} alt="" crossOrigin="anonymous" style={{ display: "block", margin: "0 auto 8px", maxWidth: 64, maxHeight: 64 }} />
      )}
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 16 }}>{settings.storeName}</div>
      <div style={{ textAlign: "center", fontSize: 11 }}>{settings.address}</div>
      <div style={{ textAlign: "center", fontSize: 11 }}>{settings.phone}</div>
      {settings.showTaxNumberInReceipt && settings.npwp && (
        <div style={{ textAlign: "center", fontSize: 11 }}>NPWP: {settings.npwp}</div>
      )}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ fontWeight: "bold" }}>{data.type.toUpperCase()} {data.docNo}</div>
      <div style={{ fontSize: 11 }}>{formatDate(data.date)}</div>
      {data.customerName && <div style={{ fontSize: 11 }}>Customer: {data.customerName}</div>}
      {data.tableNo && <div style={{ fontSize: 11 }}>Meja: {data.tableNo}</div>}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      {data.items.map((it, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <div>{it.name}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>{it.qty} x {formatCurrency(it.price)}</span>
            <span>{formatCurrency(it.qty * it.price)}</span>
          </div>
        </div>
      ))}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <Row label="Subtotal" value={formatCurrency(data.subtotal)} />
      {!!data.discount && <Row label="Diskon" value={`-${formatCurrency(data.discount)}`} />}
      {!!data.tax && <Row label="Pajak" value={formatCurrency(data.tax)} />}
      <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />
      <Row label="TOTAL" value={formatCurrency(data.total)} bold />
      {data.paymentMethod && <Row label={`Bayar (${data.paymentMethod})`} value={formatCurrency(data.amountPaid || data.total)} />}
      {!!data.change && <Row label="Kembali" value={formatCurrency(data.change)} />}
      {data.status && <div style={{ textAlign: "center", marginTop: 8, fontWeight: "bold", border: "2px solid #000", padding: 4 }}>{data.status}</div>}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ textAlign: "center", fontSize: 11 }}>{settings.customNotes || "Terima kasih!"}</div>
    </div>
  );
});
ThermalDoc.displayName = "ThermalDoc";

/** A4 Invoice for B2B */
export const A4Invoice = forwardRef<HTMLDivElement, Props>(({ data, settings }, ref) => {
  const due = data.dueDate ? new Date(data.dueDate) : null;
  return (
    <div
      ref={ref}
      style={{
        width: "794px",
        minHeight: "1000px",
        background: "#ffffff",
        color: "#0f172a",
        fontFamily: "Arial, sans-serif",
        padding: "48px",
        fontSize: "13px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid #2563eb", paddingBottom: 16 }}>
        <div>
          {settings.showLogoInReceipt && settings.logo && (
            <img src={settings.logo} alt="" crossOrigin="anonymous" style={{ maxHeight: 56, marginBottom: 8 }} />
          )}
          <div style={{ fontWeight: "bold", fontSize: 18 }}>{settings.storeName}</div>
          <div>{settings.address}, {settings.city}</div>
          <div>{settings.phone} · {settings.email}</div>
          {settings.npwp && <div>NPWP: {settings.npwp}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#2563eb" }}>INVOICE</div>
          <div style={{ fontWeight: "bold", marginTop: 4 }}>{data.docNo}</div>
          <div>Tanggal: {new Date(data.date).toLocaleDateString("id-ID")}</div>
          {due && <div>Jatuh tempo: {due.toLocaleDateString("id-ID")}</div>}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", margin: "20px 0" }}>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>Ditagihkan kepada</div>
          <div style={{ fontWeight: "bold", marginTop: 4 }}>{data.customerName || "-"}</div>
          {data.customerPhone && <div>{data.customerPhone}</div>}
          {data.customerEmail && <div>{data.customerEmail}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>Status</div>
          <div style={{
            fontWeight: "bold",
            marginTop: 4,
            color: data.status === "PAID" ? "#16a34a" : "#ea580c",
          }}>{data.status || "OUTSTANDING"}</div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={cellHead}>No</th>
            <th style={{ ...cellHead, textAlign: "left" }}>Deskripsi</th>
            <th style={{ ...cellHead, textAlign: "right" }}>Qty</th>
            <th style={{ ...cellHead, textAlign: "right" }}>Harga</th>
            <th style={{ ...cellHead, textAlign: "right" }}>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, i) => (
            <tr key={i}>
              <td style={cell}>{i + 1}</td>
              <td style={cell}>{it.name}</td>
              <td style={{ ...cell, textAlign: "right" }}>{it.qty}</td>
              <td style={{ ...cell, textAlign: "right" }}>{formatCurrency(it.price)}</td>
              <td style={{ ...cell, textAlign: "right" }}>{formatCurrency(it.qty * it.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginLeft: "auto", width: 280, marginTop: 16 }}>
        <Row label="Subtotal" value={formatCurrency(data.subtotal)} />
        {!!data.discount && <Row label="Diskon" value={`-${formatCurrency(data.discount)}`} />}
        {!!data.tax && <Row label="Pajak" value={formatCurrency(data.tax)} />}
        <div style={{
          display: "flex", justifyContent: "space-between",
          borderTop: "2px solid #0f172a", marginTop: 8, paddingTop: 8,
          fontWeight: "bold", fontSize: 18, color: "#2563eb",
        }}>
          <span>TOTAL</span><span>{formatCurrency(data.total)}</span>
        </div>
      </div>

      {data.notes && (
        <div style={{ marginTop: 32, fontSize: 12, color: "#475569", borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
          <strong>Catatan:</strong> {data.notes}
        </div>
      )}

      <div style={{ marginTop: 40, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
        {settings.customNotes || "Terima kasih atas kepercayaan Anda."}
      </div>
    </div>
  );
});
A4Invoice.displayName = "A4Invoice";

const cell: React.CSSProperties = { border: "1px solid #cbd5e1", padding: 8 };
const cellHead: React.CSSProperties = { ...cell, fontWeight: "bold", textAlign: "center" };

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: bold ? "bold" : "normal", fontSize: bold ? 15 : 13 }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
