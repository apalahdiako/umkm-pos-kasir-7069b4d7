import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { supabase } from "@/integrations/supabase/client";

export async function captureElement(el: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  // wait for fonts
  if ((document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready) {
    await (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready;
  }
  return html2canvas(el, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: el.scrollWidth,
    height: el.scrollHeight,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob fail"))), type, quality),
  );
}

export async function downloadCanvas(canvas: HTMLCanvasElement, filename: string, type: "png" | "jpg" = "png") {
  const mime = type === "png" ? "image/png" : "image/jpeg";
  const blob = await canvasToBlob(canvas, mime);
  saveAs(blob, `${filename}.${type}`);
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement) {
  const blob = await canvasToBlob(canvas, "image/png");
  const ClipboardItemCtor = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
  if (!ClipboardItemCtor || !navigator.clipboard?.write) throw new Error("Clipboard tidak didukung di browser ini");
  await navigator.clipboard.write([new ClipboardItemCtor({ "image/png": blob })]);
}

export async function uploadCanvasToStorage(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");
  const blob = await canvasToBlob(canvas, "image/png");
  const path = `${user.id}/${Date.now()}-${filename}.png`;
  const { error } = await supabase.storage.from("documents").upload(path, blob, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("documents").getPublicUrl(path);
  return data.publicUrl;
}

export async function shareCanvasNative(canvas: HTMLCanvasElement, filename: string, text: string) {
  const blob = await canvasToBlob(canvas, "image/png");
  const file = new File([blob], `${filename}.png`, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: unknown) => Promise<void> };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    await nav.share({ files: [file], text, title: filename });
    return true;
  }
  return false;
}
