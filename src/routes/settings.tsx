import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useStoreSettings } from "@/lib/nota-store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — Nota Pro" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useStoreSettings();
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(settings), [settings]);

  const save = () => {
    setSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Pengaturan</h1>
        <p className="text-slate-600 mt-1">Konfigurasi informasi toko Anda</p>
      </header>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Toko</label>
            <input
              value={draft.storeName}
              onChange={(e) => setDraft({ ...draft, storeName: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Telepon</label>
            <input
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Toko</label>
            <textarea
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={save}
          className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
        >
          {saved ? "✓ Tersimpan" : "Simpan Pengaturan"}
        </button>
      </div>

      <div className="mt-6 bg-slate-100 border border-slate-200 rounded-lg p-5 max-w-2xl text-sm text-slate-600">
        <p><span className="font-semibold text-slate-800">Nota Pro</span> v1.0</p>
        <p className="mt-1">Tech Stack: React · TanStack Start · Tailwind CSS · Lucide Icons</p>
        <p className="mt-1">© {new Date().getFullYear()} — Dibuat untuk UMKM Indonesia</p>
      </div>
    </AppLayout>
  );
}
