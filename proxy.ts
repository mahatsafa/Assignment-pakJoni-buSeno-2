import { NextResponse, type NextRequest } from "next/server";
import { allowPracticeRequest } from "@/lib/practice-guard";

// Tidak ada pengecualian route: production ditolak termasuk API dan file publik.
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const forwarded = request.headers.get("x-forwarded-host");
  if (!allowPracticeRequest(host, process.env.NODE_ENV) || (forwarded && forwarded !== host)) {
    return new NextResponse("Alamat ini belum diizinkan untuk praktikum. Gunakan localhost atau IP PRACTICE_HOST yang sesuai APP_ORIGIN pada mode development.", { status: 503 });
  }
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
