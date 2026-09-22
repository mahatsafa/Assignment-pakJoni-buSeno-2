import { randomBytes } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const target = path.join(root, ".env.docker.local");

try {
  for (const filename of [
    "lib/practice.ts",
    "lib/practice-guard.ts",
    "database/practice-schema.sql",
    "database/migrations/002_add_accounts.sql",
    "docker-compose.practice.yml",
    "docker/practice-init/02-students.sql",
    "docker/practice-init/04-permissions.sql",
    "public/images/kelas-xi-tkj-3.png",
    "security-fixtures/demo-secret.txt",
  ]) {
    await access(path.join(root, filename));
  }

  const content = [
    "# Konfigurasi database Docker praktikum. Simpan file ini untuk menjalankan ulang container.",
    `DB_PASSWORD=${randomBytes(24).toString("hex")}`,
    `DB_ROOT_PASSWORD=${randomBytes(24).toString("hex")}`,
    "PRACTICE_WEB_PORT=3000",
    "NEXT_PUBLIC_SCHOOL_NAME=SMK Telkom Malang",
    "",
  ].join("\n");

  try {
    await writeFile(target, content, { flag: "wx", mode: 0o600 });
    console.log(".env.docker.local dibuat dengan dua password acak. Password tidak ditampilkan.");
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const existing = parseEnv(await readFile(target, "utf8"));
    if (!existing.DB_PASSWORD?.trim() || !existing.DB_ROOT_PASSWORD?.trim()) {
      console.error(".env.docker.local sudah ada tetapi DB_PASSWORD atau DB_ROOT_PASSWORD kosong. Lengkapi file itu dengan password database Docker yang sesuai; file tidak ditimpa.");
      process.exitCode = 1;
      process.exit();
    }
    console.log(".env.docker.local sudah ada; konfigurasi dan password dipertahankan.");
  }
  console.log("Jalankan: docker compose --env-file .env.docker.local -f docker-compose.practice.yml up --build -d");
} catch (error) {
  if (error.code === "ENOENT") {
    console.error("File praktikum belum lengkap. Ekstrak patch di folder web pada branch tugas/foto-login-praktikum.");
  } else {
    console.error("Persiapan Docker gagal:", error.code || error.name);
  }
  process.exitCode = 1;
}
