import { useEffect, useRef, useState } from "react";
import { X, Download, MessageCircle, Copy, Share2, Mail, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  captureElement,
  copyCanvasToClipboard,
  downloadCanvas,
  shareCanvasNative,
  uploadCanvasToStorage,
} from "@/lib/capture-to-image";
import { ThermalDoc, A4Invoice, type DocData } from "./DocumentImage";
import { useStoreSettings, waLink } from "@/lib/nota-store";

type Props = {
  open: boolean;
  onClose: () => void;
  data: DocData;
  /** thermal = 80mm style (nota/resi/closed bill); a4 = invoice */
  layout?: "thermal" | "a4";
};

export function DocumentActions({ open, onClose, data, layout = "thermal" }: Props) {
  const [settings] = useStoreSettings();
  const docRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const t = setTimeout(async () => {
      if (!docRef.current) return;
      try {
        const canvas = await captureElement(docRef.current, layout === "a4" ? 2 : 3);
        if (alive) setPreview(canvas.toDataURL("image/png"));
      } catch (e) {
        console.error(e);
        toast.error("Gagal membuat preview gambar");
      }
    }, 80);
    return () => { alive = false; clearTimeout(t); };
  }, [open, layout, data]);

  const run = async (key: string, fn: () => Promise<void>) => {
    if (!docRef.current) return;
    setLoading(key);
    try { await fn(); } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally { setLoading(""); }
  };

  const filename = `${data.type.toLowerCase().replace(/\s/g, "-")}-${data.docNo}`;

  const onDownload = (type: "png" | "jpg") =>
    run("dl-" + type, async () => {
      const canvas = await captureElement(docRef.current!, layout === "a4" ? 2 : 3);
      await downloadCanvas(canvas, filename, type);
      toast.success(`Gambar ${type.toUpperCase()} diunduh`);
    });

  const onCopy = () =>
    run("copy", async () => {
      const canvas = await captureElement(docRef.current!, layout === "a4" ? 2 : 3);
      await copyCanvasToClipboard(canvas);
      toast.success("Tersalin! Tempel (paste) di WA / Telegram / chat manapun");
    });

  const onShareNative = () =>
    run("share", async () => {
      const canvas = await captureElement(docRef.current!, layout === "a4" ? 2 : 3);
      const ok = await shareCanvasNative(canvas, filename, `${data.type} ${data.docNo}`);
      if (!ok) toast.error("Share native tidak didukung — pakai Copy atau Download");
    });

  const onWhatsApp = () =>
    run("wa", async () => {
      const canvas = await captureElement(docRef.current!, layout === "a4" ? 2 : 3);
      const url = await uploadCanvasToStorage(canvas, filename);
      const msg =
        `Halo ${data.customerName || "Bapak/Ibu"},\n\n` +
        `Berikut *${data.type}* dari ${settings.storeName}:\n` +
        `No: ${data.docNo}\n` +
        `Total: Rp ${data.total.toLocaleString("id-ID")}\n` +
        (data.status ? `Status: ${data.status}\n` : "") +
        `\n📄 Lihat dokumen: ${url}\n\nTerima kasih 🙏`;
      window.open(waLink(data.customerPhone || "", msg), "_blank");
      toast.success("Link gambar dibuka di WhatsApp");
    });

  const onEmail = () =>
    run("email", async () => {
      const canvas = await captureElement(docRef.current!, layout === "a4" ? 2 : 3);
      const url = await uploadCanvasToStorage(canvas, filename);
      const subject = encodeURIComponent(`${data.type} ${data.docNo} — ${settings.storeName}`);
      const body = encodeURIComponent(
        `Halo ${data.customerName || ""},\n\nBerikut ${data.type} ${data.docNo}.\nTotal: Rp ${data.total.toLocaleString("id-ID")}\n\nLihat dokumen: ${url}\n\nTerima kasih.`,
      );
      window.location.href = `mailto:${data.customerEmail || ""}?subject=${subject}&body=${body}`;
    });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-bold flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Kirim {data.type} sebagai Gambar</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        {/* hidden document for capture */}
        <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
          {layout === "a4"
            ? <A4Invoice ref={docRef} data={data} settings={settings} />
            : <ThermalDoc ref={docRef} data={data} settings={settings} />}
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 flex items-start justify-center">
          {preview
            ? <img src={preview} alt="Preview" className="max-w-full shadow-lg" style={{ maxHeight: 520 }} />
            : <div className="text-slate-500 flex items-center gap-2 py-12"><Loader2 className="h-5 w-5 animate-spin" /> Membuat preview…</div>}
        </div>

        <div className="border-t p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          <ActionBtn onClick={() => onDownload("png")} icon={<Download className="h-4 w-4" />} label="Download PNG" busy={loading === "dl-png"} />
          <ActionBtn onClick={() => onDownload("jpg")} icon={<Download className="h-4 w-4" />} label="Download JPG" busy={loading === "dl-jpg"} />
          <ActionBtn onClick={onCopy} icon={<Copy className="h-4 w-4" />} label="Copy Gambar" busy={loading === "copy"} />
          <ActionBtn onClick={onShareNative} icon={<Share2 className="h-4 w-4" />} label="Share (HP)" busy={loading === "share"} />
          <ActionBtn onClick={onWhatsApp} icon={<MessageCircle className="h-4 w-4" />} label="Kirim WA" busy={loading === "wa"} primary />
          <ActionBtn onClick={onEmail} icon={<Mail className="h-4 w-4" />} label="Kirim Email" busy={loading === "email"} />
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, icon, label, busy, primary }: { onClick: () => void; icon: React.ReactNode; label: string; busy?: boolean; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
        primary ? "bg-green-600 text-white hover:bg-green-700" : "bg-slate-100 hover:bg-slate-200 text-slate-800"
      }`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}
