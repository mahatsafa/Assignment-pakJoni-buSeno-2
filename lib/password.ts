import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// OWASP scrypt option: N=2^15, r=8, p=3. Salt unik untuk setiap password.
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt);
  return `scrypt-v1$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  if (!/^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded)) return false;
  const [, salt, expected] = encoded.split("$");
  return timingSafeEqual(await derive(password, salt), Buffer.from(expected, "hex"));
}
