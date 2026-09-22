import { ValidationError } from "./validation.ts";

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function requireSameOrigin(
  request: Request,
  env: { APP_ORIGIN?: string; NODE_ENV?: string } = process.env,
) {
  const configured = env.APP_ORIGIN?.trim();
  if (env.NODE_ENV === "production" && !configured) {
    throw new HttpError("APP_ORIGIN belum diatur pada server.", 503);
  }

  let expected: URL;
  try {
    expected = new URL(configured || new URL(request.url).origin);
    if (!["http:", "https:"].includes(expected.protocol) || expected.username || expected.password ||
        expected.pathname !== "/" || expected.search || expected.hash) throw new Error();
  } catch {
    throw new HttpError("APP_ORIGIN harus berupa alamat website, misalnya http://127.0.0.1:3001, tanpa path atau query.", 503);
  }

  const origin = request.headers.get("origin");
  if (origin === expected.origin) return;

  // Proxy praktikum menerima kedua nama loopback. Izinkan alias yang eksplisit
  // hanya saat development, dengan protokol dan port browser yang SAMA.
  // Port internal Docker (3000) tidak menggantikan port APP_ORIGIN (mis. 3001).
  if (env.NODE_ENV === "development" && origin && LOOPBACK_HOSTS.has(expected.hostname)) {
    let source: URL | undefined;
    try { source = new URL(origin); } catch { /* Origin tidak valid tetap ditolak. */ }
    if (source && source.origin === origin && LOOPBACK_HOSTS.has(source.hostname) &&
        source.protocol === expected.protocol && source.port === expected.port) return;
  }

  throw new HttpError(`Permintaan harus berasal dari website ini. Buka ${expected.origin} dan coba lagi. Jika port berubah, sesuaikan APP_ORIGIN pada server.`, 403);
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    throw new HttpError("Gunakan Content-Type application/json.", 415);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ValidationError("Data wajib diisi.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw new HttpError("Data terlalu besar (maksimal 4 KB).", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new ValidationError("Data JSON tidak valid.");
  }
}

type Bucket = { count: number; expires: number };
const state = globalThis as typeof globalThis & { tkjRateLimits?: Map<string, Bucket> };
const buckets = state.tkjRateLimits ??= new Map();

// Perlindungan dasar satu proses. Deployment multi-instance perlu limiter bersama.
export function rateLimit(key: string, maximum: number, windowMs: number) {
  const now = Date.now();
  for (const [name, bucket] of buckets) {
    if (bucket.expires <= now) buckets.delete(name);
  }
  const bucket = buckets.get(key) || { count: 0, expires: now + windowMs };
  if (bucket.count >= maximum || (!buckets.has(key) && buckets.size >= 5000)) {
    throw new HttpError("Terlalu banyak percobaan. Coba lagi nanti.", 429);
  }
  bucket.count++;
  buckets.set(key, bucket);
}
