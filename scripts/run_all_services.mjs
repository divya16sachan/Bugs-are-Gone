/**
 * Master Microservices Process Manager
 * Starts User, Catalog, Order, and Payment services with isolated DB URLs and low memory footprint.
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const tsxCli = path.join(rootDir, "node_modules", "tsx", "dist", "cli.mjs");

const services = [
  {
    name: "user-service",
    entry: "backend/services/user/src/index.ts",
    port: 3001,
    dbUrl: process.env.DATABASE_URL_USER || "postgresql://postgres:postgres@127.0.0.1:5432/user_db?schema=public",
  },
  {
    name: "catalog-service",
    entry: "backend/services/catalog/src/index.ts",
    port: 3002,
    dbUrl: process.env.DATABASE_URL_CATALOG || "postgresql://postgres:postgres@127.0.0.1:5432/catalog_db?schema=public",
  },
  {
    name: "order-service",
    entry: "backend/services/order/src/index.ts",
    port: 3003,
    dbUrl: process.env.DATABASE_URL_ORDER || "postgresql://postgres:postgres@127.0.0.1:5432/order_db?schema=public",
  },
  {
    name: "payment-service",
    entry: "backend/services/payment/src/index.ts",
    port: 3004,
    dbUrl: process.env.DATABASE_URL_PAYMENT || "postgresql://postgres:postgres@127.0.0.1:5432/payment_db?schema=public",
  },
];

const runningProcesses = [];

function startService(svc) {
  console.log(`[Manager] Starting ${svc.name} on port ${svc.port}...`);
  const proc = spawn(
    process.execPath,
    ["--max-old-space-size=512", tsxCli, path.join(rootDir, svc.entry)],
    {
      cwd: rootDir,
      env: {
        ...process.env,
        PORT: String(svc.port),
        DATABASE_URL: svc.dbUrl,
        NODE_ENV: "development",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  proc.stdout.on("data", (chunk) => {
    const lines = chunk.toString().trim().split("\n");
    for (const line of lines) {
      console.log(`[${svc.name}] ${line}`);
    }
  });

  proc.stderr.on("data", (chunk) => {
    const lines = chunk.toString().trim().split("\n");
    for (const line of lines) {
      console.error(`[${svc.name}:err] ${line}`);
    }
  });

  proc.on("exit", (code) => {
    console.warn(`[${svc.name}] Process exited with code ${code}`);
  });

  runningProcesses.push(proc);
}

for (const svc of services) {
  startService(svc);
}

process.on("SIGINT", () => {
  console.log("\n[Manager] Gracefully shutting down all microservices...");
  for (const proc of runningProcesses) {
    proc.kill();
  }
  process.exit(0);
});
