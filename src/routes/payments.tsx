import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, RefreshCw, Send, QrCode, Wallet, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { formatCurrency, formatDate } from "@/lib/nota-store";
import {
  createFlipBill, createFlipDisbursement, getFlipBalance,
  listDisbursements, listPaymentRequests, refreshBillStatus,
} from "@/lib/flip.functions";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [
    { title: "Pembayaran & Penarikan — Nota Pro" },
    { name: "description", content: "Terima pembayaran via DANA, GoPay, OVO, ShopeePay, QRIS dan tarik saldo ke bank/e-wallet via Flip." },
  ]}),
  component: PaymentsPage,
});

const BANK_OPTIONS = [
  { code: "bca", label: "BCA" }, { code: "mandiri", label: "Mandiri" },
  { code: "bri", label: "BRI" }, { code: "bni", label: "BNI" }, { code: "cimb", label: "CIMB Niaga" },
  { code: "permata", label: "Permata" }, { code: "bsi", label: "BSI" },
  { code: "dana", label: "DANA (e-wallet)" }, { code: "gopay", label: "GoPay (e-wallet)" },
  { code: "ovo", label: "OVO (e-wallet)" }, { code: "shopeepay", label: "ShopeePay (e-wallet)" },
  { code: "linkaja", label: "LinkAja (e-wallet)" },
];

