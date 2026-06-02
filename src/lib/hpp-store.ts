import { supabase } from "@/integrations/supabase/client";

export type HppImage = { url: string; path: string; isPrimary?: boolean };
export type ExtraCost = { name: string; amount: number };

export type HppProduct = {
  id: string;
  owner_id: string;
  sku: string;
  name: string;
  category: string;
  description: string | null;
  images: HppImage[];
  harga_beli: number;
  ongkir: number;
  kemasan: number;
  pajak: number;
  handling: number;
  shrinkage: number;
  packaging_final: number;
  biaya_lain: ExtraCost[];
  total_hpp: number;
  harga_jual: number;
  margin_target: number;
  stock: number;
  min_stock: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductChannel = {
  id: string;
  owner_id: string;
  product_id: string;
  channel_name: string;
  harga_jual: number;
  fee_persen: number;
  fee_nominal: number;
};

export type RecipeIngredient = { name: string; qty: number; unit: string; costPerUnit: number };

export type Recipe = {
  id: string;
  owner_id: string;
  name: string;
  images: HppImage[];
  ingredients: RecipeIngredient[];
  total_hpp: number;
  yield_qty: number;
  hpp_per_porsi: number;
  prep_time: number | null;
  difficulty: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const CATEGORIES = ["Makanan", "Minuman", "Snack", "Barang Dagangan", "Lainnya"] as const;
export const CHANNELS = ["Toko Fisik", "Tokopedia", "Shopee", "Lazada", "TikTok Shop", "Instagram", "GoFood", "GrabFood", "Custom"] as const;

export const fmtRp = (n: number) =>
  "Rp " + (Number.isFinite(n) ? Math.round(n) : 0).toLocaleString("id-ID");

export function calcHpp(p: Partial<HppProduct>): number {
  const extras = (p.biaya_lain || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
  return (
    (Number(p.harga_beli) || 0) +
    (Number(p.ongkir) || 0) +
    (Number(p.kemasan) || 0) +
    (Number(p.pajak) || 0) +
    (Number(p.handling) || 0) +
    (Number(p.shrinkage) || 0) +
    (Number(p.packaging_final) || 0) +
    extras
  );
}

export function suggestedPrice(hpp: number, marginPct: number): number {
  return Math.round(hpp + (hpp * (Number(marginPct) || 0)) / 100);
}

export function marginInfo(hpp: number, harga: number) {
  const rp = harga - hpp;
  const pct = hpp > 0 ? (rp / hpp) * 100 : 0;
  let label = "Margin Sangat Baik", color = "text-green-700", bg = "bg-green-100", level: "good" | "ok" | "low" | "loss" = "good";
  if (pct < 0) { label = "RUGI! Harga < HPP"; color = "text-red-700"; bg = "bg-red-100"; level = "loss"; }
  else if (pct < 15) { label = "Margin Rendah"; color = "text-red-700"; bg = "bg-red-100"; level = "low"; }
  else if (pct < 35) { label = "Margin Sedang"; color = "text-amber-700"; bg = "bg-amber-100"; level = "ok"; }
  return { rp, pct, label, color, bg, level };
}

// ============ Supabase CRUD ============

export async function listHppProducts(): Promise<HppProduct[]> {
  const { data, error } = await supabase.from("hpp_products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as HppProduct[];
}

export async function upsertHppProduct(p: Partial<HppProduct>): Promise<HppProduct> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");
  const total = calcHpp(p);
  const payload = {
    ...p,
    owner_id: user.id,
    total_hpp: total,
  };
  // remove undefined to avoid overwriting
  Object.keys(payload).forEach((k) => (payload as Record<string, unknown>)[k] === undefined && delete (payload as Record<string, unknown>)[k]);
  const q = p.id
    ? supabase.from("hpp_products").update(payload as never).eq("id", p.id).select().single()
    : supabase.from("hpp_products").insert(payload as never).select().single();
  const { data, error } = await q;
  if (error) throw error;
  return data as unknown as HppProduct;
}

export async function deleteHppProduct(id: string) {
  const { error } = await supabase.from("hpp_products").delete().eq("id", id);
  if (error) throw error;
}

export async function listChannels(productId: string): Promise<ProductChannel[]> {
  const { data, error } = await supabase.from("product_channels").select("*").eq("product_id", productId).order("created_at");
  if (error) throw error;
  return (data || []) as ProductChannel[];
}

export async function upsertChannel(c: Partial<ProductChannel>): Promise<ProductChannel> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");
  const payload = { ...c, owner_id: user.id };
  const q = c.id
    ? supabase.from("product_channels").update(payload as never).eq("id", c.id).select().single()
    : supabase.from("product_channels").insert(payload as never).select().single();
  const { data, error } = await q;
  if (error) throw error;
  return data as ProductChannel;
}

export async function deleteChannel(id: string) {
  const { error } = await supabase.from("product_channels").delete().eq("id", id);
  if (error) throw error;
}

export async function listRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase.from("recipes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as Recipe[];
}

export async function upsertRecipe(r: Partial<Recipe>): Promise<Recipe> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");
  const total = (r.ingredients || []).reduce((s, x) => s + (Number(x.qty) || 0) * (Number(x.costPerUnit) || 0), 0);
  const yieldQty = Math.max(1, Number(r.yield_qty) || 1);
  const payload = { ...r, owner_id: user.id, total_hpp: total, hpp_per_porsi: total / yieldQty };
  Object.keys(payload).forEach((k) => (payload as Record<string, unknown>)[k] === undefined && delete (payload as Record<string, unknown>)[k]);
  const q = r.id
    ? supabase.from("recipes").update(payload as never).eq("id", r.id).select().single()
    : supabase.from("recipes").insert(payload as never).select().single();
  const { data, error } = await q;
  if (error) throw error;
  return data as unknown as Recipe;
}

export async function deleteRecipe(id: string) {
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}

// ============ Image upload ============

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function uploadProductImage(file: File): Promise<HppImage> {
  if (!ALLOWED.includes(file.type)) throw new Error("Format tidak didukung. Gunakan JPG/PNG/WebP.");
  if (file.size > MAX_BYTES) throw new Error("Ukuran > 5MB. Kompres dulu.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/hpp/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("documents").getPublicUrl(path);
  return { url: data.publicUrl, path, isPrimary: false };
}

export async function deleteImageFile(path: string) {
  await supabase.storage.from("documents").remove([path]);
}
