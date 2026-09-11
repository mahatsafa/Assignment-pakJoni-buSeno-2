import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildPracticeSearchQuery, validatePracticeComment, resolvePracticeFile } from "../lib/practice.ts";
import { allowPracticeRequest, requirePracticeDatabase } from "../lib/practice-guard.ts";

test("query latihan menyisipkan input mentah (uji konstruksi, bukan eksekusi MariaDB)", () => {
  const input = "' UNION SELECT id,username,email,NULL FROM users #";
  assert.equal(buildPracticeSearchQuery(input), `SELECT id, nama_lengkap, keahlian, foto FROM siswa WHERE nama_lengkap LIKE '%${input}%' ORDER BY nama_lengkap ASC`);
});

test("komentar latihan mempertahankan HTML, tetapi membatasi ID dan panjang", () => {
  const content = '<img src=x onerror="alert(1)">';
  assert.equal(validatePracticeComment({ studentId: 1, authorName: "siswa", content }).content, content);
  assert.throws(() => validatePracticeComment({ studentId: "1 OR 1=1", authorName: "siswa", content }));
  assert.throws(() => validatePracticeComment({ studentId: 1, authorName: "siswa", content: "x".repeat(501) }));
});

test("traversal fixture benar-benar lolos, file luar dan symlink ditolak", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tkj-path-test-"));
  const photos = path.join(root, "public", "uploads", "siswa");
  const fixture = path.join(root, "security-fixtures", "demo-secret.txt");
  try {
    await mkdir(photos, { recursive: true });
    await mkdir(path.dirname(fixture));
    await writeFile(path.join(photos, "siswa.png"), "dummy-image");
    await writeFile(fixture, "DEMO{path_traversal_understood}");
    await writeFile(path.join(root, "private.txt"), "fixture-not-a-real-secret");
    await symlink(path.join(root, "private.txt"), path.join(photos, "link.png"));
    assert.equal(await resolvePracticeFile(photos, "siswa.png", fixture), path.join(photos, "siswa.png"));
    assert.equal(await resolvePracticeFile(photos, "../../../security-fixtures/demo-secret.txt", fixture), fixture);
    assert.equal(await resolvePracticeFile(photos, "../../../private.txt", fixture), null);
    assert.equal(await resolvePracticeFile(photos, "../../../.env.local", fixture), null);
    assert.equal(await resolvePracticeFile(photos, "link.png", fixture), null);
  } finally {
    // Hanya direktori sementara buatan test ini, bukan project/data pengguna.
    await rm(root, { recursive: true, force: true });
  }
});

test("pengaman menolak production, host publik, dan DB bukan latihan", () => {
  assert.equal(allowPracticeRequest("127.0.0.1:3000", "development"), true);
  assert.equal(allowPracticeRequest("localhost:3000", "production"), false);
  assert.equal(allowPracticeRequest("website.example", "development"), false);
  assert.equal(allowPracticeRequest("127.0.0.1.attacker.test", "development"), false);
  const env = { NODE_ENV: "development", DB_HOST: "127.0.0.1", DB_NAME: "tkj3_practice" };
  requirePracticeDatabase(env);
  assert.throws(() => requirePracticeDatabase({ ...env, DB_NAME: "tkj3_profile" }));
  assert.throws(() => requirePracticeDatabase({ ...env, DB_HOST: "db.example" }));
  assert.throws(() => requirePracticeDatabase({ ...env, NODE_ENV: "production" }));
});
