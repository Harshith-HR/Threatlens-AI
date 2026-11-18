import { updateFinding } from "@/lib/scan-store";
import { guard } from "@/lib/api-auth";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = guard(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.findingId !== "string" ||
    !["open", "reviewed", "resolved"].includes(body.status)
  )
    return Response.json({ error: "Invalid finding update" }, { status: 400 });
  if (!(await updateFinding((await params).id, body.findingId, body.status)))
    return Response.json({ error: "Finding not found" }, { status: 404 });
  return Response.json({ ok: true });
}
