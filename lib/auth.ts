import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDatabasePool } from "@/lib/db";
import { isMockDataSource } from "@/lib/mock-data";
import { hashPassword, verifyPassword } from "@/lib/password";
import { HttpError } from "@/lib/http-security";

export type Account = { id: number; username: string; email: string };
interface AccountRow extends RowDataPacket, Account { password_hash: string }
const COOKIE = "tkj3_practice_session";
const SESSION_SECONDS = 60 * 60 * 8;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const publicAccount = (row: Account): Account => ({ id: row.id, username: row.username, email: row.email });

function requireDatabase() {
  if (isMockDataSource()) {
    throw new HttpError("Login perlu MariaDB. Atur DATA_SOURCE=mariadb dan jalankan migrasi akun.", 503);
  }
}

function cookieOptions() {
  const origin = process.env.APP_ORIGIN;
  if (process.env.NODE_ENV === "production" && !origin) {
    throw new HttpError("APP_ORIGIN belum diatur pada server.", 503);
  }
  const url = new URL(origin || "http://127.0.0.1:3000");
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new HttpError("Login di luar localhost memerlukan HTTPS.", 503);
  }
  return { httpOnly: true, sameSite: "lax" as const, secure: url.protocol === "https:", path: "/" };
}

export async function registerAccount(input: { username: string; email: string; password: string }): Promise<Account> {
  requireDatabase();
  const passwordHash = await hashPassword(input.password);
  try {
    const [result] = await getDatabasePool().execute<ResultSetHeader>(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [input.username, input.email, passwordHash],
    );
    return { id: result.insertId, username: input.username, email: input.email };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") {
      throw new HttpError("Username atau email sudah digunakan.", 409);
    }
    throw error;
  }
}

// Dummy hash juga memakai scrypt supaya pengguna tak dikenal tetap melakukan verifikasi mahal.
let dummyHash: Promise<string> | undefined;
export async function authenticate(identifier: string, password: string): Promise<Account | null> {
  requireDatabase();
  const [rows] = await getDatabasePool().execute<AccountRow[]>(
    "SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1",
    [identifier, identifier],
  );
  const row = rows[0];
  const encoded = row?.password_hash ?? await (dummyHash ??= hashPassword(randomBytes(32).toString("hex")));
  const valid = await verifyPassword(password, encoded);
  return row && valid ? publicAccount(row) : null;
}

export async function createSession(userId: number) {
  const options = cookieOptions();
  const jar = await cookies();
  const pool = getDatabasePool();
  const token = randomBytes(32).toString("hex");
  const previous = jar.get(COOKIE)?.value;
  await pool.execute("DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()");
  if (previous) await pool.execute("DELETE FROM sessions WHERE token_hash = ?", [digest(previous)]);
  await pool.execute(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 8 HOUR))",
    [digest(token), userId],
  );
  jar.set(COOKIE, token, { ...options, maxAge: SESSION_SECONDS });
}

export async function getCurrentAccount(): Promise<Account | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token) || isMockDataSource()) return null;
  const [rows] = await getDatabasePool().execute<AccountRow[]>(
    `SELECT u.id, u.username, u.email FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1`,
    [digest(token)],
  );
  return rows[0] ? publicAccount(rows[0]) : null;
}

export async function deleteSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && !isMockDataSource()) {
    await getDatabasePool().execute("DELETE FROM sessions WHERE token_hash = ?", [digest(token)]);
  }
  jar.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}
