import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ Generic helpers ============
async function listTable<T = any>(ctx: any, table: string, order = "created_at", asc = false): Promise<T[]> {
  const { data, error } = await ctx.supabase.from(table).select("*").order(order, { ascending: asc });
  if (error) throw error;
  return (data ?? []) as T[];
}

// ============ INVENTORY ============
export const listInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listTable(context, "inventory_items", "name", true));

export const upsertInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("inventory_items").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      delete payload.id;
      const { error } = await context.supabase.from("inventory_items").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteInventory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("inventory_items").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listMovements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("stock_movements").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const recordMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { item_id: string; movement_type: "in" | "out" | "opname"; qty: number; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: item, error: e1 } = await context.supabase
      .from("inventory_items").select("current_stock").eq("id", data.item_id).single();
    if (e1) throw e1;
    let newStock = Number(item.current_stock);
    if (data.movement_type === "in") newStock += Number(data.qty);
    else if (data.movement_type === "out") newStock -= Number(data.qty);
    else if (data.movement_type === "opname") newStock = Number(data.qty);
    const { error: e2 } = await context.supabase.from("stock_movements").insert({
      user_id: context.userId,
      item_id: data.item_id,
      movement_type: data.movement_type,
      qty: data.qty,
      notes: data.notes ?? null,
    });
    if (e2) throw e2;
    const { error: e3 } = await context.supabase
      .from("inventory_items").update({ current_stock: newStock }).eq("id", data.item_id);
    if (e3) throw e3;
    return { ok: true, new_stock: newStock };
  });

// ============ CRM ============
export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listTable(context, "customers", "name", true));

export const upsertCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("customers").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      delete payload.id;
      const { error } = await context.supabase.from("customers").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("customers").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adjustPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_id: string; tx_type: "earn" | "redeem"; points: number; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: c, error: e1 } = await context.supabase
      .from("customers").select("points").eq("id", data.customer_id).single();
    if (e1) throw e1;
    const delta = data.tx_type === "earn" ? data.points : -data.points;
    const newPoints = Math.max(0, (c.points ?? 0) + delta);
    await context.supabase.from("loyalty_transactions").insert({
      user_id: context.userId, customer_id: data.customer_id, tx_type: data.tx_type,
      points: data.points, notes: data.notes ?? null,
    });
    const { error: e3 } = await context.supabase
      .from("customers").update({ points: newPoints }).eq("id", data.customer_id);
    if (e3) throw e3;
    return { ok: true, new_points: newPoints };
  });

export const listVouchers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listTable(context, "vouchers"));

export const upsertVoucher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("vouchers").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      delete payload.id;
      const { error } = await context.supabase.from("vouchers").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteVoucher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("vouchers").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ EMPLOYEES & SHIFTS ============
export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listTable(context, "employees", "name", true));

export const upsertEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("employees").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      delete payload.id;
      const { error } = await context.supabase.from("employees").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("employees").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listShifts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listTable(context, "shifts"));

export const openShift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { employee_id?: string; opening_cash: number; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("shifts").insert({
      user_id: context.userId, employee_id: data.employee_id ?? null,
      opening_cash: data.opening_cash, notes: data.notes ?? null, status: "open",
    });
    if (error) throw error;
    return { ok: true };
  });

export const closeShift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; closing_cash: number; total_sales: number; total_transactions: number }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("shifts").update({
      status: "closed", end_at: new Date().toISOString(),
      closing_cash: data.closing_cash, total_sales: data.total_sales, total_transactions: data.total_transactions,
    }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("attendance").select("*").order("date", { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const recordAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { employee_id: string; status: string; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { error } = await context.supabase.from("attendance").insert({
      user_id: context.userId, employee_id: data.employee_id,
      status: data.status, clock_in: now, notes: data.notes ?? null,
    });
    if (error) throw error;
    return { ok: true };
  });

// ============ ACCOUNTING ============
export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listTable(context, "chart_of_accounts", "code", true));

export const upsertAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("chart_of_accounts").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      delete payload.id;
      const { error } = await context.supabase.from("chart_of_accounts").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("chart_of_accounts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listJournal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: entries, error } = await context.supabase
      .from("journal_entries").select("*").order("entry_date", { ascending: false }).limit(100);
    if (error) throw error;
    const { data: lines } = await context.supabase.from("journal_lines").select("*");
    return { entries: entries ?? [], lines: lines ?? [] };
  });

export const postJournal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    entry_date: string; description: string; reference?: string;
    lines: Array<{ account_code: string; account_name: string; debit: number; credit: number }>;
  }) => d)
  .handler(async ({ data, context }) => {
    const total = data.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const { data: entry, error: e1 } = await context.supabase.from("journal_entries").insert({
      user_id: context.userId, entry_date: data.entry_date, description: data.description,
      reference: data.reference ?? null, total_amount: total,
    }).select().single();
    if (e1) throw e1;
    const linesPayload = data.lines.map((l) => ({ ...l, user_id: context.userId, entry_id: entry.id }));
    const { error: e2 } = await context.supabase.from("journal_lines").insert(linesPayload);
    if (e2) throw e2;
    return { ok: true };
  });

export const listReceivables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listTable(context, "receivables"));

export const upsertReceivable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("receivables").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      delete payload.id;
      const { error } = await context.supabase.from("receivables").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const listPayables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listTable(context, "payables"));

export const upsertPayable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("payables").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      delete payload.id;
      const { error } = await context.supabase.from("payables").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const profitLoss = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: lines } = await context.supabase
      .from("journal_lines").select("account_code, account_name, debit, credit");
    const { data: accounts } = await context.supabase
      .from("chart_of_accounts").select("code, account_type");
    const typeOf = new Map<string, string>((accounts ?? []).map((a: any) => [a.code, a.account_type]));
    let revenue = 0, expense = 0;
    (lines ?? []).forEach((l: any) => {
      const t = typeOf.get(l.account_code);
      if (t === "revenue") revenue += Number(l.credit) - Number(l.debit);
      if (t === "expense") expense += Number(l.debit) - Number(l.credit);
    });
    return { revenue, expense, profit: revenue - expense };
  });
