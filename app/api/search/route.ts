import { NextRequest, NextResponse } from "next/server";
import { getStudents } from "@/lib/students";
import { normalizeSearchQuery } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") || "";
  const query = normalizeSearchQuery(rawQuery);

  try {
    const students = await getStudents(query);
    return NextResponse.json({ data: students, query, total: students.length });
  } catch (error) {
    console.error("Student search failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { message: "Pencarian siswa belum dapat diproses." },
      { status: 500 },
    );
  }
}
