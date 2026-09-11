"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Belum bisa keluar. Coba lagi.");
      router.replace("/login"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Koneksi bermasalah."); }
    finally { setBusy(false); }
  }
  return <div>
    <button onClick={logout} disabled={busy} className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50">{busy ? "Keluar..." : "Keluar dari akun"}</button>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
}
