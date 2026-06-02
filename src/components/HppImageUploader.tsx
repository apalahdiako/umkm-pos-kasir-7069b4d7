import { useRef, useState } from "react";
import { Upload, X, Star, ArrowLeft, ArrowRight, Loader2, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { uploadProductImage, deleteImageFile, type HppImage } from "@/lib/hpp-store";

type Props = {
  images: HppImage[];
  onChange: (images: HppImage[]) => void;
  max?: number;
};

export function HppImageUploader({ images, onChange, max = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (images.length + files.length > max) return toast.error(`Maks ${max} gambar`);
    setBusy(true);
    try {
      const uploaded: HppImage[] = [];
      for (const f of Array.from(files)) {
        const img = await uploadProductImage(f);
        if (images.length === 0 && uploaded.length === 0) img.isPrimary = true;
        uploaded.push(img);
      }
      onChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} gambar diupload`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (idx: number) => {
    const img = images[idx];
    const next = images.filter((_, i) => i !== idx);
    if (img.isPrimary && next.length) next[0].isPrimary = true;
    onChange(next);
    try { await deleteImageFile(img.path); } catch { /* ignore */ }
  };

  const setPrimary = (idx: number) => onChange(images.map((im, i) => ({ ...im, isPrimary: i === idx })));

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/40 transition"
      >
        {busy ? (
          <div className="flex items-center justify-center gap-2 text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Mengupload…</div>
        ) : (
          <>
            <Upload className="h-7 w-7 mx-auto mb-1 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">Drag gambar atau klik untuk upload</p>
            <p className="text-[11px] text-slate-500">JPG / PNG / WebP · max 5MB · maks {max} gambar</p>
          </>
        )}
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
          {images.map((im, i) => (
            <div key={im.path} className={`relative group rounded-lg overflow-hidden border ${im.isPrimary ? "border-blue-500 ring-2 ring-blue-300" : "border-slate-200"}`}>
              <img src={im.url} alt="" className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <IconBtn title="Zoom" onClick={() => setZoom(im.url)}><ZoomIn className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn title="Set utama" onClick={() => setPrimary(i)}><Star className={`h-3.5 w-3.5 ${im.isPrimary ? "fill-yellow-300" : ""}`} /></IconBtn>
                <IconBtn title="Geser kiri" onClick={() => move(i, -1)}><ArrowLeft className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn title="Geser kanan" onClick={() => move(i, 1)}><ArrowRight className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn title="Hapus" onClick={() => remove(i)} danger><X className="h-3.5 w-3.5" /></IconBtn>
              </div>
              {im.isPrimary && <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded">UTAMA</span>}
            </div>
          ))}
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`p-1.5 rounded text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-800"}`}
    >
      {children}
    </button>
  );
}
