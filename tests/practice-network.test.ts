import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, copyFile, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { getPracticeLanOrigin, isPrivateIPv4 } from "../lib/practice-network.mjs";
import { allowPracticeRequest } from "../lib/practice-guard.ts";
import { cookieOptions } from "../lib/auth-cookie.ts";
import { HttpError, requireSameOrigin } from "../lib/http-security.ts";

const env = { NODE_ENV: "development", PRACTICE_HOST: "10.132.14.120", APP_ORIGIN: "http://10.132.14.120:3001" };

test("IP praktikum harus berupa IPv4 privat kanonis", () => {
  for (const ip of ["10.132.14.120", "10.42.172.185", "172.16.1.2", "172.31.5.6", "192.168.1.10"]) {
    assert.equal(isPrivateIPv4(ip), true);
  }
  for (const ip of [undefined, "", "0.0.0.0", "8.8.8.8", "127.0.0.1", "172.15.1.1", "172.32.1.1", "10.256.1.1",
    "010.132.14.120", "10.132.14.120.evil.test", "10.132.14.120:3001", "10.132.14.120/25", "10.132.14.120\n"]) {
    assert.equal(isPrivateIPv4(ip), false);
  }
});

test("origin LAN hanya aktif dengan IP yang dipilih pada development", () => {
  assert.equal(getPracticeLanOrigin(env)?.origin, env.APP_ORIGIN);
  for (const extra of [{ NODE_ENV: "production" }, { NODE_ENV: "test" }, { PRACTICE_HOST: undefined },
    { PRACTICE_HOST: "0.0.0.0" }, { PRACTICE_HOST: "10.132.14.121" }, { APP_ORIGIN: "http://10.132.14.120:3001/login" },
    { APP_ORIGIN: "http://user@10.132.14.120:3001" }, { APP_ORIGIN: "http://10.132.14.120:3001/?query=1" }]) {
    assert.equal(getPracticeLanOrigin({ ...env, ...extra }), null);
  }
});

test("proxy mengizinkan hanya Host LAN terpilih beserta portnya", () => {
  assert.equal(allowPracticeRequest("10.132.14.120:3001", "development", env), true);
  for (const host of ["10.132.14.120:3000", "10.132.14.121:3001", "10.42.172.185:3001", "10.132.14.120.evil.test:3001", "example.test"]) {
    assert.equal(allowPracticeRequest(host, "development", env), false);
  }
  assert.equal(allowPracticeRequest("10.132.14.120:3001", "production", env), false);
  assert.equal(allowPracticeRequest("10.132.14.120:3001", "development", {}), false);
});

test("form LAN tetap memerlukan Origin persis, bukan sembarang alamat privat", () => {
  const request = (origin?: string) => new Request("http://127.0.0.1:3000/api/auth/register", {
    headers: origin ? { Origin: origin } : undefined,
  });
  requireSameOrigin(request(env.APP_ORIGIN), env);
  for (const origin of [undefined, "null", "http://10.132.14.121:3001", "http://10.132.14.120:3000", "https://10.132.14.120:3001", "http://localhost:3001"]) {
    assert.throws(() => requireSameOrigin(request(origin), env), (e: unknown) => e instanceof HttpError && e.status === 403);
  }
});

test("cookie login HTTP berfungsi hanya pada LAN terpilih atau loopback", () => {
  assert.deepEqual(cookieOptions(env), { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
  assert.equal(cookieOptions({ NODE_ENV: "development", APP_ORIGIN: "http://127.0.0.1:3001" }).secure, false);
  assert.equal(cookieOptions({ NODE_ENV: "production", APP_ORIGIN: "https://school.example.test" }).secure, true);
  for (const extra of [{ NODE_ENV: "production" }, { PRACTICE_HOST: undefined }, { PRACTICE_HOST: "10.132.14.121" },
    { APP_ORIGIN: "http://school.example.test" }, { APP_ORIGIN: "file:///tmp" }]) {
    assert.throws(() => cookieOptions({ ...env, ...extra }), HttpError);
  }
});

test("script alamat menjaga password dan isi env lain, serta menolak input keliru", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "tkj-lan-config-"));
  try {
    await mkdir(path.join(root, "scripts"));
    await mkdir(path.join(root, "lib"));
    for (const name of ["scripts/set-practice-host.mjs", "lib/practice-network.mjs"]) {
      await copyFile(new URL(`../${name}`, import.meta.url), path.join(root, name));
    }
    const target = path.join(root, ".env.docker.local");
    const original = '# keep comment\nDB_PASSWORD="dummy $ # value"\nDB_ROOT_PASSWORD=dummy_root\nNEXT_PUBLIC_SCHOOL_NAME=Sekolah Uji\nPRACTICE_WEB_PORT=3000\n';
    await writeFile(target, original);
    const run = (...args: string[]) => spawnSync(process.execPath, [path.join(root, "scripts/set-practice-host.mjs"), ...args], { encoding: "utf8" });
    const configured = run("127.0.0.1", "3001");
    assert.equal(configured.status, 0, configured.stderr);
    const updated = await readFile(target, "utf8");
    assert.equal(updated, original.replace("PRACTICE_WEB_PORT=3000", "PRACTICE_WEB_PORT=3001") + "PRACTICE_HOST=127.0.0.1\n");
    assert.equal(run("127.0.0.1", "3001").status, 0);
    assert.equal(await readFile(target, "utf8"), updated);
    for (const args of [["0.0.0.0", "3001"], ["127.0.0.1", "65536"], ["127.0.0.1", "0"]]) {
      assert.notEqual(run(...args).status, 0);
      assert.equal(await readFile(target, "utf8"), updated);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
