"use client";

import { useState, type FormEvent } from "react";
import type { StudentComment } from "@/lib/types";
import Link from "next/link";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function CommentSection({
  studentId,
  initialComments,
  username,
}: {
  studentId: number;
  initialComments: StudentComment[];
  username: string | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, content }),
      });
      const data = (await response.json()) as {
        comment?: StudentComment;
        message?: string;
      };

      if (!response.ok || !data.comment) {
        throw new Error(data.message || "Komentar belum dapat dikirim.");
      }

      setComments((current) => [data.comment as StudentComment, ...current]);
      setContent("");
      setMessage("Komentar berhasil dikirim.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="komentar-heading" className="mt-10 grid gap-7 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Ruang apresiasi</p>
        <h2 id="komentar-heading" className="mt-3 text-2xl font-black tracking-tight text-slate-950">
          Tinggalkan komentar
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Gunakan bahasa yang sopan untuk memberikan apresiasi atau pesan yang membangun.
        </p>

        {username ? <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <p className="text-sm text-slate-600">Mengirim sebagai <strong>{username}</strong>.</p>
          <label className="block text-sm font-bold text-slate-700">
            Komentar
            <textarea
              required
              maxLength={500}
              rows={5}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder="Tulis apresiasi atau pesan yang membangun..."
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{content.length}/500</span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Mengirim..." : "Kirim komentar"}
            </button>
          </div>
          {message && (
            <p role="status" className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              {message}
            </p>
          )}
        </form> : <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
          <p className="text-sm leading-6 text-slate-700">Masuk terlebih dahulu untuk menulis komentar dengan identitas akunmu.</p>
          <Link href="/login" className="mt-4 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">Masuk untuk berkomentar →</Link>
        </div>}
      </div>

      <div className="rounded-[1.6rem] bg-slate-950 p-6 text-white sm:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Komentar terbaru</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight">Pesan dari pengunjung</h2>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
            {comments.length} komentar
          </span>
        </div>

        <div className="mt-6 max-h-[31rem] space-y-3 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm leading-6 text-slate-400">
              Belum ada komentar. Jadilah orang pertama yang memberi apresiasi.
            </div>
          ) : (
            comments.map((comment) => (
              <article key={comment.id} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold text-white">{comment.authorName}</p>
                  <time dateTime={comment.createdAt} className="text-xs text-slate-400">
                    {formatDate(comment.createdAt)}
                  </time>
                </div>
                {/* SENGAJA RENTAN: stored XSS di komentar website biasa. */}
                <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300"
                  dangerouslySetInnerHTML={{ __html: comment.content }} />
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
