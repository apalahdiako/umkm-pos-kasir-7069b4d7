import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Printer, X, Search, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  formatCurrency,
  formatDate,
  printNota,
  printResi,
  printInvoice,
  useStoreSettings,
  useTransactions,
  type Transaction,
} from "@/lib/nota-store";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Riwayat Transaksi — Nota Pro" }] }),
  component: HistoryPage,
});

type Period = "all" | "today" | "week" | "month";

function HistoryPage() {
  const [transactions, setTransactions] = useTransactions();
  const [settings] = useStoreSettings();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      if (search && !`${t.id} ${t.customer}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (status !== "all" && (t.status || "completed") !== status) return false;
      if (period !== "all") {
        const d = new Date(t.date);
        if (period === "today" && d.toDateString() !== now.toDateString()) return false;
        if (period === "week") {
          const diff = (now.getTime() - d.getTime()) / 86400000;
          if (diff > 7) return false;
        }
        if (period === "month" && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()))
          return false;
      }
      return true;
    });
  }, [transactions, search, period, status]);

  const totalSum = filtered.reduce((s, t) => s + (t.total || 0), 0);
  const avg = filtered.length ? totalSum / filtered.length : 0;

  const remove = (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    setTransactions(transactions.filter((t) => t.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Riwayat Transaksi</h1>
        <p className="text-slate-600 mt-1">Kelola & cetak ulang semua transaksi</p>
      </header>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {(["all", "today", "week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-full ${
                period === p ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {p === "all" ? "Semua" : p === "today" ? "Hari Ini" : p === "week" ? "7 Hari" : "Bulan Ini"}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID atau customer..."
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Semua Status</option>
            <option value="completed">Paid</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Waktu</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Tidak ada transaksi
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-blue-600">{t.id}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(t.date)}</td>
                  <td className="px-4 py-3 text-slate-700">{t.customer}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(t.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={t.status || "completed"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setSelected(t)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1.5 rounded"
                        title="Lihat"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => printNota(t, settings)}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 p-1.5 rounded"
                        title="Cetak Nota"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(t.id)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 p-1.5 rounded"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Total Transaksi" value={String(filtered.length)} />
        <Stat label="Total Penjualan" value={formatCurrency(totalSum)} />
        <Stat label="Rata-rata" value={formatCurrency(avg)} />
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-blue-600">{selected.id}</h2>
                <p className="text-sm text-slate-500">{formatDate(selected.date)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm mb-1">
              <span className="text-slate-600">Customer: </span>
              <span className="font-medium">{selected.customer}</span>
            </p>
            <p className="text-sm mb-3">
              <span className="text-slate-600">Metode: </span>
              <span className="font-medium">{selected.paymentMethod || "—"}</span>
            </p>
            <div className="border-t border-b border-slate-200 py-3 space-y-2">
              {selected.items.map((i) => (
                <div key={i.productId} className="flex justify-between text-sm">
                  <span>{i.name} <span className="text-slate-400">× {i.qty}</span></span>
                  <span className="font-medium">{formatCurrency(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <Row label="Subtotal" value={formatCurrency(selected.subtotal || selected.total)} />
              {(selected.discount || 0) > 0 && (
                <Row label="Diskon" value={`-${formatCurrency(selected.discount)}`} />
              )}
              {(selected.tax || 0) > 0 && <Row label="Pajak" value={formatCurrency(selected.tax)} />}
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-semibold">TOTAL</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(selected.total)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                onClick={() => printNota(selected, settings)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-semibold"
              >
                Nota
              </button>
              <button
                onClick={() => printResi(selected, settings)}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-xs font-semibold"
              >
                Resi
              </button>
              <button
                onClick={() => printInvoice(selected, settings)}
                className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs font-semibold"
              >
                Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const label: Record<string, string> = {
    completed: "Paid",
    pending: "Pending",
    cancelled: "Cancelled",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${map[status] || "bg-slate-100 text-slate-700"}`}>
      {label[status] || status}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <p className="text-xs text-slate-600">{label}</p>
      <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}
