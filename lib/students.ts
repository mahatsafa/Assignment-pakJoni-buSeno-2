import "server-only";

import type { RowDataPacket } from "mysql2/promise";
import { getDatabasePool } from "@/lib/db";
import { isMockDataSource, mockStudents } from "@/lib/mock-data";
import type { StudentProfile, StudentSummary } from "@/lib/types";
import { normalizeSearchQuery, parsePositiveInteger } from "@/lib/validation";
import { buildPracticeSearchQuery } from "@/lib/practice";

interface CountRow extends RowDataPacket {
  total: number;
}

interface StudentSummaryRow extends RowDataPacket {
  id: number;
  nama_lengkap: string;
  keahlian: string | null;
  foto: string | null;
}

interface StudentProfileRow extends StudentSummaryRow {
  nama_panggilan: string | null;
  kelas: string;
  skill: string | null;
  minat_hobi: string | null;
  cita_cita: string | null;
  deskripsi: string | null;
}

function toStudentSummary(row: StudentSummaryRow): StudentSummary {
  return {
    id: row.id,
    namaLengkap: row.nama_lengkap,
    keahlian: row.keahlian,
    foto: row.foto,
  };
}

function toStudentProfile(row: StudentProfileRow): StudentProfile {
  return {
    ...toStudentSummary(row),
    namaPanggilan: row.nama_panggilan,
    kelas: row.kelas,
    skill: row.skill,
    minatHobi: row.minat_hobi,
    citaCita: row.cita_cita,
    deskripsi: row.deskripsi,
  };
}

export async function getStudentCount(): Promise<number> {
  if (isMockDataSource()) return mockStudents.length;

  const [rows] = await getDatabasePool().execute<CountRow[]>(
    "SELECT COUNT(*) AS total FROM siswa",
  );
  return Number(rows[0]?.total ?? 0);
}

export async function getFeaturedStudents(): Promise<StudentSummary[]> {
  if (isMockDataSource()) return mockStudents.slice(0, 4);

  const [rows] = await getDatabasePool().execute<StudentSummaryRow[]>(
    `SELECT id, nama_lengkap, keahlian, foto
     FROM siswa
     WHERE foto IS NOT NULL AND foto <> ''
     ORDER BY nama_lengkap ASC
     LIMIT 4`,
  );

  return rows.map(toStudentSummary);
}

export async function getStudents(rawSearch = ""): Promise<StudentSummary[]> {
  const search = normalizeSearchQuery(rawSearch);

  if (isMockDataSource()) {
    const normalizedSearch = search.toLocaleLowerCase("id-ID");
    return mockStudents.filter(
      (student) => !normalizedSearch || student.namaLengkap.toLocaleLowerCase("id-ID").includes(normalizedSearch),
    );
  }

  const pool = getDatabasePool();

  if (!search) {
    const [rows] = await pool.execute<StudentSummaryRow[]>(
      `SELECT id, nama_lengkap, keahlian, foto
       FROM siswa
       ORDER BY nama_lengkap ASC`,
    );
    return rows.map(toStudentSummary);
  }

  // SENGAJA RENTAN: string input langsung dipakai pada query MariaDB.
  const [rows] = await pool.query<StudentSummaryRow[]>(buildPracticeSearchQuery(search));
  return rows.map(toStudentSummary);
}

export async function getStudentById(rawId: unknown): Promise<StudentProfile | null> {
  const id = parsePositiveInteger(rawId);
  if (!id) return null;

  if (isMockDataSource()) {
    return mockStudents.find((student) => student.id === id) ?? null;
  }

  const [rows] = await getDatabasePool().execute<StudentProfileRow[]>(
    `SELECT id, nama_lengkap, nama_panggilan, kelas, keahlian, skill,
            minat_hobi, cita_cita, deskripsi, foto
     FROM siswa
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] ? toStudentProfile(rows[0]) : null;
}
