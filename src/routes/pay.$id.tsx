import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock } from "lucide-react";
import {
  buildQrisPayload,
  formatCurrency,
  formatDate,
  qrImageUrl,
  usePaymentLinks,
  useStoreSettings,
} from "@/lib/nota-store";

export const Route = createFileRoute("/pay/$id")({
  head: () => ({ meta: [{ title: "Pembayaran — BY.UMKMKASIR" }] }),
  component: PayPage,
});

function PayPage() {
  const { id } = Route.useParams();
  const [links, setLinks] = usePaymentLinks();
  const [settings] = useStoreSettings();
  const link = links.find((l) => l.id === id);

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-lg shadow p-6 text-center max-w-sm">
          <h1 className="text-xl font-bold text-slate-900">Link tidak ditemukan</h1>
          <p className="text-sm text-slate-500 mt-1">Pastikan link dari merchant masih aktif.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 text-sm">Kembali</Link>
        </div>
      </div>
    );
  }

  const qrData = buildQrisPayload(settings.qrisMerchantName, link.amount, link.id, settings.qrisStaticPayload);

  const markPaid = () => {
    setLinks(links.map((l) => (l.id === id ? { ...l, status: "paid", paidAt: new Date().toISOString() } : l)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          {settings.logo && <img src={settings.logo} alt="" className="h-14 w-14 mx-auto rounded-lg object-cover mb-3" />}
          <p className="text-xs text-slate-500">Pembayaran ke</p>
          <h1 className="text-xl font-bold text-slate-900">{settings.storeName}</h1>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mt-4 text-center">
          <p className="text-xs text-slate-500">Total Tagihan</p>
          <p className="text-4xl font-bold text-blue-600 mt-1">{formatCurrency(link.amount)}</p>
          <p className="text-xs text-slate-500 mt-2">Untuk: {link.customer}</p>
          {link.description && <p className="text-xs text-slate-600 mt-1">{link.description}</p>}
        </div>

        {link.status === "paid" ? (
          <div className="mt-5 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <p className="font-bold text-green-700 mt-2">Pembayaran Berhasil</p>
            <p className="text-xs text-slate-600">{link.paidAt && formatDate(link.paidAt)}</p>
          </div>
        ) : (
          <>
            <div className="mt-5 text-center">
              <p className="text-xs font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> Scan QRIS untuk membayar
              </p>
              <img src={qrImageUrl(qrData, 240)} alt="QRIS" className="mx-auto rounded-lg border border-slate-200" />
              <p className="text-[10px] text-slate-400 mt-2 break-all">{settings.qrisMerchantName}</p>
            </div>
            <button onClick={markPaid} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">
              Saya sudah bayar
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              (Demo: klik tombol ini untuk simulasi pembayaran lunas. Di versi cloud, status berubah otomatis dari notifikasi gateway.)
            </p>
          </>
        )}
        <p className="text-[10px] text-slate-400 text-center mt-4">Powered by BY.UMKMKASIR</p>
      </div>
    </div>
  );
}
