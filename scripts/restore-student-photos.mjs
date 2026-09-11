import mysql from "mysql2/promise";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Nama dan foto dari seed repo; tidak mengarang skill, hobi, atau deskripsi siswa.
export async function restoreStudentPhotos(connection, records) {
  const counts = { added: 0, linked: 0, preserved: 0, ambiguous: 0 };
  await connection.beginTransaction();
  try {
    for (const record of records) {
      const [rows] = await connection.execute(
        "SELECT id, foto FROM siswa WHERE nama_lengkap = ? OR foto = ? FOR UPDATE",
        [record.namaLengkap, record.foto],
      );
      if (rows.length === 0) {
        await connection.execute(
          "INSERT INTO siswa (nama_lengkap, kelas, foto) VALUES (?, ?, ?)",
          [record.namaLengkap, "XI TKJ 3", record.foto],
        );
        counts.added++;
      } else if (rows.length === 1 && (rows[0].foto === null || rows[0].foto === "")) {
        await connection.execute("UPDATE siswa SET foto = ? WHERE id = ?", [record.foto, rows[0].id]);
        counts.linked++;
      } else if (rows.length === 1) {
        counts.preserved++;
      } else {
        // Nama ganda atau foto dipakai baris lain: jangan menebak identitas siswa.
        counts.ambiguous++;
      }
    }
    await connection.commit();
    return counts;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function main() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const database = process.env.DB_NAME || "";
  if (!["127.0.0.1", "localhost", "::1"].includes(host) || !/_(practice|test)$/.test(database)) {
    throw new Error("Pemulihan ini khusus database lokal berakhiran _practice atau _test.");
  }
  if (process.env.DATA_SOURCE !== "mariadb") throw new Error("Atur DATA_SOURCE=mariadb pada .env.local.");
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) throw new Error("DB_USER dan DB_PASSWORD belum diisi.");
  const records = JSON.parse(await readFile(new URL("../database/student-photos.json", import.meta.url), "utf8"));
  if (!Array.isArray(records) || records.length !== 32) throw new Error("Daftar foto harus berisi 32 siswa.");
  const seen = new Set();
  for (const row of records) {
    if (typeof row.namaLengkap !== "string" || !row.namaLengkap.trim() || row.namaLengkap.length > 150 ||
        typeof row.foto !== "string" || !/^[a-z0-9-]+\.jpg$/.test(row.foto) || seen.has(row.foto)) {
      throw new Error("Daftar nama/foto tidak valid.");
    }
    seen.add(row.foto);
    await access(new URL(`../public/uploads/siswa/${row.foto}`, import.meta.url));
  }
  const connection = await mysql.createConnection({
    host, port: Number(process.env.DB_PORT || 3306), database,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, charset: "utf8mb4",
  });
  try {
    const result = await restoreStudentPhotos(connection, records);
    console.log(`Selesai: ${result.added} siswa ditambahkan, ${result.linked} foto dihubungkan, ${result.preserved} data lama dipertahankan.`);
    if (result.ambiguous) console.log(`${result.ambiguous} entri dilewati karena nama/foto bertabrakan. Periksa data siswa tersebut.`);
    console.log("Buka /siswa lalu refresh. Akun, komentar, dan biodata lama tidak dihapus.");
    console.log("Jika Siswa Contoh masih terlihat, itu data contoh yang sebelumnya ditambahkan; pemulihan ini tidak menghapusnya.");
  } finally {
    await connection.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    // Pesan driver SQL dapat memuat data sensitif; tampilkan kode error saja.
    console.error("Pemulihan gagal:", error.code || error.message);
    process.exitCode = 1;
  });
}
