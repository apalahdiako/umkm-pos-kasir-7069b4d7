import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  History,
  Settings as SettingsIcon,
  BarChart3,
  Clock,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import {
  formatCurrency,
  formatDate,
  useProducts,
  useStoreSettings,
  useTransactions,
} from "@/lib/nota-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BY.UMKMKASIR" },
      { name: "description", content: "Kasir & invoicing lengkap untuk UMKM." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [products] = useProducts();
  const [transactions] = useTransactions();
  const [settings] = useStoreSettings();

  const today = new Date().toISOString().slice(0, 10);
  const todayTxs = transactions.filter((t) => (t.date || "").slice(0, 10) === today);
  const todayTotal = todayTxs.reduce((s, t) => s + (t.total || 0), 0);
  const pending = transactions.filter((t) => t.status === "pending").length;
  const inStock = products.filter((p) => p.stock > 0).length;
  const recent = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  const stats = [
    { label: "Transaksi Hari Ini", value: todayTxs.length, icon: ShoppingCart, color: "blue" },
    { label: "Penjualan Hari Ini", value: formatCurrency(todayTotal), icon: TrendingUp, color: "green" },
    { label: "Stok Produk", value: inStock, icon: Package, color: "purple" },
    { label: "Pending", value: pending, icon: Clock, color: "orange" },
  ] as const;

  const actions = [
    { to: "/transaction", label: "Mulai Kasir", icon: ShoppingCart, gradient: "from-blue-600 to-blue-500" },
    { to: "/history", label: "Riwayat Transaksi", icon: History, gradient: "from-slate-700 to-slate-600" },
    { to: "/products", label: "Kelola Produk", icon: Package, gradient: "from-purple-600 to-purple-500" },
    { to: "/settings", label: "Pengaturan", icon: SettingsIcon, gradient: "from-orange-600 to-orange-500" },
  ] as const;

  return (
    <AppLayout>
      <header className="mb-8 flex items-center gap-4 flex-wrap">
        {settings.logo && (
          <img src={settings.logo} alt="Logo" className="h-14 w-14 rounded-lg object-cover bg-white shadow" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-slate-900">Selamat datang!</h1>
          <p className="text-slate-600 mt-1">{settings.storeName}</p>
        </div>
        <Link
          to="/reports"
          className="bg-white shadow border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50"
        >
          <BarChart3 className="h-4 w-4" /> Lihat Laporan
        </Link>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white shadow-md rounded-lg p-4 border-l-4 border-${s.color}-500`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs text-slate-600">{s.label}</p>
                <p className="text-lg md:text-2xl font-bold text-slate-900 mt-1 truncate">{s.value}</p>
              </div>
              <div className={`bg-${s.color}-50 text-${s.color}-600 p-2.5 rounded-lg`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className={`bg-gradient-to-r ${a.gradient} text-white rounded-lg py-5 px-6 flex items-center gap-3 shadow-md hover:shadow-lg hover:opacity-95 transition`}
          >
            <a.icon className="h-5 w-5" />
            <span className="font-semibold">{a.label}</span>
          </Link>
        ))}
      </section>

      <section className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="font-semibold text-slate-900 px-5 py-4 border-b border-slate-100">
          Aktivitas Terkini
        </h2>
        {recent.length === 0 ? (
          <p className="p-6 text-center text-slate-500 text-sm">Belum ada transaksi</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">ID</th>
                <th className="text-left px-4 py-2 font-medium">Waktu</th>
                <th className="text-left px-4 py-2 font-medium">Customer</th>
                <th className="text-right px-4 py-2 font-medium">Total</th>
                <th className="text-center px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-semibold text-blue-600">{t.id}</td>
                  <td className="px-4 py-2 text-slate-700">{formatDate(t.date)}</td>
                  <td className="px-4 py-2 text-slate-700">{t.customer}</td>
                  <td className="px-4 py-2 text-right font-semibold">{formatCurrency(t.total)}</td>
                  <td className="px-4 py-2 text-center">
                    <StatusBadge status={t.status || "completed"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
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
