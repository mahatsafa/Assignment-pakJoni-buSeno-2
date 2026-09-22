import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../lib/password.ts";
import { validateLogin, validateRegistration } from "../lib/auth-validation.ts";
import { HttpError, rateLimit, readJsonBody, requireSameOrigin } from "../lib/http-security.ts";

test("password memakai salt unik dan verifikasi menolak password salah", async () => {
  const password = "Password latihan 123!";
  const a = await hashPassword(password);
  const b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(a.includes(password), false);
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword("password salah", a), false);
  assert.equal(await verifyPassword(password, "hash-rusak"), false);
});

test("registrasi menormalisasi identitas dan menjaga password apa adanya", () => {
  const account = validateRegistration({ username: "SISWA_demo", email: "Siswa@Example.test", password: "  password latihan  " });
  assert.equal(account.username, "siswa_demo");
  assert.equal(account.email, "siswa@example.test");
  assert.equal(account.password, "  password latihan  ");
  for (const username of ["ab", "<script>", "admin' #", "a".repeat(31)]) {
    assert.throws(() => validateRegistration({ ...account, username }));
  }
  assert.throws(() => validateRegistration({ ...account, password: "pendek" }));
  assert.throws(() => validateRegistration({ ...account, email: "bukan-email" }));
});

test("login menerima email atau username sebagai data", () => {
  assert.equal(validateLogin({ identifier: " SISWA ", password: "abc" }).identifier, "siswa");
  assert.equal(validateLogin({ identifier: "' OR 1=1 #", password: "abc" }).identifier, "' or 1=1 #");
  assert.throws(() => validateLogin({ identifier: {}, password: "abc" }));
  assert.throws(() => validateLogin({ identifier: "siswa", password: "" }));
});

test("mutasi menolak Origin asing atau tanpa Origin", () => {
  const previous = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = "http://127.0.0.1:3000";
  try {
    requireSameOrigin(new Request("http://127.0.0.1:3000/api/auth/login", { headers: { Origin: "http://127.0.0.1:3000" } }));
    assert.throws(() => requireSameOrigin(new Request("http://127.0.0.1:3000", { headers: { Origin: "https://other.example" } })), HttpError);
    assert.throws(() => requireSameOrigin(new Request("http://127.0.0.1:3000")), HttpError);
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previous;
  }
});

test("Docker menerima alias loopback pada port browser yang dikonfigurasi", () => {
  const env = { NODE_ENV: "development", APP_ORIGIN: "http://127.0.0.1:3001/" };
  for (const origin of ["http://127.0.0.1:3001", "http://localhost:3001", "http://[::1]:3001"]) {
    // Request URL dapat berisi port INTERNAL container, bukan port browser.
    requireSameOrigin(new Request("http://127.0.0.1:3000/api/auth/register", { headers: { Origin: origin } }), env);
  }
  requireSameOrigin(new Request("http://localhost:3000/api/auth/login", {
    headers: { Origin: "http://127.0.0.1:3001" },
  }), { ...env, APP_ORIGIN: "http://localhost:3001" });
});

test("alias lokal tidak mengizinkan port lain, protokol lain atau domain mirip", () => {
  const env = { NODE_ENV: "development", APP_ORIGIN: "http://127.0.0.1:3001" };
  for (const origin of [undefined, "null", "not a URL", "http://localhost:3000", "https://localhost:3001",
    "http://localhost.evil.test:3001", "http://127.0.0.1.evil.test:3001", "http://127.0.0.2:3001",
    "http://192.168.1.5:3001", "http://localhost:3001/path", "http://user@localhost:3001",
    "http://localhost:3001#fragment", "http://localhost:3001/?query=1"]) {
    const headers: Record<string, string> = origin ? { Origin: origin, "X-Forwarded-Host": "localhost:3001" } : {};
    assert.throws(() => requireSameOrigin(new Request("http://127.0.0.1:3000/api/auth/register", { headers }), env),
      (error: unknown) => error instanceof HttpError && error.status === 403);
  }
});

test("production tetap memerlukan Origin persis dan konfigurasi valid", () => {
  const request = new Request("http://127.0.0.1:3000", { headers: { Origin: "http://localhost:3001" } });
  assert.throws(() => requireSameOrigin(request, { NODE_ENV: "production", APP_ORIGIN: "http://127.0.0.1:3001" }), HttpError);
  assert.throws(() => requireSameOrigin(request, { NODE_ENV: "production" }),
    (error: unknown) => error instanceof HttpError && error.status === 503);
  for (const APP_ORIGIN of ["invalid", "http://user:password@localhost:3001", "http://localhost:3001/register", "file:///tmp", "https://example.test/?q=1"]) {
    assert.throws(() => requireSameOrigin(request, { NODE_ENV: "development", APP_ORIGIN }),
      (error: unknown) => error instanceof HttpError && error.status === 503);
  }
  requireSameOrigin(new Request("http://internal:3000", { headers: { Origin: "https://school.example.test" } }),
    { NODE_ENV: "production", APP_ORIGIN: "https://school.example.test/" });
  assert.throws(() => requireSameOrigin(request, { NODE_ENV: "development", APP_ORIGIN: "https://school.example.test" }), HttpError);
});

test("JSON rusak, array dan body besar ditolak", async () => {
  const request = (body: string) => new Request("http://127.0.0.1", { method: "POST", headers: { "Content-Type": "application/json" }, body });
  assert.deepEqual(await readJsonBody(request('{"username":"siswa"}')), { username: "siswa" });
  await assert.rejects(readJsonBody(request("{")));
  await assert.rejects(readJsonBody(request("[]")));
  await assert.rejects(readJsonBody(request(JSON.stringify({ text: "x".repeat(4096) }))), (error: unknown) => error instanceof HttpError && error.status === 413);
});

test("rate limiter membatasi percobaan", () => {
  const key = `test:${Date.now()}`;
  rateLimit(key, 2, 60_000);
  rateLimit(key, 2, 60_000);
  assert.throws(() => rateLimit(key, 2, 60_000), (error: unknown) => error instanceof HttpError && error.status === 429);
});
