import { NextResponse } from "next/server";
import { HttpError } from "@/lib/http-security";
import { ValidationError } from "@/lib/validation";

export function apiError(error: unknown) {
  if (error instanceof HttpError || error instanceof ValidationError) {
    return NextResponse.json({ message: error.message }, {
      status: error instanceof HttpError ? error.status : 400,
      headers: { "Cache-Control": "no-store" },
    });
  }
  // Jangan log payload, query SQL, cookie, atau password dari error driver.
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "INTERNAL_ERROR";
  console.error("Request failed:", code);
  return NextResponse.json({ message: "Server belum dapat memproses data. Periksa koneksi dan migrasi MariaDB." }, { status: 500 });
}
