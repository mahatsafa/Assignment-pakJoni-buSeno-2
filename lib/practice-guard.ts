import { getPracticeLanOrigin } from "./practice-network.mjs";

export function requirePracticeDatabase(env: Readonly<Record<string, string | undefined>> = process.env) {
  if (env.NODE_ENV === "production") {
    throw new Error("Versi vulnerable hanya boleh dijalankan dalam mode development untuk praktikum.");
  }
  if (!["127.0.0.1", "localhost", "::1"].includes(env.DB_HOST || "127.0.0.1") ||
      !/_(practice|test)$/.test(env.DB_NAME || "")) {
    throw new Error("Gunakan MariaDB loopback dengan database berakhiran _practice atau _test, bukan database asli.");
  }
}

export function allowPracticeRequest(
  host: string,
  nodeEnv: string | undefined,
  env: Readonly<Record<string, string | undefined>> = process.env,
) {
  if (nodeEnv === "production") return false;
  if (/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host)) return true;
  return getPracticeLanOrigin({ ...env, NODE_ENV: nodeEnv })?.host === host;
}
