import { ValidationError } from "./validation.ts";

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function requireSameOrigin(request: Request) {
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (request.headers.get("origin") !== expected) {
    throw new HttpError("Permintaan harus berasal dari website ini.", 403);
  }
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
