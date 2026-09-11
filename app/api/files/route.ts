import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getImageContentType, studentUploadDirectory } from "@/lib/files";
import { resolvePracticeFile } from "@/lib/practice";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get("name");

  if (!filename) {
    return NextResponse.json({ message: "Nama file wajib diisi." }, { status: 400 });
  }

  try {
    // SENGAJA RENTAN: traversal keluar direktori foto menuju fixture dummy.
    const fixture = path.resolve(process.cwd(), "security-fixtures", "demo-secret.txt");
    const resolved = await resolvePracticeFile(studentUploadDirectory, filename, fixture);
    if (!resolved) {
      return NextResponse.json({ message: "File di luar batas praktikum ditolak." }, { status: 400 });
    }
    const file = await readFile(resolved);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": resolved === fixture ? "text/plain; charset=utf-8" : getImageContentType(filename),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;

    if (code === "ENOENT") {
      return NextResponse.json({ message: "File tidak ditemukan." }, { status: 404 });
    }

    console.error("File read failed", error);
    return NextResponse.json(
      { message: "File belum dapat dibuka." },
      { status: 500 },
    );
  }
}
