import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const dbs = [
  {
    name: "user",
    schema: "backend/services/user/prisma/schema.prisma",
    url: "postgresql://postgres:postgres@127.0.0.1:5432/user_db?schema=public",
  },
  {
    name: "catalog",
    schema: "backend/services/catalog/prisma/schema.prisma",
    url: "postgresql://postgres:postgres@127.0.0.1:5432/catalog_db?schema=public",
  },
  {
    name: "order",
    schema: "backend/services/order/prisma/schema.prisma",
    url: "postgresql://postgres:postgres@127.0.0.1:5432/order_db?schema=public",
  },
  {
    name: "payment",
    schema: "backend/services/payment/prisma/schema.prisma",
    url: "postgresql://postgres:postgres@127.0.0.1:5432/payment_db?schema=public",
  },
];

for (const db of dbs) {
  console.log(`[Push] Pushing Prisma schema for ${db.name}...`);
  execSync(`npx prisma db push --schema=${db.schema}`, {
    cwd: rootDir,
    env: { ...process.env, DATABASE_URL: db.url },
    stdio: "inherit",
  });
}

console.log("[Seed] Seeding catalog products...");
const tsxCli = path.join(rootDir, "node_modules", "tsx", "dist", "cli.mjs");
execSync(`node ${tsxCli} backend/services/catalog/prisma/seed.ts`, {
  cwd: rootDir,
  env: {
    ...process.env,
    DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/catalog_db?schema=public",
  },
  stdio: "inherit",
});

console.log("Database schemas pushed and catalog seeded successfully!");
