import { getScan } from "@/lib/scan-store";
import { guard } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = guard(request);
  if (denied) return denied;
  const scan = await getScan((await params).id);
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });
  return Response.json(scan, { headers: { "Cache-Control": "no-store" } });
}
