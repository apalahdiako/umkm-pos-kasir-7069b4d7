import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, Trash2, Wallet, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useStoreSettings, type PaymentMethod } from "@/lib/nota-store";
import { useServerFn } from "@tanstack/react-start";
import { getDanaProfile, updateDanaProfile, type DanaProfile } from "@/lib/dana.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Pengaturan — BY.UMKMKASIR" }] }),
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

function DanaCard() {
  const fetchDana = useServerFn(getDanaProfile);
  const saveDana = useServerFn(updateDanaProfile);
  const [state, setState] = useState<DanaProfile>({
    dana_number: "",
    dana_holder_name: "",
    dana_qr_url: "",
    dana_active: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDana()
      .then((d) =>
        setState({
          dana_number: d.dana_number ?? "",
          dana_holder_name: d.dana_holder_name ?? "",
          dana_qr_url: d.dana_qr_url ?? "",
          dana_active: d.dana_active,
        }),
      )
      .catch((e) => setError(e?.message ?? "Gagal memuat"))
      .finally(() => setLoading(false));
  }, [fetchDana]);

  const uploadQr = async (file: File | null) => {
    if (!file) return;
    setError("");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return setError("Belum login");
    const path = `${u.user.id}/dana-qr-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error: upErr } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return setError(upErr.message);
    const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
    setState((s) => ({ ...s, dana_qr_url: pub.publicUrl }));
  };

  const onSave = async () => {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      await saveDana({ data: state });
      setSavedMsg("✓ Akun DANA tersimpan");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-5 w-5 text-blue-600" />
        <h2 className="font-semibold text-slate-900">Akun DANA Merchant</h2>
        {state.dana_active && state.dana_number && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> Aktif
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Simpan nomor DANA toko + QR statis. Saat customer pilih metode bayar
        <span className="font-medium"> DANA</span>, info ini otomatis tampil di kasir & nota.
      </p>

      {loading ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Nomor DANA (HP terdaftar)">
            <Input
              value={state.dana_number ?? ""}
              onChange={(v) => setState({ ...state, dana_number: v.replace(/\D/g, "") })}
            />
          </Field>
          <Field label="Nama Penerima (sesuai DANA)">
            <Input
              value={state.dana_holder_name ?? ""}
              onChange={(v) => setState({ ...state, dana_holder_name: v })}
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="QR DANA Statis (opsional)">
              <label className="block border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50">
                {state.dana_qr_url ? (
                  <img src={state.dana_qr_url} alt="QR DANA" className="mx-auto max-h-44 rounded" />
                ) : (
                  <div className="text-slate-500 flex flex-col items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">Upload screenshot QR DANA dari aplikasi</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadQr(e.target.files?.[0] || null)}
                />
              </label>
              {state.dana_qr_url && (
                <button
                  onClick={() => setState({ ...state, dana_qr_url: "" })}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Hapus QR
                </button>
              )}
            </Field>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={state.dana_active}
                onChange={(e) => setState({ ...state, dana_active: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm">Aktifkan pembayaran via DANA</span>
            </label>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {savedMsg && <p className="text-sm text-green-600 mt-3">{savedMsg}</p>}

      <button
        onClick={onSave}
        disabled={saving || loading}
        className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
      >
        {saving ? "Menyimpan…" : "Simpan Akun DANA"}
      </button>
    </div>
  );
}

