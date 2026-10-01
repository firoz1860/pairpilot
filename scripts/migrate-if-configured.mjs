import { spawnSync } from "node:child_process";

if (process.env.DATABASE_URL) {
  const databaseUrl = new URL(process.env.DATABASE_URL);
  if (databaseUrl.hostname.endsWith(".neon.tech")) {
    databaseUrl.hostname = databaseUrl.hostname.replace("-pooler.", ".");
  }
  const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl.toString() },
  });
  if (result.error) {
    console.error("Unable to start database migrations.");
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
