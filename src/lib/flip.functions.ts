import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function flipAuth() {
  const key = process.env.FLIP_SECRET_KEY;
  if (!key) throw new Error("FLIP_SECRET_KEY belum di-set. Tambahkan di Settings → Secrets.");
  const base = process.env.FLIP_BASE_URL || "https://bigflip.id/big_sandbox_api/v2";
  return { base, auth: "Basic " + btoa(key + ":") };
}

async function flipFetch(path: string, init: RequestInit = {}) {
  const { base, auth } = flipAuth();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(json?.message || json?.error || `Flip ${res.status}`);
  return json;
}

// ---------- Saldo ----------
export const getFlipBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    try {
      const data = await flipFetch("/general/balance", { method: "GET", headers: { "Content-Type": "application/json" } });
      return { ok: true as const, balance: Number(data?.balance ?? 0) };
    } catch (e: any) {
      return { ok: false as const, error: String(e?.message || e) };
    }
  });

// ---------- Buat Bill (Accept Payment: DANA/OVO/ShopeePay/QRIS/VA) ----------
export const createFlipBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; amount: number; sender_name?: string; type?: "SINGLE" | "MULTIPLE" }) => d)
  .handler(async ({ data, context }) => {
    const body = new URLSearchParams({
      title: data.title,
      amount: String(Math.round(data.amount)),
      type: data.type || "SINGLE",
      step: "2",
      is_address_required: "0",
      is_phone_number_required: "0",
      ...(data.sender_name ? { sender_name: data.sender_name } : {}),
    });
    const bill = await flipFetch("/pwf/bill", { method: "POST", body });
    const linkId = bill?.link_id ?? bill?.id;
    const linkUrl = bill?.link_url ? `https://bigflip.id/${bill.link_url}` : null;

    const { data: row, error } = await context.supabase
      .from("payment_requests")
      .insert({
        user_id: context.userId,
        flip_link_id: linkId,
        flip_link_url: linkUrl,
        title: data.title,
        amount: data.amount,
        type: data.type || "SINGLE",
        sender_name: data.sender_name || null,
        bill_payload: bill,
        status: "PENDING",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, link_url: linkUrl, link_id: linkId, flip: bill };
  });

// ---------- Disbursement (Penarikan ke bank / e-wallet) ----------
export const createFlipDisbursement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    bank_code: string;
    account_number: string;
    amount: number;
    recipient_name?: string;
    remark?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const idem = `wd_${context.userId.slice(0, 8)}_${Date.now()}`;

    // Insert PENDING row first (idempotency anchor)
    const { data: row, error } = await context.supabase
      .from("disbursements")
      .insert({
        user_id: context.userId,
        idempotency_key: idem,
        bank_code: data.bank_code,
        account_number: data.account_number,
        recipient_name: data.recipient_name || null,
        amount: data.amount,
        remark: data.remark || "Penarikan saldo",
        status: "PENDING",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    try {
      const body = new URLSearchParams({
        account_number: data.account_number,
        bank_code: data.bank_code,
        amount: String(Math.round(data.amount)),
        remark: (data.remark || "Penarikan").slice(0, 18),
        recipient_city: "391",
      });
      const flip = await flipFetch("/disbursement", {
        method: "POST",
        headers: { "idempotency-key": idem },
        body,
      });
      await context.supabase
        .from("disbursements")
        .update({
          flip_id: flip?.id ?? null,
          status: flip?.status || "PENDING",
          fee: Number(flip?.fee ?? 0),
          raw: flip,
        })
        .eq("id", row.id);
      return { id: row.id, flip };
    } catch (e: any) {
      await context.supabase
        .from("disbursements")
        .update({ status: "FAILED", raw: { error: String(e?.message || e) } })
        .eq("id", row.id);
      throw e;
    }
  });

// ---------- List ----------
export const listPaymentRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data || [];
  });

export const listDisbursements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("disbursements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data || [];
  });

// ---------- Refresh status bill (poll) ----------
export const refreshBillStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("payment_requests").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    if (!row.flip_link_id) return row;
    const payments = await flipFetch(`/pwf/${row.flip_link_id}/payment`, {
      method: "GET", headers: { "Content-Type": "application/json" },
    }).catch(() => null);
    const last = Array.isArray(payments) ? payments[0] : payments?.data?.[0];
    if (last?.status === "SUCCESSFUL") {
      await context.supabase.from("payment_requests").update({
        status: "PAID", payment_method: last?.sender_bank || last?.payment_method || null,
        paid_at: new Date().toISOString(), bill_payload: { ...(row.bill_payload || {}), last },
      }).eq("id", row.id);
    }
    return { ok: true };
  });
