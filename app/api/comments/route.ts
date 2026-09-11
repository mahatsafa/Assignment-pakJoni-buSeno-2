import { NextResponse } from "next/server";
import { createComment } from "@/lib/comments";
import { validatePracticeComment } from "@/lib/practice";
import { getCurrentAccount } from "@/lib/auth";
import { HttpError, readJsonBody, requireSameOrigin, rateLimit } from "@/lib/http-security";
import { apiError } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const account = await getCurrentAccount();
    if (!account) throw new HttpError("Silakan masuk untuk menulis komentar.", 401);
    rateLimit(`comment:${account.id}`, 15, 60_000);
    const body = await readJsonBody(request);
    const payload = validatePracticeComment({ ...body, authorName: account.username });

    const comment = await createComment({
      studentId: payload.studentId,
      authorName: payload.authorName,
      content: payload.content,
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "STUDENT_NOT_FOUND") {
      return NextResponse.json({ message: "Siswa tidak ditemukan." }, { status: 404 });
    }

    return apiError(error);
  }
}
