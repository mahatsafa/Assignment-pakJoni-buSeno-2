import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { getCurrentAccount } from "@/lib/auth";

const navigation = [
  { href: "/", label: "Beranda" },
  { href: "/siswa", label: "Daftar Siswa" },
  { href: "/#tentang", label: "Tentang Kelas" },
  { href: "/#keamanan", label: "Praktikum" },
];

export default async function Header() {
  const account = await getCurrentAccount();
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-6 px-5 py-3 sm:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-300 transition-transform group-hover:-rotate-3">
            3
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold tracking-tight text-slate-950">
              {siteConfig.className}
            </span>
            <span className="block truncate text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-slate-500">
              Class Portfolio
            </span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={account ? "/akun" : "/login"}
          className="shrink-0 rounded-full bg-emerald-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:px-5"
        >
          {account ? "Akun saya" : "Masuk / Daftar"}
        </Link>
      </div>

      <nav
        aria-label="Navigasi seluler"
        className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden"
      >
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
