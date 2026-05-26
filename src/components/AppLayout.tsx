import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingCart, History, Package, Settings as SettingsIcon } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/transaction", label: "Buat Transaksi", icon: ShoppingCart },
  { to: "/history", label: "Riwayat", icon: History },
  { to: "/products", label: "Produk", icon: Package },
  { to: "/settings", label: "Pengaturan", icon: SettingsIcon },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-64 shrink-0 flex-col bg-slate-900 text-slate-100 p-4">
          <div className="px-2 py-4">
            <h1 className="text-2xl font-bold">Nota Pro</h1>
            <p className="text-xs text-slate-400">UMKM Invoice System</p>
          </div>
          <nav className="mt-4 flex flex-col gap-1">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top nav */}
          <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-bold">Nota Pro</h1>
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