function PaymentsPage() {
  const [tab, setTab] = useState<"bill" | "withdraw" | "history">("bill");
  const [bills, setBills] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [balance, setBalance] = useState<{ ok: boolean; balance?: number; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const fnListBills = useServerFn(listPaymentRequests);
  const fnListWd = useServerFn(listDisbursements);
  const fnBalance = useServerFn(getFlipBalance);
  const fnCreateBill = useServerFn(createFlipBill);
  const fnCreateWd = useServerFn(createFlipDisbursement);
  const fnRefresh = useServerFn(refreshBillStatus);

  const reload = async () => {
    const [b, w, bal] = await Promise.all([fnListBills(), fnListWd(), fnBalance()]);
    setBills(b); setWithdrawals(w); setBalance(bal);
  };
  useEffect(() => { reload(); }, []);

  // Bill form
  const [bTitle, setBTitle] = useState("Pembayaran pesanan");
  const [bAmount, setBAmount] = useState(50000);
  const [bSender, setBSender] = useState("");
  const [lastLink, setLastLink] = useState<string | null>(null);

  const onCreateBill = async () => {
    setBusy(true);
    try {
      const res = await fnCreateBill({ data: { title: bTitle, amount: bAmount, sender_name: bSender || undefined } });
      setLastLink(res.link_url);
      await reload();
    } catch (e: any) { alert(e?.message || "Gagal membuat bill"); }
    finally { setBusy(false); }
  };

  // Withdraw form
  const [wBank, setWBank] = useState("dana");
  const [wAcc, setWAcc] = useState("");
  const [wAmount, setWAmount] = useState(50000);
  const [wName, setWName] = useState("");
  const [wRemark, setWRemark] = useState("Tarik saldo");

  const onWithdraw = async () => {
    if (!wAcc) return alert("Nomor rekening/HP wajib diisi");
    if (wAmount < 10000) return alert("Minimum penarikan Rp 10.000");
    if (!confirm(`Tarik ${formatCurrency(wAmount)} ke ${wBank.toUpperCase()} ${wAcc}?`)) return;
    setBusy(true);
    try {
      await fnCreateWd({ data: {
        bank_code: wBank, account_number: wAcc, amount: wAmount,
        recipient_name: wName || undefined, remark: wRemark,
      }});
      alert("Penarikan dikirim. Status akan terupdate via webhook.");
      setWAcc(""); setWName("");
      await reload();
    } catch (e: any) { alert(e?.message || "Penarikan gagal"); }
    finally { setBusy(false); }
  };

  return (
    <AppLayout>
      <header className="mb-6 flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pembayaran & Penarikan</h1>
          <p className="text-slate-600 mt-1">Terima DANA, GoPay, OVO, ShopeePay, QRIS &amp; tarik via Flip for Business</p>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-5 py-3 shadow">
          <div className="flex items-center gap-2 text-blue-100 text-xs"><Wallet className="h-4 w-4" /> Saldo Flip</div>
          <p className="text-2xl font-bold">
            {balance?.ok ? formatCurrency(balance.balance || 0) : "—"}
          </p>
          {balance && !balance.ok && (
            <p className="text-[11px] text-red-200 mt-0.5 max-w-[260px] truncate" title={balance.error}>{balance.error}</p>
          )}
        </div>
      </header>

      <div className="flex gap-1 mb-4 text-sm">
        {[
          { k: "bill", l: "Terima Pembayaran" },
          { k: "withdraw", l: "Tarik Saldo" },
          { k: "history", l: "Riwayat" },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            className={`px-4 py-2 rounded-lg ${tab === t.k ? "bg-blue-600 text-white" : "bg-white border border-slate-200 hover:bg-slate-50"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "bill" && (
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold mb-3 flex items-center gap-2"><QrCode className="h-5 w-5 text-blue-600" /> Buat Tagihan</h2>
            <label className="text-xs text-slate-600">Judul</label>
            <input value={bTitle} onChange={(e) => setBTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3 mt-1" />
            <label className="text-xs text-slate-600">Nominal (Rp)</label>
            <input type="number" min={1000} value={bAmount || ""}
              onChange={(e) => setBAmount(Number(e.target.value) || 0)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3 mt-1 text-right" />
            <label className="text-xs text-slate-600">Nama Pengirim (opsional)</label>
            <input value={bSender} onChange={(e) => setBSender(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 mt-1" />
            <button onClick={onCreateBill} disabled={busy || bAmount < 1000}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-semibold text-sm">
              {busy ? "Membuat..." : "Buat Link Pembayaran"}
            </button>
            <p className="text-[11px] text-slate-500 mt-3">
              Customer bisa bayar via DANA, OVO, ShopeePay, LinkAja, GoPay (QRIS), kartu debit, VA bank, atau retail (Alfamart/Indomaret).
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold mb-3">Link Terakhir</h2>
            {lastLink ? (
              <div className="space-y-3">
                <div className="bg-slate-50 border rounded-lg p-3 break-all text-xs">{lastLink}</div>
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(lastLink); alert("Tersalin"); }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                    <Copy className="h-4 w-4" /> Salin
                  </button>
                  <a href={lastLink} target="_blank" rel="noreferrer"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                    <ExternalLink className="h-4 w-4" /> Buka
                  </a>
                  <a href={`https://wa.me/?text=${encodeURIComponent("Silakan bayar di sini: " + lastLink)}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" /> WA
                  </a>
                </div>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(lastLink)}`}
                  alt="QR" className="mx-auto rounded-lg border" />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada link. Buat tagihan dulu di kiri.</p>
            )}
          </div>
        </section>
      )}

      {tab === "withdraw" && (
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold mb-3 flex items-center gap-2"><Send className="h-5 w-5 text-green-600" /> Penarikan Dana</h2>
            <label className="text-xs text-slate-600">Tujuan</label>
            <select value={wBank} onChange={(e) => setWBank(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3 mt-1">
              {BANK_OPTIONS.map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}
            </select>
            <label className="text-xs text-slate-600">Nomor Rekening / HP (e-wallet)</label>
            <input value={wAcc} onChange={(e) => setWAcc(e.target.value.replace(/\D/g, ""))}
              placeholder={wBank === "dana" || wBank === "gopay" || wBank === "ovo" ? "08xxxxxxxxxx" : "Nomor rekening"}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3 mt-1" />
            <label className="text-xs text-slate-600">Nama Penerima (opsional)</label>
            <input value={wName} onChange={(e) => setWName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3 mt-1" />
            <label className="text-xs text-slate-600">Nominal (Rp)</label>
            <input type="number" min={10000} value={wAmount || ""}
              onChange={(e) => setWAmount(Number(e.target.value) || 0)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3 mt-1 text-right" />
            <label className="text-xs text-slate-600">Catatan (max 18 karakter)</label>
            <input value={wRemark} maxLength={18} onChange={(e) => setWRemark(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 mt-1" />
            <button onClick={onWithdraw} disabled={busy}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-semibold text-sm">
              {busy ? "Memproses..." : "Tarik Sekarang"}
            </button>
            <p className="text-[11px] text-slate-500 mt-3">
              Saldo penarikan diambil dari saldo Flip Anda. Pastikan saldo cukup termasuk biaya admin.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold mb-3">Penarikan Terbaru</h2>
            <ul className="divide-y divide-slate-100 max-h-[420px] overflow-auto">
              {withdrawals.length === 0 && <p className="text-sm text-slate-500">Belum ada penarikan.</p>}
              {withdrawals.map((w) => (
                <li key={w.id} className="py-3 flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{w.bank_code?.toUpperCase()} · {w.account_number}</p>
                    <p className="text-xs text-slate-500">{w.recipient_name || "—"} · {formatDate(w.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(Number(w.amount))}</p>
                    <StatusBadge status={w.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === "history" && (
        <section className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-5 py-3 border-b flex justify-between items-center">
            <h2 className="font-bold">Riwayat Tagihan</h2>
            <button onClick={reload} className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[600px] overflow-auto">
            {bills.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Belum ada tagihan.</p>}
            {bills.map((b) => (
              <li key={b.id} className="p-4 flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(b.created_at)} · {b.payment_method || "—"}</p>
                  {b.flip_link_url && (
                    <a href={b.flip_link_url} target="_blank" rel="noreferrer"
                      className="text-[11px] text-blue-600 hover:underline truncate block">{b.flip_link_url}</a>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{formatCurrency(Number(b.amount))}</p>
                  <StatusBadge status={b.status} />
                  {b.status === "PENDING" && (
                    <button onClick={async () => { await fnRefresh({ data: { id: b.id } }); reload(); }}
                      className="text-[11px] text-blue-600 hover:underline mt-1">Cek status</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[11px] text-slate-500 mt-6 max-w-3xl">
        Integrasi via <strong>Flip for Business</strong>. Set secret <code>FLIP_SECRET_KEY</code>, <code>FLIP_VALIDATION_TOKEN</code>, dan opsional <code>FLIP_BASE_URL</code> (default sandbox). Webhook URL: <code>/api/public/flip-webhook</code>.
      </p>
    </AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-green-100 text-green-700", DONE: "bg-green-100 text-green-700",
    SUCCESSFUL: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700",
    FAILED: "bg-red-100 text-red-700", CANCELLED: "bg-slate-100 text-slate-600",
  };
  return <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}
