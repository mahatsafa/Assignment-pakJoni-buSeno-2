export function requirePracticeDatabase(env: Readonly<Record<string, string | undefined>> = process.env) {
  if (env.NODE_ENV === "production") {
    throw new Error("Versi vulnerable hanya boleh dijalankan dengan npm run dev di localhost.");
  }
  if (!["127.0.0.1", "localhost", "::1"].includes(env.DB_HOST || "127.0.0.1") ||
      !/_(practice|test)$/.test(env.DB_NAME || "")) {
    throw new Error("Gunakan MariaDB loopback dengan database berakhiran _practice atau _test, bukan database asli.");
  }
}

export function allowPracticeRequest(host: string, nodeEnv: string | undefined) {
  return nodeEnv !== "production" && /^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host);
}
