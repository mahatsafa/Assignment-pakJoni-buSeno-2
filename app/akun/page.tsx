import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
export const metadata = { title: "Akun Saya", robots: { index: false, follow: false } };
export default async function AccountPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  return <main className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
    <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Ruang anggota / XI TKJ 3</p>
    <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl">Halo, {account.username}.</h1>
    <p className="mt-5 leading-7 text-slate-600">Akunmu sudah terhubung. Sekarang kamu bisa memberikan komentar pada profil teman sekelas.</p>
    <section className="mt-9 overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
      <div className="bg-slate-950 px-7 py-6 text-white"><h2 className="text-xl font-bold">Identitas akun</h2><p className="mt-2 text-sm text-slate-300">Informasi ini ditampilkan untuk pemilik sesi.</p></div>
      <dl className="grid gap-6 p-7 sm:grid-cols-2">
        <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</dt><dd className="mt-2 break-all font-semibold">{account.username}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</dt><dd className="mt-2 break-all font-semibold">{account.email}</dd></div>
      </dl>
      <p className="border-t border-slate-100 px-7 py-5 text-sm leading-6 text-slate-600">Password tidak ditampilkan. Sesi berlaku selama 8 jam; keluar setelah menggunakan komputer bersama.</p>
    </section>
    <div className="mt-7 flex flex-wrap items-start gap-4">
      <Link href="/siswa" className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-extrabold text-slate-950 hover:bg-emerald-300">Jelajahi teman sekelas →</Link>
      <LogoutButton />
    </div>
  </main>;
}
