import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, Trash2, Wallet, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useStoreSettings, type PaymentMethod } from "@/lib/nota-store";
import { useServerFn } from "@tanstack/react-start";
import { getDanaProfile, updateDanaProfile, type DanaProfile } from "@/lib/dana.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — Nota Pro" }] }),
  component: SettingsPage,
});

const ALL_METHODS: PaymentMethod[] = ["Tunai", "Kartu", "Transfer", "QRIS", "DANA"];

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

  const handleLogo = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setDraft({ ...draft, logo: (e.target?.result as string) || null });
    reader.readAsDataURL(file);
  };

  const toggleMethod = (m: PaymentMethod) => {
    const has = draft.paymentMethods.includes(m);
    setDraft({
      ...draft,
      paymentMethods: has ? draft.paymentMethods.filter((x) => x !== m) : [...draft.paymentMethods, m],
    });
  };

  return (
    <AppLayout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Pengaturan</h1>
        <p className="text-slate-600 mt-1">Konfigurasi toko, logo, pajak, dan struk</p>
      </header>

      <div className="space-y-6 max-w-3xl">
        {/* LOGO */}
        <Card title="Logo Toko">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleLogo(e.dataTransfer.files?.[0] || null);
            }}
            className="block border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50"
          >
            {draft.logo ? (
              <img src={draft.logo} alt="Logo" className="mx-auto max-h-40 rounded" />
            ) : (
              <div className="text-slate-500 flex flex-col items-center gap-2">
                <Upload className="h-6 w-6" />
                <span className="text-sm">Klik atau drag file untuk upload logo</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogo(e.target.files?.[0] || null)}
            />
          </label>
          {draft.logo && (
            <button
              onClick={() => setDraft({ ...draft, logo: null })}
              className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" /> Hapus Logo
            </button>
          )}
        </Card>

        {/* STORE INFO */}
        <Card title="Informasi Toko">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nama Toko">
              <Input value={draft.storeName} onChange={(v) => setDraft({ ...draft, storeName: v })} />
            </Field>
            <Field label="Nomor Telepon">
              <Input value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
            </Field>
            <Field label="Email">
              <Input value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
            </Field>
            <Field label="Kota">
              <Input value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Alamat">
                <textarea
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <Field label="NPWP / NIB (opsional)">
              <Input value={draft.npwp} onChange={(v) => setDraft({ ...draft, npwp: v })} />
            </Field>
          </div>
        </Card>

        {/* TAX */}
        <Card title="Pengaturan Pajak">
          <label className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={draft.taxEnabled}
              onChange={(e) => setDraft({ ...draft, taxEnabled: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm">Terapkan pajak otomatis</span>
          </label>
          <Field label="Persentase Pajak (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={draft.taxPercentage}
              onChange={(e) => setDraft({ ...draft, taxPercentage: Number(e.target.value) || 0 })}
              disabled={!draft.taxEnabled}
              className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </Field>
        </Card>

        {/* PAYMENT METHODS */}
        <Card title="Metode Pembayaran">
          <div className="grid grid-cols-2 gap-2">
            {ALL_METHODS.map((m) => (
              <label key={m} className="flex items-center gap-2 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={draft.paymentMethods.includes(m)}
                  onChange={() => toggleMethod(m)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{m}</span>
              </label>
            ))}
          </div>
        </Card>

        <DanaCard />


        {/* RECEIPT */}
        <Card title="Kustomisasi Struk">
          <label className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={draft.showLogoInReceipt}
              onChange={(e) => setDraft({ ...draft, showLogoInReceipt: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm">Tampilkan logo di struk</span>
          </label>
          <label className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              checked={draft.showTaxNumberInReceipt}
              onChange={(e) => setDraft({ ...draft, showTaxNumberInReceipt: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm">Tampilkan NPWP di struk</span>
          </label>
          <Field label="Catatan / Footer Custom">
            <textarea
              value={draft.customNotes}
              onChange={(e) => setDraft({ ...draft, customNotes: e.target.value })}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </Field>
        </Card>

        <button
          onClick={save}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
        >
          {saved ? "✓ Tersimpan" : "Simpan Pengaturan"}
        </button>
      </div>
    </AppLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <h2 className="font-semibold text-slate-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
    />
  );
}
