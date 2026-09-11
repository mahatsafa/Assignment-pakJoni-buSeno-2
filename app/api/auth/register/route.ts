import { NextResponse } from "next/server";
import { registerAccount } from "@/lib/auth";
import { validateRegistration } from "@/lib/auth-validation";
import { HttpError, readJsonBody, requireSameOrigin, rateLimit } from "@/lib/http-security";
import { apiError } from "@/lib/api-error";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    rateLimit("registration", 20, 60_000);
    const input = validateRegistration(await readJsonBody(request));
    if (!input.email.endsWith(".test")) throw new HttpError("Versi latihan hanya menerima email dummy berakhiran .test.", 400);
    await registerAccount(input);
    return NextResponse.json({ message: "Akun berhasil dibuat. Silakan masuk." }, { status: 201 });
  } catch (error) { return apiError(error); }
}
