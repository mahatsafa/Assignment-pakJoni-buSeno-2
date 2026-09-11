import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import CommentSection from "@/components/CommentSection";
import { getCommentsForStudent } from "@/lib/comments";
import { getStudentById } from "@/lib/students";
import { getCurrentAccount } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Profil Siswa",
};

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <dt className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-emerald-700">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800">
        {value || "Belum diisi"}
      </dd>
    </div>
  );
}
export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const student = await getStudentById(id);

  if (!student) {
    notFound();
  }

  const comments = await getCommentsForStudent(student.id);
  const account = await getCurrentAccount();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="technical-grid border-b border-slate-800 bg-slate-950 pb-32 pt-12 text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Link href="/siswa" className="text-sm font-bold text-emerald-300 hover:text-emerald-200">
            ← Kembali ke daftar siswa
          </Link>
          <p className="mt-10 font-mono text-xs font-black uppercase tracking-[0.24em] text-slate-500">
            Student profile / ID {student.id}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-[-0.045em] sm:text-6xl">
            {student.namaLengkap}
          </h1>
          {student.namaPanggilan && (
            <p className="mt-3 text-lg font-bold text-emerald-300">Dipanggil “{student.namaPanggilan}”</p>
          )}
        </div>
      </section>

      <section className="mx-auto -mt-20 max-w-7xl px-5 pb-20 sm:px-8">
        <article className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_80px_-45px_rgba(15,23,42,0.55)] lg:grid-cols-[0.78fr_1.22fr]">
          <div className="relative min-h-[28rem] bg-slate-200 lg:min-h-[44rem]">
            {student.foto ? (
              <Image
                src={`/uploads/siswa/${encodeURIComponent(student.foto)}`}
                alt={`Foto profil ${student.namaLengkap}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-7xl font-black text-slate-400">XI</div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-6 pt-28 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Bidang keahlian</p>
              <p className="mt-2 text-xl font-black">{student.keahlian || "Teknik Komputer dan Jaringan"}</p>
            </div>
          </div>

          <div className="p-6 sm:p-9 lg:p-12">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Personal overview</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Tentang siswa</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-800">
                {student.kelas}
              </span>
            </div>

            <dl className="mt-7 grid gap-4 sm:grid-cols-2">
              <InfoItem label="Kelas" value={student.kelas} />
              <InfoItem label="Keahlian" value={student.keahlian} />
              <InfoItem label="Skill" value={student.skill} />
              <InfoItem label="Minat / Hobi" value={student.minatHobi} />
              <InfoItem label="Cita-cita" value={student.citaCita} />
              <InfoItem label="Nama panggilan" value={student.namaPanggilan} />
            </dl>

            <div className="mt-7 rounded-2xl bg-slate-950 p-6 text-white">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-emerald-300">Deskripsi singkat</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {student.deskripsi || "Deskripsi profil belum ditambahkan."}
              </p>
            </div>

            {student.foto && (
              <a
                href={`/api/files?name=${encodeURIComponent(student.foto)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700 hover:text-emerald-600"
              >
                Buka foto siswa <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </article>

        <CommentSection studentId={student.id} initialComments={comments} username={account?.username ?? null} />
      </section>
    </main>
  );
}
