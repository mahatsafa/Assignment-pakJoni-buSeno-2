import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { validateLogin } from "@/lib/auth-validation";
import { HttpError, readJsonBody, requireSameOrigin, rateLimit } from "@/lib/http-security";
import { apiError } from "@/lib/api-error";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    rateLimit("login:global", 60, 60_000);
    const { identifier, password } = validateLogin(await readJsonBody(request));
    rateLimit(`login:${createHash("sha256").update(identifier).digest("hex")}`, 10, 15 * 60_000);
    const account = await authenticate(identifier, password);
    if (!account) throw new HttpError("Email/username atau password salah.", 401);
    await createSession(account.id);
    return NextResponse.json({ account }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
