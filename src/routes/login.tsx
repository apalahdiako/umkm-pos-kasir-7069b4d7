import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LogIn, Mail, Lock, Loader2, Store, User, CheckCircle2, XCircle,
  Receipt, Bell, Wallet, TrendingUp, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Masuk — Nota Pro" }] }),
  component: LoginPage,
});

type Status = "idle" | "checking" | "available" | "taken" | "invalid";

function useDebouncedAvailability(value: string, validator: (v: string) => string | null, rpc: "is_email_available" | "is_store_name_available") {
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const reqId = useRef(0);

  useEffect(() => {
    const v = value.trim();
    if (!v) { setStatus("idle"); setMsg(""); return; }
    const err = validator(v);
    if (err) { setStatus("invalid"); setMsg(err); return; }
    setStatus("checking"); setMsg("Mengecek...");
    const myId = ++reqId.current;
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc(rpc, rpc === "is_email_available" ? { _email: v } : { _name: v });
      if (myId !== reqId.current) return;
      if (error) { setStatus("idle"); setMsg(""); return; }
      if (data === true) { setStatus("available"); setMsg(rpc === "is_email_available" ? "Email tersedia" : "Nama brand tersedia"); }
      else { setStatus("taken"); setMsg(rpc === "is_email_available" ? "Email sudah terdaftar" : "Nama brand sudah dipakai"); }
    }, 400);
    return () => clearTimeout(t);
  }, [value, rpc, validator]);

  return { status, msg };
}

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (user) navigate({ to: "/", replace: true }); }, [user, navigate]);

  const emailValidator = useMemo(() => (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Format email tidak valid", []);
  const storeValidator = useMemo(() => (v: string) => {
    if (v.length < 3) return "Minimal 3 karakter";
    if (v.length > 30) return "Maksimal 30 karakter";
    if (!/^[a-zA-Z0-9 ]+$/.test(v)) return "Hanya huruf, angka, & spasi";
    return null;
  }, []);

  const emailCheck = useDebouncedAvailability(mode === "signup" ? email : "", emailValidator, "is_email_available");
  const storeCheck = useDebouncedAvailability(mode === "signup" ? storeName : "", storeValidator, "is_store_name_available");

  const canSubmit = mode === "login"
    ? email.length > 0 && password.length >= 6
    : password.length >= 6 && fullName.trim().length >= 2
      && emailCheck.status === "available" && storeCheck.status === "available";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, store_name: storeName.trim() },
          },
        });
        if (error) throw error;
        setError("✓ Cek email untuk konfirmasi akun Anda.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal");
    } finally { setLoading(false); }
  };

  const google = async () => {
    setError("");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setError(r.error.message);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-white overflow-hidden">
      {/* LEFT: Animated showcase */}
      <div className="hidden lg:flex relative w-1/2 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Falling receipts */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute w-32 bg-white rounded-md shadow-2xl text-slate-800 p-2 text-[9px] font-mono pointer-events-none"
            style={{
              left: `${10 + i * 17}%`,
              top: "-120px",
              animation: `fallReceipt ${6 + i}s ${i * 0.8}s linear infinite`,
              transform: `rotate(${-8 + i * 4}deg)`,
            }}
          >
            <div className="text-center font-bold border-b pb-1">NOTA PRO</div>
            <div className="flex justify-between mt-1"><span>Kopi Susu</span><span>25k</span></div>
            <div className="flex justify-between"><span>Croissant</span><span>18k</span></div>
            <div className="flex justify-between border-t mt-1 pt-1 font-bold"><span>TOTAL</span><span>43k</span></div>
            <div className="text-center mt-1 text-[8px]">★ Lunas via QRIS</div>
          </div>
        ))}

        {/* Floating notifications */}
        <div className="absolute top-1/4 right-8 space-y-3 w-72 z-10">
          {[
            { icon: Bell, color: "bg-green-500", title: "Pembayaran Masuk", body: "+Rp 125.000 via QRIS — BCA" },
            { icon: Wallet, color: "bg-blue-500", title: "Saldo Wallet", body: "Rp 4.890.000 siap ditarik" },
            { icon: TrendingUp, color: "bg-amber-500", title: "Omset Hari Ini", body: "+18% dari kemarin" },
          ].map((n, i) => (
            <div
              key={i}
              className="bg-white/95 backdrop-blur text-slate-900 rounded-xl shadow-2xl p-3 flex items-start gap-3"
              style={{ animation: `slideInRight 0.8s ${i * 0.5}s both, floatPulse 4s ${i * 0.5 + 1}s ease-in-out infinite` }}
            >
              <div className={`${n.color} h-9 w-9 rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                <n.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">{n.title}</p>
                <p className="text-[11px] text-slate-600 truncate">{n.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Hero copy */}
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <span className="text-xs uppercase tracking-widest font-semibold text-amber-300">Real-time POS</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-3">Nota Pro</h1>
          <p className="text-xl text-blue-100 mb-2">Kasir, QRIS, &amp; E-Wallet jadi satu.</p>
          <p className="text-sm text-blue-200 max-w-md">Dibuat untuk UMKM Indonesia. MDR 0.3%, tarik saldo nyaris gratis, laporan laba/rugi cerdas.</p>
          <div className="flex gap-6 mt-6 text-xs text-blue-200">
            <div><div className="text-2xl font-bold text-white">12K+</div>Merchant</div>
            <div><div className="text-2xl font-bold text-white">₹98M</div>Diproses/hari</div>
            <div><div className="text-2xl font-bold text-white">99.9%</div>Uptime</div>
          </div>
        </div>
      </div>

      {/* RIGHT: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white text-slate-900">
        <div className="w-full max-w-md">
          <Link to="/" className="text-xs text-slate-500 hover:text-blue-600">← Kembali ke beranda</Link>
          <div className="mt-4 mb-6">
            <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">NP</div>
            <h2 className="mt-4 text-2xl font-bold">{mode === "login" ? "Masuk ke Nota Pro" : "Mulai gratis hari ini"}</h2>
            <p className="text-sm text-slate-500 mt-1">{mode === "login" ? "Lanjutkan ke dashboard merchant Anda" : "Setup toko Anda dalam 30 detik"}</p>
          </div>

          <button
            onClick={google}
            className="w-full border border-slate-300 hover:bg-slate-50 rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Lanjutkan dengan Google
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400 my-4">
            <div className="h-px flex-1 bg-slate-200" /> atau {mode === "login" ? "masuk dengan email" : "daftar dengan email"} <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <>
                <ValidatedInput icon={User} placeholder="Nama lengkap pemilik" value={fullName} onChange={setFullName} required minLength={2} />
                <ValidatedInput icon={Store} placeholder="Nama brand / toko (mis. Kopi Senja)" value={storeName} onChange={setStoreName} check={storeCheck} required />
              </>
            )}
            <ValidatedInput icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} check={mode === "signup" ? emailCheck : undefined} required />
            <ValidatedInput icon={Lock} type="password" placeholder="Password (min 6 karakter)" value={password} onChange={setPassword} minLength={6} required />
            {password.length > 0 && password.length < 6 && (
              <p className="text-[11px] text-amber-600">Password minimal 6 karakter</p>
            )}

            {error && (
              <p className={`text-xs p-2 rounded ${error.startsWith("✓") ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>{error}</p>
            )}

            <button
              disabled={loading || !canSubmit}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {mode === "login" ? "Masuk" : "Daftar Gratis"}
            </button>
          </form>

          <p className="text-xs text-center text-slate-500 mt-5">
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="text-blue-600 font-semibold hover:underline">
              {mode === "login" ? "Daftar sekarang" : "Masuk di sini"}
            </button>
          </p>

          <p className="text-[10px] text-center text-slate-400 mt-6">
            Dengan mendaftar, Anda menyetujui Syarat &amp; Ketentuan dan Kebijakan Privasi Nota Pro.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fallReceipt {
          0% { transform: translateY(0) rotate(-8deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.9; }
          100% { transform: translateY(110vh) rotate(20deg); opacity: 0; }
        }
        @keyframes slideInRight {
          0% { transform: translateX(120%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes floatPulse {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

function ValidatedInput({
  icon: Icon, type = "text", placeholder, value, onChange, check, required, minLength,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type?: string; placeholder: string; value: string;
  onChange: (v: string) => void;
  check?: { status: Status; msg: string };
  required?: boolean; minLength?: number;
}) {
  const showIndicator = check && value.length > 0;
  return (
    <div>
      <div className="relative">
        <Icon className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
        <input
          required={required} type={type} value={value} minLength={minLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border rounded-lg pl-9 pr-9 py-2 text-sm transition focus:outline-none focus:ring-2 ${
            check?.status === "taken" || check?.status === "invalid" ? "border-red-300 focus:ring-red-200"
            : check?.status === "available" ? "border-green-300 focus:ring-green-200"
            : "border-slate-300 focus:ring-blue-200"
          }`}
        />
        {showIndicator && (
          <div className="absolute right-3 top-2.5">
            {check.status === "checking" && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            {check.status === "available" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {(check.status === "taken" || check.status === "invalid") && <XCircle className="h-4 w-4 text-red-500" />}
          </div>
        )}
      </div>
      {showIndicator && check.msg && (
        <p className={`text-[11px] mt-1 ${
          check.status === "available" ? "text-green-600"
          : check.status === "checking" ? "text-slate-500"
          : "text-red-600"
        }`}>{check.msg}</p>
      )}
    </div>
  );
}
