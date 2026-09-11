import Image from "next/image";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { siteConfig } from "@/lib/site";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  return <main className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:items-start lg:gap-20 lg:py-20">
    <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white">
      <div className="p-7 sm:p-10">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-300">{siteConfig.className} / Ruang bersama</p>
        <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Satu kelas.<br />Banyak cerita.</h1>
        <p className="mt-5 max-w-md leading-7 text-slate-300">Kenali teman sekelas dan tinggalkan apresiasi lewat akunmu sendiri.</p>
      </div>
      <Image src="/images/kelas-xi-tkj-3.png" width={1600} height={900} alt="Foto bersama kelas XI TKJ 3" sizes="(max-width: 1024px) 100vw, 50vw" className="h-auto w-full" />
      <p className="px-7 py-5 text-sm text-slate-300 sm:px-10">Bertumbuh bersama, satu baris kode setiap hari.</p>
    </section>
    <section className="w-full max-w-lg self-center justify-self-center py-2">
      <Link href="/" className="text-sm font-bold text-emerald-800">← Kembali ke beranda</Link>
      <h2 className="mt-7 text-3xl font-black tracking-tight text-slate-950">{mode === "login" ? "Selamat datang kembali." : "Buat akun kelasmu."}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{mode === "login" ? "Gunakan email atau username yang sudah terdaftar." : "Untuk praktikum, pakai email dummy seperti siswa@example.test. Tidak ada email verifikasi yang dikirim."}</p>
      <AuthForm mode={mode} />
    </section>
  </main>;
}
