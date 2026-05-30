import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency, useStoreSettings, useTransactions } from "@/lib/nota-store";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Laporan — Nota Pro" }] }),
  component: ReportsPage,
});

type Period = "today" | "7d" | "30d" | "all";

function ReportsPage() {
  const [transactions] = useTransactions();
  const [settings] = useStoreSettings();
  const [period, setPeriod] = useState<Period>("7d");


  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      if (period === "all") return true;
      const d = new Date(t.date);
      const diff = (now.getTime() - d.getTime()) / 86400000;
      if (period === "today") return d.toDateString() === now.toDateString();
      if (period === "7d") return diff <= 7;
      if (period === "30d") return diff <= 30;
      return true;
    });
  }, [transactions, period]);

  const totalSum = filtered.reduce((s, t) => s + (t.total || 0), 0);
  const itemCount = filtered.reduce(
    (s, t) => s + t.items.reduce((a, i) => a + i.qty, 0),
    0,
  );
  const avg = filtered.length ? totalSum / filtered.length : 0;
  const discountSum = filtered.reduce((s, t) => s + (t.discount || 0), 0);

  // Chart data: sales per day (last N days based on period)
  const days = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 30;
  const dayMap: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  filtered.forEach((t) => {
    const k = (t.date || "").slice(0, 10);
    if (k in dayMap) dayMap[k] += t.total || 0;
  });
  const chartData = Object.entries(dayMap);
  const maxChart = Math.max(1, ...chartData.map(([, v]) => v));

  // Top products
  const productMap = new Map<string, { name: string; qty: number; total: number }>();
  filtered.forEach((t) => {
    t.items.forEach((i) => {
      const cur = productMap.get(i.name) || { name: i.name, qty: 0, total: 0 };
      cur.qty += i.qty;
      cur.total += i.qty * i.price;
      productMap.set(i.name, cur);
    });
  });
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  const exportCSV = () => {
    const header = "ID,Tanggal,Customer,Metode,Subtotal,Diskon,Pajak,Total,Status\n";
    const rows = filtered
      .map(
        (t) =>
          `${t.id},${t.date},${(t.customer || "").replace(/,/g, " ")},${t.paymentMethod || ""},${
            t.subtotal || 0
          },${t.discount || 0},${t.tax || 0},${t.total},${t.status || "completed"}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-nota-pro-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <header className="mb-6 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Laporan & Analitik</h1>
          <p className="text-slate-600 mt-1">Ringkasan penjualan & produk terlaris</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="bg-white border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Printer className="h-4 w-4" /> Cetak
          </button>
        </div>
      </header>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {(["today", "7d", "30d", "all"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${
              period === p ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {p === "today" ? "Hari Ini" : p === "7d" ? "7 Hari" : p === "30d" ? "30 Hari" : "Semua"}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Total Transaksi" value={String(filtered.length)} />
        <Stat label="Total Penjualan" value={formatCurrency(totalSum)} />
        <Stat label="Item Terjual" value={String(itemCount)} />
        <Stat label="Rata-rata / Transaksi" value={formatCurrency(avg)} />
      </section>

      {/* Laba/Rugi Cerdas */}
      {(() => {
        const omset = totalSum;
        const hpp = filtered.reduce((s, t) => s + (t.hppTotal || 0), 0);
        const labaKotor = omset - hpp;
        const days = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : Math.max(1, filtered.length ? Math.ceil((Date.now() - new Date(filtered[filtered.length - 1].date).getTime()) / 86400000) : 1);
        const fixedCost = (settings.dailyRent + settings.dailyUtilities) * days;
        const labaBersih = labaKotor - fixedCost;
        const margin = omset > 0 ? (labaBersih / omset) * 100 : 0;
        return (
          <section className="bg-white rounded-lg shadow-md p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900">Laba / Rugi Cerdas</h2>
              <span className="text-xs text-slate-500">Periode {days} hari</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <PLBox label="Omset Kotor" value={formatCurrency(omset)} color="text-slate-900" />
              <PLBox label="HPP" value={`- ${formatCurrency(hpp)}`} color="text-orange-600" />
              <PLBox label="Laba Kotor" value={formatCurrency(labaKotor)} color="text-blue-600" />
              <PLBox label={`Sewa+Listrik (${days}h)`} value={`- ${formatCurrency(fixedCost)}`} color="text-orange-600" />
              <PLBox
                label="Laba Bersih"
                value={formatCurrency(labaBersih)}
                color={labaBersih >= 0 ? "text-green-600" : "text-red-600"}
              />
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Margin bersih: <b className={labaBersih >= 0 ? "text-green-700" : "text-red-700"}>{margin.toFixed(1)}%</b>
              {(settings.dailyRent + settings.dailyUtilities) === 0 && (
                <span className="ml-2 text-amber-600">· Atur biaya harian di Pengaturan untuk laba bersih akurat</span>
              )}
            </p>
          </section>
        );
      })()}



      <section className="bg-white rounded-lg shadow-md p-5 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Grafik Penjualan</h2>
        {chartData.every(([, v]) => v === 0) ? (
          <p className="text-sm text-slate-500 text-center py-8">Belum ada data</p>
        ) : (
          <div className="flex items-end gap-1 h-40 border-b border-slate-200 pb-1">
            {chartData.map(([day, val]) => (
              <div key={day} className="flex-1 flex flex-col items-center justify-end group min-w-0">
                <div
                  className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all"
                  style={{ height: `${(val / maxChart) * 100}%` }}
                  title={`${day}: ${formatCurrency(val)}`}
                />
              </div>
            ))}
          </div>
        )}
        {chartData.length > 0 && (
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>{chartData[0][0].slice(5)}</span>
            <span>{chartData[chartData.length - 1][0].slice(5)}</span>
          </div>
        )}
        <p className="text-xs text-slate-500 mt-2">
          Total diskon diberikan: <b>{formatCurrency(discountSum)}</b>
        </p>
      </section>

      <section className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="font-semibold text-slate-900 px-5 py-4 border-b border-slate-100">
          Produk Terlaris (Top 10)
        </h2>
        {topProducts.length === 0 ? (
          <p className="p-6 text-center text-slate-500 text-sm">Belum ada data</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">#</th>
                <th className="text-left px-4 py-2 font-medium">Produk</th>
                <th className="text-right px-4 py-2 font-medium">Qty</th>
                <th className="text-right px-4 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, idx) => (
                <tr key={p.name} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-700">{idx + 1}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-2 text-right">{p.qty}</td>
                  <td className="px-4 py-2 text-right font-semibold">{formatCurrency(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <p className="text-xs text-slate-600">{label}</p>
      <p className="text-lg font-bold text-slate-900 mt-1 truncate">{value}</p>
    </div>
  );
}
