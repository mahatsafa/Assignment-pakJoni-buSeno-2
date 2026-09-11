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
