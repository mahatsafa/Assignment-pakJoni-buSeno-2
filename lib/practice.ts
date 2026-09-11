// SENGAJA RENTAN — hanya untuk praktikum di localhost dengan database dummy.
import path from "node:path";
import { realpath } from "node:fs/promises";
import { parsePositiveInteger, sanitizePlainText, ValidationError } from "./validation.ts";

export function buildPracticeSearchQuery(search: string): string {
  // SQL INJECTION: input menjadi bagian dari SQL, bukan parameter.
  return `SELECT id, nama_lengkap, keahlian, foto FROM siswa WHERE nama_lengkap LIKE '%${search}%' ORDER BY nama_lengkap ASC`;
}

export function validatePracticeComment(body: Record<string, unknown>) {
  const studentId = parsePositiveInteger(body.studentId);
  if (!studentId) throw new ValidationError("ID siswa tidak valid.");
  if (typeof body.content !== "string" || !body.content.trim() || body.content.length > 500) {
    throw new ValidationError("Komentar wajib diisi, maksimal 500 karakter.");
  }
  return {
    studentId,
    authorName: sanitizePlainText(body.authorName, 60),
    // STORED XSS: tidak ada sanitasi HTML; sink rentan di CommentSection.
    content: body.content.trim(),
  };
}

export async function resolvePracticeFile(base: string, filename: string, fixture: string): Promise<string | null> {
  if (!filename || filename.length > 300 || filename.includes("\0")) return null;
  // PATH TRAVERSAL: ../ boleh keluar dari folder foto.
  const candidate = path.resolve(base, filename);
  const expectedFixture = path.resolve(fixture);
  const photoBase = path.resolve(base);
  const withinPhotos = (file: string, directory: string) => {
    const relative = path.relative(directory, file);
    return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
  };
  // Pagar luar praktikum: selain foto hanya SATU fixture dummy ini yang diizinkan.
  if (!withinPhotos(candidate, photoBase) && candidate !== expectedFixture) return null;
  const [actual, actualBase] = await Promise.all([realpath(candidate), realpath(photoBase)]);
  if (candidate === expectedFixture) return actual === expectedFixture ? actual : null;
  return withinPhotos(actual, actualBase) ? actual : null;
}
