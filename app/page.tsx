import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { siteConfig } from "@/lib/site";
import { getStudentCount } from "@/lib/students";

const aboutCards = [
  ["Network", "Mempelajari administrasi jaringan, routing, switching, dan layanan infrastruktur."],
  ["System", "Mengelola sistem operasi, server, database, dan layanan yang andal."],
  ["Web", "Membangun aplikasi modern dengan Next.js, React, TypeScript, dan Tailwind CSS."],
  ["Security", "Memahami penyebab celah keamanan dan menerapkan perbaikan yang tepat."],
];

const securityLabs = [
  ["SQL Injection", "Prepared statement dan validasi parameter"],
  ["Cross-Site Scripting", "Sanitasi input dan output encoding"],
  ["Path Traversal", "Allowlist nama file dan pembatasan direktori"],
];

export default async function Home() {
  await connection();
  const studentCount = await getStudentCount();

  return (
    <main>
      <section className="soft-noise technical-grid relative overflow-hidden bg-slate-950 text-white">
        <div className="mx-auto grid min-h-[46rem] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.95)]" />
              {siteConfig.schoolName}
            </div>

            <p className="mt-8 font-mono text-xs font-bold uppercase tracking-[0.26em] text-slate-400">
              {siteConfig.classLabel}
            </p>
            <h1 className="mt-4 max-w-3xl text-6xl font-black leading-[0.92] tracking-[-0.06em] sm:text-7xl lg:text-[6.4rem]">
              XI TKJ <span className="text-emerald-400">3</span>
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-semibold text-slate-200 sm:text-2xl">
              {siteConfig.tagline}
            </p>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              {siteConfig.description}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/siswa"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-emerald-400 px-7 py-4 font-extrabold text-slate-950 transition hover:-translate-y-1 hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                Lihat daftar siswa <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="#tentang"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-7 py-4 font-bold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                Kenali kelas kami
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-white/10 pt-7">
              <div>
                <p className="text-4xl font-black tracking-tight text-white">{studentCount}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">Profil siswa</p>
              </div>
              <div className="h-11 w-px bg-white/10" />
              <div>
                <p className="text-2xl font-black tracking-tight text-white">3 Topik</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">Keamanan web</p>
              </div>
              <div className="h-11 w-px bg-white/10" />
              <div>
                <p className="text-2xl font-black tracking-tight text-white">1 Kelas</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">Banyak potensi</p>
              </div>
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.04] shadow-2xl shadow-emerald-950/40">
            <div className="flex items-center justify-between gap-3 px-6 py-5 text-xs font-bold uppercase tracking-widest">
              <span className="text-emerald-300">Our class, our story</span>
              <span className="text-slate-400">XI TKJ 3</span>
            </div>
            <a href="/images/kelas-xi-tkj-3.png" target="_blank" rel="noreferrer" aria-label="Buka foto bersama kelas dalam ukuran penuh">
              <Image src="/images/kelas-xi-tkj-3.png" width={1600} height={900} alt="Foto bersama siswa-siswi XI TKJ 3 di depan latar PILKETOS" preload sizes="(max-width: 1024px) 100vw, 50vw" className="h-auto w-full" />
            </a>
            <figcaption className="p-6 sm:p-8">
              <p className="text-2xl font-black tracking-tight">Bukan sekadar satu kelas.</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">Tempat berbagi ide, membangun karya, dan belajar bersama. Inilah cerita kami.</p>
              <Link href="/register" className="mt-6 inline-flex text-sm font-extrabold text-emerald-300 hover:text-emerald-200">Jadi bagian dari ruang kelas →</Link>
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="tentang" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">Tentang kelas</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Belajar teknologi dengan membangun hal yang nyata.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {aboutCards.map(([title, description], index) => (
              <article key={title} className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.5)]">
                <span className="font-mono text-xs font-black text-emerald-600">0{index + 1}</span>
                <h3 className="mt-6 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="keamanan" className="bg-emerald-400">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-700">Belajar keamanan lewat website ini</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Tidak cukup hanya bisa membuat. Kami belajar mengamankan.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-800">
              Pencarian siswa, komentar profil, dan fitur buka foto menjadi bahan belajar keamanan aplikasi. Versi praktikum dijalankan di localhost dengan akun dummy, lalu dibandingkan dengan kode yang sudah diperbaiki.
            </p>
          </div>
          <div className="grid gap-3">
            {securityLabs.map(([title, solution], index) => (
              <article key={title} className="flex items-center gap-5 rounded-2xl bg-slate-950 p-5 text-white shadow-xl shadow-emerald-700/10">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 font-mono text-sm font-black text-emerald-300">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-extrabold">{title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{solution}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
