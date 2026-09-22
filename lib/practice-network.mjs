/** @param {string | undefined} value */
export function isPrivateIPv4(value) {
  if (!value || !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return false;
  const parts = value.split(".");
  const octets = parts.map(Number);
  if (octets.some((n, i) => n > 255 || String(n) !== parts[i])) return false;
  return octets[0] === 10 || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168);
}

/** @param {Readonly<Record<string, string | undefined>>} env */
export function getPracticeLanOrigin(env = process.env) {
  // Host LAN dipilih secara eksplisit. Jangan menerima semua IP privat atau wildcard.
  if (env.NODE_ENV !== "development" || !isPrivateIPv4(env.PRACTICE_HOST)) return null;
  try {
    const url = new URL(env.APP_ORIGIN || "");
    if (!["http:", "https:"].includes(url.protocol) || url.hostname !== env.PRACTICE_HOST ||
        url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}
