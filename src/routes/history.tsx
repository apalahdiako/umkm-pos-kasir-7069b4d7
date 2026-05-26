import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Printer, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  formatCurrency,
  formatDate,
  printReceipt,
  useStoreSettings,
  useTransactions,
  type Transaction,
} from "@/lib/nota-store";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Riwayat Transaksi — Nota Pro" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [transactions] = useTransactions();
  const [settings] = useStoreSettings();
  const [selected, setSelected] = useState<Transaction | null>(null);

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Riwayat Transaksi</h1>
        <p className="text-slate-600 mt-1">Semua transaksi yang sudah dibuat</p>
      </header>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    Belum ada transaksi
                  </td>
                </tr>
              )}
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-blue-600">{t.id}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(t.date)}</td>
                  <td className="px-4 py-3 text-slate-700">{t.customer}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(t.total)}
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
                        onClick={() => printReceipt(t, settings)}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 p-1.5 rounded"
                        title="Cetak"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
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
            <p className="text-sm mb-3">
              <span className="text-slate-600">Customer: </span>
              <span className="font-medium">{selected.customer}</span>
            </p>
            <div className="border-t border-b border-slate-200 py-3 space-y-2">
              {selected.items.map((i) => (
                <div key={i.productId} className="flex justify-between text-sm">
                  <span>
                    {i.name} <span className="text-slate-400">× {i.qty}</span>
                  </span>
                  <span className="font-medium">{formatCurrency(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-slate-600">Total</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(selected.total)}</span>
            </div>
            <button
              onClick={() => printReceipt(selected, settings)}
              className="mt-5 w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" /> Cetak Resi
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
