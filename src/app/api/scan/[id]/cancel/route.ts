import { cancelScan, getScan } from "@/lib/scan-store";
import { guard } from "@/lib/api-auth";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = guard(request);
  if (denied) return denied;
  const { id } = await params;
  if (!(await getScan(id)))
    return Response.json({ error: "Scan not found" }, { status: 404 });
  return Response.json({ cancelled: await cancelScan(id) });
}
