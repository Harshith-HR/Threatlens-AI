import { guard } from "@/lib/api-auth";
import { readSettings, saveSettings, audit } from "@/lib/persistence";
import type { Settings } from "@/lib/scan-types";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return Response.json({
    settings: await readSettings(),
    integrations: {
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      model: process.env.OPENROUTER_MODEL || "openrouter/auto",
      privateTargets: process.env.SCAN_ALLOW_PRIVATE === "true",
      accessProtected: Boolean(process.env.APP_ACCESS_TOKEN),
      allowedHosts: (process.env.SCAN_ALLOWED_HOSTS || "")
        .split(",")
        .filter(Boolean),
    },
  });
}
export async function PUT(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (
    !body ||
    !["quick", "full", "vuln", "stealth"].includes(body.defaultProfile) ||
    !Number.isInteger(body.maxPages) ||
    body.maxPages < 1 ||
    body.maxPages > 25 ||
    !Number.isInteger(body.timeoutSeconds) ||
    body.timeoutSeconds < 30 ||
    body.timeoutSeconds > 900 ||
    typeof body.nmapEnabled !== "boolean" ||
    typeof body.aiEnabled !== "boolean"
  )
    return Response.json(
      { error: "Invalid settings. Pages: 1–25; timeout: 30–900 seconds." },
      { status: 400 },
    );
  const settings: Settings = {
    defaultProfile: body.defaultProfile,
    maxPages: body.maxPages,
    timeoutSeconds: body.timeoutSeconds,
    nmapEnabled: body.nmapEnabled,
    aiEnabled: body.aiEnabled,
  };
  await saveSettings(settings);
  await audit("settings.update", "Scanner configuration updated");
  return Response.json({ settings });
}
