import { getScan } from "@/lib/scan-store";
import { guard } from "@/lib/api-auth";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = guard(request);
  if (denied) return denied;
  const scan = await getScan((await params).id);
  if (!scan) return Response.json({ error: "Scan not found" }, { status: 404 });
  return new Response(JSON.stringify(scan, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="threatlens-${scan.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
