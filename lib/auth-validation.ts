import { ValidationError } from "./validation.ts";

function field(value: unknown, label: string, maximum: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > maximum) {
    throw new ValidationError(`${label} wajib diisi (maksimal ${maximum} karakter).`);
  }
  return value.trim();
}

export function validateRegistration(body: Record<string, unknown>) {
  const username = field(body.username, "Username", 30).toLowerCase();
  const email = field(body.email, "Email", 254).toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    throw new ValidationError("Username: 3–30 huruf kecil, angka, atau underscore.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("Format email tidak valid.");
  }
  const password = body.password;
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    throw new ValidationError("Password harus terdiri dari 12–128 karakter.");
  }
  return { username, email, password };
}

export function validateLogin(body: Record<string, unknown>) {
  const identifier = field(body.identifier, "Email atau username", 254).toLowerCase();
  if (typeof body.password !== "string" || !body.password || body.password.length > 128) {
    throw new ValidationError("Password wajib diisi (maksimal 128 karakter).");
  }
  return { identifier, password: body.password };
}
