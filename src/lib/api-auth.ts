import { createHash, timingSafeEqual } from "node:crypto";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const sessionToken = () =>
  hash(`threatlens-session:${process.env.APP_ACCESS_TOKEN || ""}`);
export function validOrigin(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.host === (request.headers.get("host") || new URL(request.url).host)
    );
  } catch {
    return false;
  }
}
export function authorized(request: Request): boolean {
  if (!process.env.APP_ACCESS_TOKEN) return true;
  const cookie =
    request.headers
      .get("cookie")
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("tl_session="))
      ?.slice(11) || "";
  const bearer =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  return (
    timingSafeEqual(
      Buffer.from(hash(cookie)),
      Buffer.from(hash(sessionToken())),
    ) ||
    timingSafeEqual(
      Buffer.from(hash(bearer)),
      Buffer.from(hash(process.env.APP_ACCESS_TOKEN)),
    )
  );
}
export function guard(request: Request): Response | undefined {
  if (!authorized(request))
    return Response.json(
      { error: "Sign in with the workspace access token." },
      { status: 401 },
    );
  if (!["GET", "HEAD"].includes(request.method)) {
    if (!validOrigin(request))
      return Response.json(
        { error: "Cross-origin changes are not allowed." },
        { status: 403 },
      );
  }
}
