import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/http-security";
import { apiError } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await deleteSession();
    return NextResponse.json({ message: "Berhasil keluar." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
