import { HttpError } from "./http-security.ts";
import { getPracticeLanOrigin } from "./practice-network.mjs";

export function cookieOptions(env: Readonly<Record<string, string | undefined>> = process.env) {
  if (env.NODE_ENV === "production" && !env.APP_ORIGIN) {
    throw new HttpError("APP_ORIGIN belum diatur pada server.", 503);
  }
  let url: URL;
  try {
    url = new URL(env.APP_ORIGIN || "http://127.0.0.1:3000");
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash) throw new Error();
  } catch {
    throw new HttpError("APP_ORIGIN tidak valid pada server.", 503);
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const selectedLan = getPracticeLanOrigin(env)?.origin === url.origin;
  if (url.protocol !== "https:" && !loopback && !selectedLan) {
    throw new HttpError("Login HTTP memerlukan localhost atau IP praktikum yang dipilih lewat PRACTICE_HOST.", 503);
  }
  return { httpOnly: true, sameSite: "lax" as const, secure: url.protocol === "https:", path: "/" };
}
