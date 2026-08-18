import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, ShoppingCart, History, Package, Settings as SettingsIcon,
  BarChart3, Wallet, Users, BookOpen, Store, Wifi, WifiOff, LogIn, LogOut,
  Utensils, FileText, Calculator, Banknote, Boxes, UserCheck, Landmark, HeartHandshake,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useStoreSettings, useTransactions, formatCurrency } from "@/lib/nota-store";
import { useAuth } from "@/lib/auth-context";

const nav = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/transaction", label: "Kasir (POS)", icon: ShoppingCart },
  { to: "/tables", label: "Meja (F&B)", icon: Utensils },
  { to: "/invoices", label: "Invoice B2B", icon: FileText },
  { to: "/hpp", label: "HPP Calculator", icon: Calculator },
  { to: "/inventory", label: "Inventory & Stok", icon: Boxes },
  { to: "/crm", label: "CRM & Loyalty", icon: HeartHandshake },
  { to: "/employees", label: "Karyawan & Shift", icon: UserCheck },
  { to: "/accounting", label: "Akuntansi", icon: Landmark },
  { to: "/payments", label: "Pembayaran (Flip)", icon: Banknote },
  { to: "/history", label: "Riwayat", icon: History },
  { to: "/products", label: "Produk", icon: Package },
  { to: "/ledger", label: "Mutasi Saldo", icon: Wallet },
  { to: "/kasbon", label: "Kasbon", icon: BookOpen },
  { to: "/members", label: "Member", icon: Users },
  { to: "/reports", label: "Laporan", icon: BarChart3 },
  { to: "/catalog", label: "Toko Online", icon: Store },
  { to: "/settings", label: "Pengaturan", icon: SettingsIcon },
] as const;


function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const upd = () => setOnline(navigator.onLine);
    upd();
    window.addEventListener("online", upd);
    window.addEventListener("offline", upd);
    return () => {
      window.removeEventListener("online", upd);
      window.removeEventListener("offline", upd);
    };
  }, []);
  return online;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [settings] = useStoreSettings();
  const [transactions] = useTransactions();
  const online = useOnline();
  const today = new Date().toISOString().slice(0, 10);
  const todayTxs = transactions.filter((t) => (t.date || "").slice(0, 10) === today);
  const todayTotal = todayTxs.reduce((s, t) => s + (t.total || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-64 shrink-0 flex-col bg-slate-900 text-slate-100 p-4">
          <div className="px-2 py-4 flex items-center gap-3">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="h-10 w-10 rounded object-cover bg-white" />
            ) : (
              <div className="h-10 w-10 rounded bg-blue-600 flex items-center justify-center font-bold">NP</div>
            )}
            <div>
              <h1 className="text-lg font-bold leading-tight">BY.UMKMKASIR</h1>
              <p className="text-[10px] text-slate-400">v3.0 · UMKM</p>
            </div>
          </div>
          <div className={`mx-2 mb-2 text-[10px] font-medium px-2 py-1 rounded inline-flex items-center gap-1 w-fit ${online ? "bg-green-900/40 text-green-300" : "bg-orange-900/40 text-orange-300"}`}>
            {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {online ? "Online" : "Offline — sync pending"}
          </div>
          <nav className="mt-2 flex flex-col gap-0.5 overflow-y-auto">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-slate-800 pt-4 px-2 text-xs text-slate-400">
            <p>Hari ini</p>
            <p className="text-white font-semibold text-sm">{formatCurrency(todayTotal)}</p>
            <p>{todayTxs.length} transaksi</p>
            <UserBox />
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center gap-2">
            {settings.logo && <img src={settings.logo} alt="Logo" className="h-7 w-7 rounded object-cover bg-white" />}
            <h1 className="text-lg font-bold flex-1">BY.UMKMKASIR</h1>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${online ? "bg-green-700" : "bg-orange-700"}`}>
              {online ? "Online" : "Offline"}
            </span>
          </header>
          <nav className="md:hidden bg-slate-800 text-slate-200 overflow-x-auto flex gap-1 px-2 py-2 text-xs">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 whitespace-nowrap ${
                    active ? "bg-blue-600 text-white" : "hover:bg-slate-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 p-4 md:p-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function UserBox() {
  const { user, roles, signOut } = useAuth();
  if (!user) {
    return (
      <Link to="/login" className="mt-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-xs font-medium">
        <LogIn className="h-3.5 w-3.5" /> Masuk / Daftar
      </Link>
    );
  }
  return (
    <div className="mt-3 border-t border-slate-800 pt-3">
      <p className="text-white text-xs font-medium truncate">{user.email}</p>
      <p className="text-[10px] text-blue-300 uppercase">{roles[0] ?? "user"}</p>
      <button onClick={signOut} className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white">
        <LogOut className="h-3 w-3" /> Keluar
      </button>
    </div>
  );
}
