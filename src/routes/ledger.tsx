import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Download } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  formatCurrency,
  formatDate,
  shortId,
  useLedger,
  useTransactions,
} from "@/lib/nota-store";

export const Route = createFileRoute("/ledger")({
  head: () => ({ meta: [{ title: "Mutasi Saldo — Nota Pro" }] }),
  component: LedgerPage,
});

function LedgerPage() {
  const [ledger, setLedger] = useLedger();
  const [transactions] = useTransactions();
  const [amount, setAmount] = useState(0);
  const [destination, setDestination] = useState("BCA - 1234567890");
  const [filter, setFilter] = useState<"all" | "sale" | "withdrawal" | "fee">("all");

  // Compose entries: auto-derive from transactions + manual ledger entries
  const derivedSales = useMemo(
    () =>
      transactions
        .filter((t) => t.status === "completed")
        .map((t) => ({
          id: `sale-${t.id}`,
          date: t.date,
          type: "sale" as const,
          description: `Penjualan ${t.id} (${t.paymentMethod})`,
          amount: t.total,
          refTxId: t.id,
        })),
    [transactions],
  );

  const allEntries = useMemo(() => {
    const merged = [...derivedSales, ...ledger];
    merged.sort((a, b) => (a.date < b.date ? 1 : -1));
    return merged;
  }, [derivedSales, ledger]);

  const filtered = filter === "all" ? allEntries : allEntries.filter((e) => e.type === filter);

  const balance = allEntries.reduce((s, e) => s + e.amount, 0);
  const totalIn = allEntries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const totalOut = allEntries.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0);

  const withdraw = () => {
    if (amount <= 0) return alert("Nominal harus > 0");
    if (amount > balance) return alert("Saldo tidak cukup");
    const fee = Math.min(2500, Math.round(amount * 0.001));
    setLedger([
      {
        id: shortId("WD"),
        date: new Date().toISOString(),
        type: "withdrawal",
        description: `Tarik tunai ke ${destination}`,
        amount: -amount,
      },
      {
        id: shortId("FEE"),
        date: new Date().toISOString(),
        type: "fee",
        description: `Biaya admin tarik tunai`,
        amount: -fee,
      },
      ...ledger,
    ]);
    setAmount(0);
    alert(`Tarik tunai ${formatCurrency(amount)} berhasil (mockup). Dana cair T+0.`);
  };

  const exportCSV = () => {
    const header = "ID,Tanggal,Tipe,Deskripsi,Jumlah\n";
    const rows = allEntries
      .map((e) => `${e.id},${e.date},${e.type},${e.description.replace(/,/g, " ")},${e.amount}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mutasi-saldo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <header className="mb-6 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mutasi Saldo</h1>
          <p className="text-slate-600 mt-1">Uang masuk, keluar & tarik tunai instan</p>
        </div>
        <button
          onClick={exportCSV}
          className="bg-white border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <Download className="h-4 w-4" /> Export
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <Wallet className="h-4 w-4" /> Saldo Nota Pro
          </div>
          <p className="text-3xl font-bold mt-2">{formatCurrency(balance)}</p>
          <p className="text-xs text-blue-200 mt-1">Tersedia untuk tarik tunai</p>
        </div>
        <Stat icon={ArrowDownCircle} color="green" label="Uang Masuk" value={formatCurrency(totalIn)} />
        <Stat icon={ArrowUpCircle} color="red" label="Uang Keluar" value={formatCurrency(Math.abs(totalOut))} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarik tunai */}
        <div className="bg-white rounded-lg shadow-md p-5 h-fit">
          <h2 className="font-bold text-slate-900 mb-3">Tarik Tunai Instan</h2>
          <p className="text-xs text-slate-500 mb-3">Pencairan T+0 ke bank atau e-wallet</p>
          <label className="text-xs text-slate-600 block">Tujuan</label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1"
          >
            <option>BCA - 1234567890</option>
            <option>Mandiri - 0987654321</option>
            <option>BRI - 1122334455</option>
            <option>GoPay - 08111111111</option>
            <option>OVO - 08222222222</option>
            <option>Dana - 08333333333</option>
          </select>
          <label className="text-xs text-slate-600 block mt-3">Nominal</label>
          <input
            type="number"
            min={0}
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-right text-sm mt-1"
          />
          <div className="text-xs text-slate-500 mt-2">
            Biaya admin: {formatCurrency(Math.min(2500, Math.round(amount * 0.001)))}
          </div>
          <button
            onClick={withdraw}
            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold text-sm"
          >
            Tarik Sekarang
          </button>
        </div>

        {/* Riwayat */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap justify-between gap-2">
            <h2 className="font-bold text-slate-900">Riwayat Mutasi</h2>
            <div className="flex gap-1 text-xs">
              {(["all", "sale", "withdrawal", "fee"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-full ${
                    filter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {f === "all" ? "Semua" : f === "sale" ? "Masuk" : f === "withdrawal" ? "Tarik" : "Biaya"}
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-slate-500 text-sm">Belum ada mutasi</p>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[500px] overflow-auto">
              {filtered.map((e) => (
                <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{e.description}</p>
                    <p className="text-xs text-slate-500">{formatDate(e.date)}</p>
                  </div>
                  <p
                    className={`text-sm font-bold whitespace-nowrap ${
                      e.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {e.amount >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(e.amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

function Stat({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className={`flex items-center gap-2 text-${color}-600 text-sm`}>
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
    </div>
  );
}
