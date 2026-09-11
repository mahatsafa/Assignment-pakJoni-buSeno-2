import { NextResponse, type NextRequest } from "next/server";
import { allowPracticeRequest } from "@/lib/practice-guard";

// Tidak ada pengecualian route: production ditolak termasuk API dan file publik.
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const forwarded = request.headers.get("x-forwarded-host");
  if (!allowPracticeRequest(host, process.env.NODE_ENV) || (forwarded && forwarded !== host)) {
    return new NextResponse("Versi praktikum tidak tersedia di production/host publik. Jalankan npm run dev di 127.0.0.1.", { status: 503 });
  }
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
