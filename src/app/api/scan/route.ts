import { createScan, listScans } from "@/lib/scan-store";
import { guard } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return Response.json({
    scans: (await listScans()).map(({ terminalStream, ...scan }) => ({
      ...scan,
      terminalCount: terminalStream.length,
    })),
  });
}
export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const profile = body.profileId || "vuln";
    if (!["quick", "full", "vuln", "stealth"].includes(profile))
      return Response.json({ error: "Unknown scan profile." }, { status: 400 });
    const scan = await createScan(body.target, profile);
    return Response.json(scan, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json(
      { error: message },
      { status: message.includes("already running") ? 429 : 400 },
    );
  }
}
