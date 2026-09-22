import { readFile, writeFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { isPrivateIPv4 } from "../lib/practice-network.mjs";

try {
  const [host, port] = process.argv.slice(2);
  if (!host || !port || process.argv.length !== 4) {
    throw new Error("Pemakaian: node scripts/set-practice-host.mjs 10.132.14.120 3001");
  }
  if (host !== "127.0.0.1" && !isPrivateIPv4(host)) {
    throw new Error("Pilih IP privat laptop (10.x.x.x, 172.16–31.x.x, atau 192.168.x.x), atau 127.0.0.1.");
  }
  if (!/^[1-9]\d{0,4}$/.test(port) || Number(port) > 65535) {
    throw new Error("Port harus 1–65535.");
  }
  if (host !== "127.0.0.1" && !Object.values(networkInterfaces()).flat().some((entry) => entry?.address === host)) {
    throw new Error("IP itu tidak ada pada laptop ini. Jalankan ip -br -4 addr dan pilih IP laptop yang aktif.");
  }
  const target = new URL("../.env.docker.local", import.meta.url);
  let content = await readFile(target, "utf8");
  for (const [key, value] of [["PRACTICE_HOST", host], ["PRACTICE_WEB_PORT", port]]) {
    const pattern = new RegExp(`^(?:export\\s+)?${key}\\s*=.*$`, "gm");
    content = pattern.test(content) ? content.replace(pattern, `${key}=${value}`)
      : `${content.replace(/\s*$/, "")}\n${key}=${value}\n`;
  }
  await writeFile(target, content, { mode: 0o600 });
  console.log(`Alamat praktikum: http://${host}:${port}`);
  console.log("PRACTICE_HOST dan PRACTICE_WEB_PORT diperbarui. Password database dipertahankan.");
  console.log("Jalankan: docker compose --env-file .env.docker.local -f docker-compose.practice.yml up --build --force-recreate -d");
} catch (error) {
  console.error(error.code === "ENOENT" ? ".env.docker.local belum ada. Jalankan dari project Docker yang sudah kamu pakai." : error.message);
  process.exitCode = 1;
}
