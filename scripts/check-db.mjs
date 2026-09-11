import mysql from "mysql2/promise";

function required(name, fallback) {
  const value = process.env[name]?.trim() || fallback;
  if (!value) throw new Error(`${name} belum diisi di .env.local`);
  return value;
}

let connection;

try {
  connection = await mysql.createConnection({
    host: required("DB_HOST", "127.0.0.1"),
    port: Number(required("DB_PORT", "3306")),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
    charset: "utf8mb4",
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
} catch (error) {
  console.error("Pemeriksaan MariaDB gagal:", error.message);
  if (error.code === "ER_NO_SUCH_TABLE") console.error("Jalankan migrasi 001 (komentar) dan 002 (akun) pada database ini.");
  process.exitCode = 1;
} finally {
  await connection?.end();
}
