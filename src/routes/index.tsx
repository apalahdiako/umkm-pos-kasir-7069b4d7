import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingCart, TrendingUp, Package, Plus, History, Settings as SettingsIcon } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency, useProducts, useTransactions } from "@/lib/nota-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nota Pro" },
      { name: "description", content: "Kelola bisnis UMKM Anda dengan mudah." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [products] = useProducts();
  const [transactions] = useTransactions();
  const totalSales = transactions.reduce((s, t) => s + t.total, 0);

  const stats = [
    { label: "Total Transaksi", value: transactions.length, icon: ShoppingCart, accent: "border-blue-500", iconColor: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Penjualan", value: formatCurrency(totalSales), icon: TrendingUp, accent: "border-green-500", iconColor: "text-green-600", bg: "bg-green-50" },
    { label: "Total Produk", value: products.length, icon: Package, accent: "border-purple-500", iconColor: "text-purple-600", bg: "bg-purple-50" },
  ];

  const actions = [
    { to: "/transaction", label: "Buat Transaksi Baru", icon: Plus, gradient: "from-blue-600 to-blue-500" },
    { to: "/history", label: "Lihat Riwayat", icon: History, gradient: "from-green-600 to-green-500" },
    { to: "/products", label: "Kelola Produk", icon: Package, gradient: "from-purple-600 to-purple-500" },
    { to: "/settings", label: "Pengaturan", icon: SettingsIcon, gradient: "from-orange-600 to-orange-500" },
  ] as const;

  return (
    <AppLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Kelola bisnis Anda dengan mudah</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white shadow-md rounded-lg p-6 border-l-4 ${s.accent}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
              </div>
              <div className={`${s.bg} ${s.iconColor} p-3 rounded-lg`}>
                <s.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </AppLayout>
  );
}
