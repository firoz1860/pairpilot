import { databaseReady } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Lightweight health check for container orchestration and uptime probes. */
export function GET() {
  return Response.json({
    status: "ok",
    time: new Date().toISOString(),
    database: databaseReady() ? "configured" : "not_configured",
  });
}
