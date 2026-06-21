import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DanaProfile = {
  dana_number: string | null;
  dana_holder_name: string | null;
  dana_qr_url: string | null;
  dana_active: boolean;
};

export const getDanaProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DanaProfile> => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("dana_number, dana_holder_name, dana_qr_url, dana_active")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return (
      data ?? {
        dana_number: null,
        dana_holder_name: null,
        dana_qr_url: null,
        dana_active: false,
      }
    );
  });

export const updateDanaProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: DanaProfile) => {
    const num = (data.dana_number ?? "").trim();
    if (data.dana_active && !/^\d{9,15}$/.test(num)) {
      throw new Error("Nomor DANA harus 9-15 digit angka");
    }
    return {
      dana_number: num || null,
      dana_holder_name: (data.dana_holder_name ?? "").trim() || null,
      dana_qr_url: (data.dana_qr_url ?? "").trim() || null,
      dana_active: !!data.dana_active,
    };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
