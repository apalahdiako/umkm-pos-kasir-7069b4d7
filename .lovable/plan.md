
Karena scope-nya besar (4 fase × Cloud), saya pecah jadi 4 turn berurutan. Setiap turn = 1 fase yang langsung jalan & bisa dipakai. Saya mulai dari **Fase 1 & 4** dulu (gak butuh API key eksternal), lalu **Fase 2 & 3** (butuh connector + API key dari kamu).

---

## Fase 1 — Login Split-Screen Realtime (turn ini)

**UI**
- Redesign `/login` jadi **split-screen**:
  - **Kiri**: animasi Nota Pro — struk berjatuhan + notifikasi QRIS masuk, gradient brand, glassmorphism.
  - **Kanan**: form login/register smooth, Google OAuth on top, email/password di bawah.
- Animasi pakai pure CSS (`@keyframes`) — gak butuh library, instan loading.

**Realtime Validation**
- Server function `checkAvailability({ field, value })` → cek `profiles.email` & `profiles.store_name` di Supabase, debounce 400ms saat ngetik.
- Indikator inline: ✅ tersedia / ❌ sudah dipakai / ⏳ checking — tanpa klik submit.
- Validasi format real-time (email valid, password ≥6, nama brand 3-30 char, hanya huruf/angka/spasi).

**Migration**
- Tambah kolom `store_name` UNIQUE ke `profiles` (sudah ada kolomnya, perlu unique index + trigger isi dari signup).
- RPC `is_store_name_available(name text)` SECURITY DEFINER untuk cek tanpa expose data.

---

## Fase 2 — OTP Email + WhatsApp/SMS (turn berikutnya)

Butuh dari kamu:
1. Connect **Resend** (saya trigger `standard_connectors--connect`).
2. Connect **Twilio** (untuk WhatsApp Business / SMS).

Yang saya buat:
- Server fn `sendEmailOtp(email)` via Resend Gateway → kode 6 digit, expire 5 menit, simpan hash di tabel `otp_codes`.
- Server fn `sendWaOtp(phone)` via Twilio Gateway (WhatsApp template).
- Halaman `/verify-otp` & `/reset-password` (TanStack route, real-time countdown resend).
- Tabel `otp_codes (user_id, channel, code_hash, expires_at, used_at)` + RLS.
- Rate limit: max 3 OTP / 10 menit per email.

---

## Fase 3 — Arsitektur Pembayaran Low-Cost (turn berikutnya)

**QRIS Dinamis EMVCo (gratis, pure JS)**
- Implementasi parser & builder QRIS sesuai spec EMVCo: insert Tag 54 (amount), Tag 62.07 (reference), recalc CRC16-CCITT.
- Input: NMID + QRIS statis merchant → output: QR dinamis per transaksi.
- Sudah ada generator dasar, saya upgrade ke EMVCo-compliant + validasi CRC.

**Tripay VA (butuh API key)**
- Saya minta `TRIPAY_API_KEY`, `TRIPAY_PRIVATE_KEY`, `TRIPAY_MERCHANT_CODE`.
- Server fn `createTripayVA({ amount, customer, channel })` + webhook `/api/public/tripay-callback` (HMAC verify).
- UI pilih bank VA (BCA/Mandiri/BNI/BRI) di modal pembayaran.

**Flip Disbursement (butuh API key)**
- Saya minta `FLIP_SECRET_KEY` + `FLIP_VALIDATION_TOKEN`.
- Server fn `withdrawToBank({ bank, account, amount })` + webhook callback.
- Tombol "Tarik Saldo" di `/ledger`, validasi rekening dulu (`/disbursement/bank-account-inquiry`).

---

## Fase 4 — Open Bill (F&B) + Invoice (B2B) (turn berikutnya)

**Open Bill / KOT**
- Tabel `tables (id, name, capacity, status)` + `open_bills (id, table_id, items jsonb, subtotal, status, opened_at, closed_at)`.
- Halaman `/tables` — grid meja, status Open/Available/Reserved.
- Flow: pilih meja → input item → **Send to Kitchen** (print KOT, no price) → meja jadi "Open" → bisa nambah item → **Close Bill** baru cetak struk total.

**Invoice Lifecycle**
- Tabel `invoices (id, invoice_no, customer, items jsonb, total, status: 'DRAFT'|'OUTSTANDING'|'PAID', due_date, paid_at, payment_method)`.
- Halaman `/invoices` — list filter status, generate PDF/link WA, mark as paid (manual atau auto dari Tripay callback di Fase 3).
- Export CSV (siap import ke Kledo) di Reports.

---

## Catatan teknis (untuk diri sendiri)

- Semua tabel public schema → GRANT + RLS scope `auth.uid()`.
- Server fn `requireSupabaseAuth` middleware untuk semua mutasi user-scoped.
- `attachSupabaseAuth` sudah aktif di `start.ts`.
- Webhook (Tripay/Flip) di `src/routes/api/public/*` dengan HMAC verify pakai `supabaseAdmin`.
- Realtime check pakai server fn (bukan langsung query dari client) supaya gak bocorin email lain.

---

**Saya mulai dari Fase 1 sekarang** setelah kamu approve plan ini. Lanjut ke Fase 4, lalu kita ngobrol API key untuk Fase 2 & 3.
