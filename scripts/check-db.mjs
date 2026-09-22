import mysql from "mysql2/promise";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

function required(name, fallback) {
  const value = process.env[name]?.trim() || fallback;
  if (!value) throw new Error(`${name} belum diisi di .env.local`);
  return value;
}

let connection;

async function checkWriteAccess(db) {
  // Rollback hanya dapat menjamin row uji tidak tersimpan pada tabel transaksional.
  const [tables] = await db.query(
    "SELECT TABLE_NAME AS tableName, ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('users', 'sessions', 'student_comments')",
  );
  if (tables.length !== 3 || tables.some((table) => table.engine !== "InnoDB")) {
    throw new Error("Uji tulis memerlukan tabel users, sessions dan student_comments dengan engine InnoDB.");
  }

  const username = `dbcheck_${randomBytes(8).toString("hex")}`;
  const tokenHash = randomBytes(32).toString("hex");
  let testedComment = false;
  await db.beginTransaction();
  try {
    const [account] = await db.execute(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, `${username}@example.test`, `diagnostic-rollback-only:${randomBytes(32).toString("hex")}`],
    );
    const [accounts] = await db.execute("SELECT username FROM users WHERE id = ?", [account.insertId]);
    assert.equal(accounts[0]?.username, username);

    await db.execute(
      "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 8 HOUR))",
      [tokenHash, account.insertId],
    );
    const [sessions] = await db.execute("SELECT user_id FROM sessions WHERE token_hash = ?", [tokenHash]);
    assert.equal(sessions[0]?.user_id, account.insertId);
    const [deleted] = await db.execute("DELETE FROM sessions WHERE token_hash = ?", [tokenHash]);
    assert.equal(deleted.affectedRows, 1);

    const [students] = await db.query("SELECT id FROM siswa ORDER BY id LIMIT 1");
    if (students[0]) {
      const [comment] = await db.execute(
        "INSERT INTO student_comments (student_id, author_name, content) VALUES (?, ?, ?)",
        [students[0].id, username, "Uji izin tulis sementara; transaksi ini akan di-rollback."],
      );
      const [comments] = await db.execute("SELECT author_name FROM student_comments WHERE id = ?", [comment.insertId]);
      assert.equal(comments[0]?.author_name, username);
      testedComment = true;
    }
  } finally {
    await db.rollback();
  }
  const [remaining] = await db.execute("SELECT id FROM users WHERE username = ?", [username]);
  assert.equal(remaining.length, 0);
  console.log("PASS: INSERT/SELECT akun serta INSERT/SELECT/DELETE sesi berhasil; transaksi sudah di-rollback.");
  console.log(testedComment
    ? "PASS: INSERT/SELECT komentar berhasil; transaksi sudah di-rollback."
    : "SKIP: uji tulis komentar belum dijalankan karena tabel siswa kosong.");
  console.log("Tidak ada akun, sesi, atau komentar uji yang disimpan permanen.");
}

try {
  const writeCheck = process.argv.includes("--write");
  if (process.env.APP_ORIGIN) {
    console.log(`Alamat browser dari APP_ORIGIN: ${new URL(process.env.APP_ORIGIN).origin}`);
  }
  if (process.env.DATA_SOURCE === "mock") {
    throw new Error("DATA_SOURCE=mock: aplikasi tidak menyimpan data ke MariaDB. Atur DATA_SOURCE=mariadb dan buat ulang container app.");
  }
  if (writeCheck && (process.env.NODE_ENV === "production" || !/_(practice|test)$/.test(required("DB_NAME")) ||
      !["127.0.0.1", "localhost", "::1"].includes(required("DB_HOST", "127.0.0.1")))) {
    throw new Error("Uji --write hanya untuk MariaDB lokal dengan nama database berakhiran _practice atau _test.");
  }
  connection = await mysql.createConnection({
    host: required("DB_HOST", "127.0.0.1"),
    port: Number(required("DB_PORT", "3306")),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
    charset: "utf8mb4",
    connectTimeout: 10_000,
  });

  const [studentRows] = await connection.query(
    "SELECT COUNT(*) AS total FROM siswa",
  );
  const [commentRows] = await connection.query(
    "SELECT COUNT(*) AS total FROM student_comments",
  );

  console.log("MariaDB terhubung.");
  console.log(`Database: ${required("DB_NAME")}`);
  console.log(`Jumlah siswa: ${studentRows[0].total}`);
  console.log(`Jumlah komentar: ${commentRows[0].total}`);
  const [accountRows] = await connection.query("SELECT COUNT(*) AS total FROM users");
  await connection.query("SELECT token_hash FROM sessions LIMIT 0");
  console.log(`Jumlah akun: ${accountRows[0].total}`);
  console.log("Tabel users dan sessions siap.");
  if (writeCheck) await checkWriteAccess(connection);
} catch (error) {
  console.error("Pemeriksaan MariaDB gagal:", error.message);
  if (error.code) console.error("Kode:", error.code);
  if (error.code === "ER_NO_SUCH_TABLE") console.error("Jalankan migrasi 001 (komentar) dan 002 (akun) pada database ini.");
  if (["ER_TABLEACCESS_DENIED_ERROR", "ER_DBACCESS_DENIED_ERROR"].includes(error.code)) console.error("Periksa izin user aplikasi pada database ini; versi Docker memakai docker/practice-init/04-permissions.sql.");
  if (error.code === "ER_ACCESS_DENIED_ERROR") console.error("Password/user aplikasi tidak cocok dengan akun MariaDB. Mengubah file env tidak mengganti password user pada volume DB yang sudah ada.");
  if (["ECONNREFUSED", "ETIMEDOUT"].includes(error.code)) console.error("MariaDB tidak terjangkau dari proses ini. Untuk Docker, jalankan pengecekan melalui exec app, bukan npm run db:check di laptop.");
  process.exitCode = 1;
} finally {
  await connection?.end();
}
