import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export async function GET() {
  try {
    const account = await getCurrentAccount();
    return NextResponse.json({ account }, { status: account ? 200 : 401, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
