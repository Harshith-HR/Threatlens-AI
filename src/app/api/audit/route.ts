import { guard } from "@/lib/api-auth";
import { readAudit } from "@/lib/persistence";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return Response.json({ events: await readAudit() });
}
