"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    if (register && fields.password !== fields.confirmPassword) {
      setError("Konfirmasi password belum sama."); return;
    }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Permintaan gagal.");
      if (register) { form.reset(); setCreated(true); }
      else { router.replace("/akun"); router.refresh(); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tidak dapat terhubung ke server.");
    } finally { setBusy(false); }
  }

  if (created) return <div role="status" className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
    <h2 className="text-xl font-black text-emerald-950">Akunmu sudah siap.</h2>
    <p className="mt-3 text-sm leading-6 text-emerald-900">Masuk dengan email atau username dan password yang baru kamu buat.</p>
    <Link href="/login" className="mt-5 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white">Lanjut ke login →</Link>
  </div>;

  return <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={busy}>
    {register ? <>
      <label className="block text-sm font-bold text-slate-700">Username
        <input name="username" autoComplete="username" required minLength={3} maxLength={30} pattern="[a-z0-9_]{3,30}" placeholder="siswa_demo" aria-describedby="username-help" className={inputClass} />
      </label>
      <p id="username-help" className="-mt-3 text-xs text-slate-500">3–30 huruf kecil, angka, atau underscore.</p>
      <label className="block text-sm font-bold text-slate-700">Email
        <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="siswa@example.test" className={inputClass} />
      </label>
    </> : <label className="block text-sm font-bold text-slate-700">Email atau username
      <input name="identifier" autoComplete="username" required maxLength={254} placeholder="Username atau email akunmu" className={inputClass} />
    </label>}
    <label className="block text-sm font-bold text-slate-700">Password
      <input name="password" type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} required minLength={register ? 12 : 1} maxLength={128} aria-describedby={register ? "password-help" : undefined} className={inputClass} />
    </label>
    {register && <>
      <p id="password-help" className="-mt-3 text-xs text-slate-500">12–128 karakter. Gunakan password khusus untuk project ini.</p>
      <label className="block text-sm font-bold text-slate-700">Ulangi password
        <input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={12} maxLength={128} className={inputClass} />
      </label>
    </>}
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="h-4 w-4 accent-emerald-600" />Tampilkan password
    </label>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    <button disabled={busy} className="w-full rounded-full bg-emerald-400 px-6 py-3.5 font-extrabold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">
      {busy ? "Memproses..." : register ? "Buat akun" : "Masuk ke akun"}
    </button>
    <p className="text-center text-sm text-slate-600">{register ? "Sudah punya akun? " : "Belum punya akun? "}
      <Link href={register ? "/login" : "/register"} className="font-bold text-emerald-800 underline underline-offset-4">{register ? "Masuk" : "Daftar sekarang"}</Link>
    </p>
  </form>;
}
