import { randomUUID } from "node:crypto";
import { normalizeTarget } from "./target";
import {
  analyzePage,
  analyzeExposure,
  extractLinks,
  requestPage,
} from "./web-scanner";
import { scanNetwork } from "./nmap-scanner";
import { loadScans, saveScan, readSettings, audit } from "./persistence";
import { analyzeWithAI } from "./ai-analysis";
import {
  generateAttackPaths,
  generateMitreFindings,
} from "./correlation-engine";
import type {
  Coverage,
  Finding,
  Profile,
  ScanSession,
  TerminalMessage,
} from "./scan-types";
export type { ScanSession } from "./scan-types";
const shared = globalThis as unknown as {
  threatlens?: {
    scans: Map<string, ScanSession>;
    controllers: Map<string, AbortController>;
    ready?: Promise<void>;
  };
};
if (!shared.threatlens)
  shared.threatlens = { scans: new Map(), controllers: new Map() };
const state = shared.threatlens;
async function initialize() {
  if (!state.ready)
    state.ready = (async () => {
      const scans = await loadScans();
      for (const scan of scans) {
        if (scan.status === "running") {
          scan.status = "failed";
          scan.error = "Server restarted before this scan finished.";
          scan.finishedAt = new Date().toISOString();
          for (const stage of scan.coverage)
            if (["running", "pending"].includes(stage.status)) {
              stage.status = "failed";
              stage.detail = "Interrupted by server restart.";
            }
          await saveScan(scan);
        }
        if (!scan.attackPaths || scan.attackPaths.length === 0) {
          scan.attackPaths = generateAttackPaths(scan.findings || [], scan.result, scan.target);
        }
        if (!scan.mitreFindings || scan.mitreFindings.length === 0) {
          scan.mitreFindings = generateMitreFindings(scan.findings || [], scan.result);
        }
        state.scans.set(scan.id, scan);
      }
    })().catch((error) => {
      state.ready = undefined;
      throw error;
    });
  await state.ready;
}
export const getScan = async (id: string) => {
  await initialize();
  return state.scans.get(id);
};
export const listScans = async () => {
  await initialize();
  return [...state.scans.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
};
export async function cancelScan(id: string) {
  const controller = state.controllers.get(id);
  if (!controller) return false;
  controller.abort(new Error("Cancelled by user."));
  await audit("scan.cancel", "Cancellation requested", id);
  return true;
}
export async function updateFinding(
  id: string,
  findingId: string,
  status: Finding["status"],
) {
  const scan = await getScan(id);
  const finding = scan?.findings.find((f) => f.id === findingId);
  if (!scan || !finding) return false;
  finding.status = status;
  await saveScan(scan);
  await audit("finding.update", `${finding.title}: ${status}`, id);
  return true;
}
export async function createScan(
  target: string,
  profile: Profile,
): Promise<ScanSession> {
  await initialize();
  const url = normalizeTarget(target);
  const settings = await readSettings();
  if (state.controllers.size >= 2)
    throw new Error(
      "Two scans are already running. Wait or cancel a scan first.",
    );
  const scan: ScanSession = {
    id: `scan-${randomUUID()}`,
    target: url.href,
    scanType: profile,
    profileId: profile,
    status: "running",
    createdAt: new Date().toISOString(),
    progress: 0,
    findings: [],
    terminalStream: [],
    coverage: ["Web assessment", "Network discovery", "AI analysis"].map(
      (module) => ({ module, status: "pending", detail: "Waiting" }),
    ),
    pages: [],
    attackPaths: [],
    mitreFindings: [],
  };
  const controller = new AbortController();
  state.controllers.set(scan.id, controller);
  try {
    await saveScan(scan);
    await audit("scan.start", `${profile} assessment of ${url.href}`, scan.id);
  } catch (error) {
    state.controllers.delete(scan.id);
    throw error;
  }
  state.scans.set(scan.id, scan);
  void run(scan, url, controller, settings).catch(async (error) => {
    scan.status = "failed";
    scan.error =
      error instanceof Error ? error.message : "Unexpected scanner failure";
    scan.finishedAt = new Date().toISOString();
    state.controllers.delete(scan.id);
    try {
      await saveScan(scan);
    } catch {
      console.error("Unable to persist failed scan", scan.id);
    }
  });
  return scan;
}
async function run(
  scan: ScanSession,
  url: URL,
  controller: AbortController,
  settings: Awaited<ReturnType<typeof readSettings>>,
) {
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error("Scan time budget exceeded."));
  }, settings.timeoutSeconds * 1000);
  const log = (
    phase: TerminalMessage["phase"],
    type: TerminalMessage["type"],
    content: string,
  ) => {
    scan.terminalStream.push({
      id: scan.terminalStream.length + 1,
      phase,
      type,
      content,
      timestamp: new Date().toISOString(),
      delay: 0,
    });
  };
  const coverage = async (
    index: number,
    status: Coverage["status"],
    detail: string,
  ) => {
    scan.coverage[index] = { ...scan.coverage[index], status, detail };
    await saveScan(scan);
  };
  const addFindings = async (items: Finding[]) => {
    for (const f of items)
      if (!scan.findings.some((existing) => existing.id === f.id)) {
        scan.findings.push(f);
        log(
          "tda",
          f.severity === "high" || f.severity === "critical"
            ? "warning"
            : "result",
          `${f.severity.toUpperCase()}: ${f.title} — ${f.url}`,
        );
      }
    await saveScan(scan);
  };
  log("init", "system", `Assessment started: ${url.href}`);
  const web = async () => {
    await coverage(
      0,
      "running",
      "Inspecting HTTP, TLS, headers, cookies, and linked pages.",
    );
    const queue = [url.href];
    const visited = new Set<string>();
    const max =
      scan.profileId === "quick"
        ? 1
        : scan.profileId === "stealth"
          ? Math.min(3, settings.maxPages)
          : settings.maxPages;
    let failures = 0;
    while (queue.length && visited.size < max) {
      controller.signal.throwIfAborted();
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      log("recon", "command", `GET ${current}`);
      try {
        const page = await requestPage(new URL(current), controller.signal);
        scan.pages.push({
          url: page.url,
          status: page.status,
          duration: page.duration,
        });
        await addFindings(analyzePage(page));
        log(
          "recon",
          "result",
          `HTTP ${page.status} · ${page.duration} ms${page.truncated ? " · body inspection limited to 512 KB" : ""}`,
        );
        if (page.status >= 400 || page.truncated) failures++;
        if (
          page.status >= 200 &&
          page.status < 300 &&
          String(page.headers["content-type"]).includes("text/html")
        )
          queue.push(
            ...extractLinks(page.body, new URL(page.url))
              .filter((link) => !visited.has(link))
              .slice(0, max),
          );
      } catch (error) {
        if (controller.signal.aborted) throw error;
        failures++;
        log(
          "recon",
          "error",
          `${current}: ${error instanceof Error ? error.message : "Request failed"}`,
        );
      }
      scan.progress = Math.min(60, 10 + Math.round((visited.size / max) * 50));
      await saveScan(scan);
    }
    if (scan.profileId === "vuln" || scan.profileId === "full") {
      const probeBase = scan.pages[0]?.url ? new URL(scan.pages[0].url) : url;
      for (const path of ["/.git/HEAD", "/.env"]) {
        controller.signal.throwIfAborted();
        const probe = new URL(path, probeBase);
        log("recon", "command", `Exposure check: GET ${probe.href}`);
        try {
          const page = await requestPage(probe, controller.signal);
          await addFindings(analyzeExposure(page));
          log(
            "recon",
            "result",
            `Exposure check ${path}: HTTP ${page.status}; sensitive contents are not stored.`,
          );
        } catch (error) {
          if (controller.signal.aborted) throw error;
          failures++;
          log(
            "recon",
            "warning",
            `Exposure check ${path} unavailable: ${error instanceof Error ? error.message : "Request failed"}`,
          );
        }
      }
    }
    await coverage(
      0,
      failures ? "failed" : "complete",
      `${scan.pages.length} page(s) inspected${["vuln", "full"].includes(scan.profileId) ? " plus Git/environment exposure checks" : ""}; ${failures} request(s) blocked, truncated, or failed. No authenticated or injection testing.`,
    );
  };
  const network = async () => {
    if (!settings.nmapEnabled) {
      await coverage(1, "skipped", "Disabled in Settings.");
      return;
    }
    await coverage(
      1,
      "running",
      "TCP service discovery and selected HTTP/TLS scripts.",
    );
    const data = await scanNetwork(
      url,
      scan.profileId,
      Math.max(15, settings.timeoutSeconds - 15),
      controller.signal,
      (text) => log("recon", "system", text),
    );
    scan.result = data.result;
    await addFindings(data.findings);
    await coverage(
      1,
      "complete",
      `${data.result.totalPorts} TCP ports assessed; ${data.result.openPorts} open. No exploit execution or CVE inference.`,
    );
  };
  try {
    const settled = await Promise.allSettled([web(), network()]);
    await Promise.all(
      settled.map(async (result, index) => {
        if (result.status === "rejected") {
          const message =
            result.reason instanceof Error
              ? result.reason.message
              : "Module failed";
          await coverage(index, "failed", message);
          log("recon", "error", message);
        }
      }),
    );
    scan.mitreFindings = generateMitreFindings(scan.findings, scan.result);
    scan.attackPaths = generateAttackPaths(scan.findings, scan.result, scan.target);
    log(
      "tda",
      "result",
      `Correlated ${scan.mitreFindings.length} MITRE ATT&CK techniques across ${scan.attackPaths.length} exploit chains.`,
    );
    scan.progress = 85;
    if (
      !controller.signal.aborted &&
      settings.aiEnabled &&
      (scan.pages.length > 0 || scan.result)
    ) {
      await coverage(
        2,
        "running",
        "Preparing evidence-based remediation summary.",
      );
      scan.ai = await analyzeWithAI(scan, controller.signal);
      await coverage(
        2,
        scan.ai.status,
        scan.ai.status === "complete"
          ? `Analysis by ${scan.ai.model}`
          : scan.ai.text,
      );
    } else
      await coverage(
        2,
        "skipped",
        controller.signal.aborted
          ? "Scan interrupted."
          : !settings.aiEnabled
            ? "Disabled in Settings."
            : "No successful observations to analyze.",
      );
    if (controller.signal.aborted) {
      scan.status = timedOut ? "partial" : "cancelled";
      scan.error = timedOut
        ? "Time budget reached. Collected findings are retained; coverage is incomplete."
        : "Cancelled. Collected findings are retained.";
    } else {
      const successful =
        scan.coverage.slice(0, 2).some((c) => c.status === "complete") ||
        scan.pages.length > 0;
      scan.status = successful
        ? scan.coverage.some((c) => c.status === "failed")
          ? "partial"
          : "complete"
        : "failed";
      if (!successful)
        scan.error =
          "No assessment module completed successfully. Review coverage and terminal output.";
    }
    scan.progress = 100;
    scan.finishedAt = new Date().toISOString();
    log(
      "complete",
      scan.status === "complete" ? "success" : "warning",
      `Assessment ${scan.status}. ${scan.findings.length} evidence-backed observations recorded.`,
    );
    await saveScan(scan);
    await audit(
      `scan.${scan.status}`,
      `${scan.findings.length} findings; ${scan.pages.length} pages`,
      scan.id,
    );
  } finally {
    clearTimeout(timer);
    state.controllers.delete(scan.id);
  }
}
