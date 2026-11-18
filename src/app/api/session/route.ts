import { authorized, sessionToken, validOrigin } from "@/lib/api-auth";
import { createHash, timingSafeEqual } from "node:crypto";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return Response.json({
    authorized: authorized(request),
    protected: Boolean(process.env.APP_ACCESS_TOKEN),
  });
}
export async function POST(request: Request) {
  if (!validOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const { token } = await request.json().catch(() => ({}));
  const hash = (s: string) => createHash("sha256").update(s).digest();
  if (
    typeof token !== "string" ||
    !process.env.APP_ACCESS_TOKEN ||
    !timingSafeEqual(hash(token), hash(process.env.APP_ACCESS_TOKEN))
  )
    return Response.json(
      { error: "Invalid workspace token." },
      { status: 401 },
    );
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": `tl_session=${sessionToken()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`,
      },
    },
  );
}
export async function DELETE() {
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie":
          "tl_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
      },
    },
  );
}
