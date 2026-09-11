import "server-only";

import mysql, { type Pool } from "mysql2/promise";
import { isMockDataSource } from "@/lib/mock-data";
import { requirePracticeDatabase } from "@/lib/practice-guard";

const globalForDatabase = globalThis as typeof globalThis & {
  tkj3Pool?: Pool;
};

function requiredEnvironment(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() || fallback;

  if (!value) {
    throw new Error(`Environment variable ${name} belum diatur.`);
  }

  return value;
}

export function getDatabasePool(): Pool {
  requirePracticeDatabase();
  if (!globalForDatabase.tkj3Pool) {
    const port = Number(requiredEnvironment("DB_PORT", "3306"));

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("DB_PORT tidak valid.");
    }

    globalForDatabase.tkj3Pool = mysql.createPool({
      host: requiredEnvironment("DB_HOST", "127.0.0.1"),
      port,
      user: requiredEnvironment("DB_USER"),
      password: requiredEnvironment("DB_PASSWORD"),
      database: requiredEnvironment("DB_NAME"),
      waitForConnections: true,
      connectionLimit: 8,
      maxIdle: 8,
      idleTimeout: 60_000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: "utf8mb4",
    });
  }

  return globalForDatabase.tkj3Pool;
}

export async function checkDatabaseConnection(): Promise<void> {
  if (isMockDataSource()) return;

  const connection = await getDatabasePool().getConnection();
  connection.release();
}
