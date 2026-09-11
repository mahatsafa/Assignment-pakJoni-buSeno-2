// Opt-in integration test: jalankan hanya terhadap DB lokal *_practice atau *_test.
// Membuat satu siswa dan akun dummy, lalu menghapus HANYA row buatan pengujian ini.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
import { verifyPassword } from "../lib/password.ts";

const vulnerable = process.argv.includes("--vulnerable");
const origin = process.env.APP_ORIGIN || "http://127.0.0.1:3000";
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin) || !["127.0.0.1", "localhost"].includes(process.env.DB_HOST || "") || !/_(practice|test)$/.test(process.env.DB_NAME || "")) {
  throw new Error("Uji hanya pada APP_ORIGIN loopback dan DB_NAME berakhiran _practice atau _test; jangan database asli.");
}
const name = `qa_${randomBytes(6).toString("hex")}`;
const email = `${name}@example.test`;
const password = `QA-only-${randomBytes(16).toString("hex")}`;
let cookie = "";
let db;
let studentId;
let createdAccount = false;
async function api(path, body, method = body ? "POST" : "GET") {
  return fetch(`${origin}${path}`, {
    method, headers: { Origin: origin, "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), redirect: "manual",
  });
}
try {
  db = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  const [result] = await db.execute("INSERT INTO siswa (nama_lengkap, kelas) VALUES (?, ?)", [name, "XI TKJ 3"]);
  studentId = result.insertId;
  assert.equal((await api("/api/auth/me")).status, 401);
  assert.equal((await api("/api/comments", { studentId, content: "test" })).status, 401);
  const registration = await api("/api/auth/register", { username: name, email, password });
  assert.equal(registration.status, 201, await registration.text());
  createdAccount = true;
  assert.equal((await api("/api/auth/register", { username: name, email, password })).status, 409);
  const [accounts] = await db.execute("SELECT password_hash FROM users WHERE username = ?", [name]);
  assert.notEqual(accounts[0].password_hash, password);
  assert.equal(await verifyPassword(password, accounts[0].password_hash), true);
  assert.equal((await api("/api/auth/login", { identifier: name, password: "salah" })).status, 401);
  for (const identifier of [name, email]) {
    const login = await api("/api/auth/login", { identifier, password });
    assert.equal(login.status, 200, await login.text());
    assert.match(login.headers.get("set-cookie") || "", /HttpOnly/i);
    cookie = login.headers.get("set-cookie").split(";")[0];
    const me = await api("/api/auth/me");
    assert.equal((await me.json()).account.email, email);
  }
  const payload = '<img src=x onerror="alert(\'XSS-lokal\')">';
  const comment = await api("/api/comments", { studentId, authorName: "pemalsu", content: payload });
  assert.equal(comment.status, 201, "Komentar login harus tersimpan.");
  const saved = (await comment.json()).comment;
  assert.equal(saved.authorName, name);
  assert.equal(saved.content.includes("<img"), vulnerable);
  const [rows] = await db.execute("SELECT content FROM student_comments WHERE student_id = ?", [studentId]);
  assert.equal(rows[0].content, saved.content);
  const injection = "' UNION SELECT id,username,email,NULL FROM users #";
  const search = await api(`/api/search?q=${encodeURIComponent(injection)}`);
  assert.equal(search.status, 200);
  assert.equal((await search.json()).data.some((row) => row.keahlian === email), vulnerable);
  const traversal = await api("/api/files?name=../../../security-fixtures/demo-secret.txt");
  assert.equal(traversal.status, vulnerable ? 200 : 400);
  if (vulnerable) assert.match(await traversal.text(), /DEMO\{path_traversal_understood\}/);
  assert.equal((await api("/api/files?name=../../../.env.local")).status, 400);
  assert.equal((await api("/api/auth/logout", undefined, "POST")).status, 200);
  // Kirim ulang cookie lama untuk membuktikan sesi dicabut di server.
  assert.equal((await api("/api/auth/me")).status, 401);
  console.log(`PASS: integrasi akun, password hash, sesi, komentar, SQLi dan file (${vulnerable ? "vulnerable" : "repaired"}).`);
  console.log("Eksekusi XSS di browser belum diuji oleh script HTTP ini; ikuti checklist manual.");
} finally {
  if (db) {
    if (studentId) {
      await db.execute("DELETE FROM student_comments WHERE student_id = ?", [studentId]);
      await db.execute("DELETE FROM siswa WHERE id = ? AND nama_lengkap = ?", [studentId, name]);
    }
    if (createdAccount) await db.execute("DELETE FROM users WHERE username = ? AND email = ?", [name, email]);
    await db.end();
  }
}
