import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { resolveFileInsideDirectory } from "../lib/path-safety.ts";
import {
  escapeLikePattern,
  normalizeSearchQuery,
  parsePositiveInteger,
  sanitizePlainText,
  validateCommentPayload,
  ValidationError,
} from "../lib/validation.ts";

test("parsePositiveInteger hanya menerima bilangan bulat positif", () => {
  assert.equal(parsePositiveInteger("12"), 12);
  assert.equal(parsePositiveInteger("1 OR 1=1"), null);
  assert.equal(parsePositiveInteger("../1"), null);
  assert.equal(parsePositiveInteger(-1), null);
});

test("query pencarian dinormalisasi dan wildcard LIKE di-escape", () => {
  assert.equal(normalizeSearchQuery("  Muhammad   Faris  "), "Muhammad Faris");
  assert.equal(escapeLikePattern("100%_aman"), "100\\%\\_aman");
});

test("helper validasi repaired menghasilkan teks biasa", () => {
  assert.equal(sanitizePlainText("<b>Halo</b>", 100), "bHalo/b");
  assert.throws(() => sanitizePlainText("", 100), ValidationError);

  const payload = validateCommentPayload({
    studentId: "2",
    authorName: "Nika",
    content: "<script>alert(1)</script>Bagus!",
  });

  assert.equal(payload.studentId, 2);
  assert.equal(payload.content.includes("<"), false);
  assert.equal(payload.content.includes(">"), false);
});

test("helper path repaired menolak traversal dan ekstensi non-gambar", () => {
  const base = path.resolve("/tmp/student-photos");

  assert.equal(
    resolveFileInsideDirectory(base, "muhammad-faris-anshori.jpg"),
    path.join(base, "muhammad-faris-anshori.jpg"),
  );
  assert.equal(resolveFileInsideDirectory(base, "../../.env.local"), null);
  assert.equal(resolveFileInsideDirectory(base, "%2e%2e%2f.env"), null);
  assert.equal(resolveFileInsideDirectory(base, "shell.php"), null);
});
