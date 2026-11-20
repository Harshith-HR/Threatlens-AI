import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { guard } from "@/lib/api-auth";
import { database } from "@/lib/mongodb";
export const runtime = "nodejs";
let cached:
  { time: number; nmap: { available: boolean; version: string } } | undefined;
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  if (!cached || Date.now() - cached.time > 60000) {
    try {
      const { stdout } = await promisify(execFile)(
        process.env.NMAP_PATH || "nmap",
        ["--version"],
        { timeout: 4000, windowsHide: true },
      );
      cached = {
        time: Date.now(),
        nmap: { available: true, version: stdout.split(/\r?\n/)[0] },
      };
    } catch {
      cached = {
        time: Date.now(),
        nmap: {
          available: false,
          version: "Not available. Install Nmap or set NMAP_PATH.",
        },
      };
    }
  }
  let mongoConnected = false;
  try {
    const db = await database();
    if (db) {
      await db.command({ ping: 1 });
      mongoConnected = true;
    }
  } catch {
    /* Report unavailable without exposing connection credentials. */
  }
  return Response.json({
    database: {
      provider: mongoConnected ? "MongoDB" : "File storage (MongoDB offline)",
      connected: mongoConnected,
      name: process.env.MONGODB_DB || "threatlens",
    },
    nmap: cached.nmap,
    ai: {
      configured: Boolean(process.env.OPENROUTER_API_KEY),
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
    },
    time: new Date().toISOString(),
  });
}
