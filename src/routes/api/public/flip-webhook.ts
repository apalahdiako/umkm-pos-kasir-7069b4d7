import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/flip-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.FLIP_VALIDATION_TOKEN;
        const token = request.headers.get("x-callback-token");
        if (!expected || token !== expected) {
          return new Response("Invalid token", { status: 401 });
        }
        let payload: any = {};
        try {
          const ct = request.headers.get("content-type") || "";
          if (ct.includes("application/json")) payload = await request.json();
          else {
            const form = await request.formData();
            const dataStr = form.get("data");
            payload = dataStr ? JSON.parse(String(dataStr)) : Object.fromEntries(form);
          }
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Bill paid notification (Accept Payment)
        const billLinkId = payload?.bill_link_id ?? payload?.bill?.link_id;
        if (billLinkId) {
          await supabaseAdmin.from("payment_requests").update({
            status: payload?.status === "SUCCESSFUL" ? "PAID" : (payload?.status || "PENDING"),
            payment_method: payload?.sender_bank || payload?.payment_method || null,
            paid_at: payload?.status === "SUCCESSFUL" ? new Date().toISOString() : null,
            bill_payload: payload,
          }).eq("flip_link_id", billLinkId);
        }

        // Disbursement status update
        const disbId = payload?.id ?? payload?.disbursement?.id;
        if (disbId && payload?.status && !billLinkId) {
          await supabaseAdmin.from("disbursements").update({
            status: payload.status,
            raw: payload,
            completed_at: payload.status === "DONE" ? new Date().toISOString() : null,
            fee: Number(payload?.fee ?? 0),
          }).eq("flip_id", disbId);
        }
        return new Response("ok");
      },
    },
  },
});
