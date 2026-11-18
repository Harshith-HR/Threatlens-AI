import { spawn } from "node:child_process";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { createHash } from "node:crypto";
import { resolveTarget } from "./target";
import type {
  Finding,
  GeneratedPort,
  GeneratedScanResult,
  Profile,
} from "./scan-types";
type Xml = Record<string, unknown>;
const obj = (value: unknown): Xml =>
  value && typeof value === "object" ? (value as Xml) : {};
const list = (value: unknown): unknown[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];
const attr = (value: unknown, name: string) =>
  String(obj(value)[`@_${name}`] ?? "");
export function nmapArgs(
  address: string,
  profile: Profile,
  timeout: number,
  webPort: string,
  hostname?: string,
): string[] {
  const args = [
    "-sT",
    "-sV",
    "--version-light",
    "-Pn",
    "-n",
    "--max-retries",
    "2",
    "--host-timeout",
    `${timeout}s`,
    "--script-timeout",
    "20s",
    "--stats-every",
    "3s",
  ];
  if (address.includes(":")) args.push("-6");
  if (profile === "full") args.push("-p-");
  else if (profile === "quick")
    args.push(
      "-p",
      [
        ...new Set([
          "21",
          "22",
          "25",
          "53",
          "80",
          "110",
          "143",
          "443",
          "445",
          "3306",
          "3389",
          "5432",
          "6379",
          "8080",
          "8443",
          webPort,
        ]),
      ].join(","),
    );
  else args.push("--top-ports", profile === "stealth" ? "100" : "1000");
  args.push(profile === "stealth" ? "-T2" : "-T3");
  if (profile === "vuln" || profile === "full")
    args.push(
      "--script",
      "http-title,http-security-headers,ssl-cert,ssl-enum-ciphers,ssh2-enum-algos",
      "--script-args",
      `http.max-body-size=65536${hostname ? `,http.host=${hostname},tls.servername=${hostname}` : ""}`,
    );
  return [...args, "-oX", "-", address];
}
export function parseNmap(
  xml: string,
  target: string,
  profile: string,
  started: string,
): { result: GeneratedScanResult; findings: Finding[] } {
  if (XMLValidator.validate(xml) !== true)
    throw new Error("Nmap returned incomplete or invalid XML.");
  const parsed = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    processEntities: false,
  }).parse(xml);
  const run = obj(parsed.nmaprun);
  const finished = obj(obj(run.runstats).finished);
  if (attr(finished, "exit") !== "success")
    throw new Error("Nmap did not finish successfully.");
  const host = obj(list(run.host)[0]);
  if (!Object.keys(host).length || attr(host, "timedout") === "true")
    throw new Error("Nmap timed out or returned no host results.");
  const ports: GeneratedPort[] = [];
  const findings: Finding[] = [];
  const scripts: NonNullable<GeneratedScanResult["scripts"]> = [];
  for (const raw of list(obj(host.ports).port)) {
    const p = obj(raw);
    const state = attr(p.state, "state");
    if (!["open", "closed", "filtered"].includes(state)) continue;
    const service = obj(p.service);
    const port = Number(attr(p, "portid"));
    const version = [
      attr(service, "product"),
      attr(service, "version"),
      attr(service, "extrainfo"),
    ]
      .filter(Boolean)
      .join(" ");
    const sensitive = [
      21, 23, 445, 3389, 3306, 5432, 6379, 27017, 9200,
    ].includes(port);
    for (const script of list(p.script)) {
      const name = attr(script, "id");
      const output = attr(script, "output")
        .replace(/set-cookie\s*:[^\r\n]*/gi, "Set-Cookie: [redacted]")
        .slice(0, 6000);
      scripts.push({ port, name, output });
      if (
        name === "ssl-enum-ciphers" &&
        /(?:TLSv1\.[01]|SSLv[23])\s*:/.test(output)
      )
        findings.push({
          id: createHash("sha256")
            .update(`${target}:tls:${port}`)
            .digest("hex")
            .slice(0, 16),
          title: `Legacy TLS protocol accepted on port ${port}`,
          severity: "medium",
          category: "tls",
          url: target,
          evidence: `Nmap ssl-enum-ciphers accepted: ${(output.match(/(?:TLSv1\.[01]|SSLv[23])(?=\s*:)/g) || []).join(", ")}.`,
          impact:
            "Legacy protocol support weakens transport security and can permit obsolete client negotiation.",
          remediation:
            "Disable SSLv2/SSLv3/TLS 1.0/TLS 1.1 and retain TLS 1.2/1.3 with modern cipher suites. Re-test dependent clients.",
          owasp: "A02:2021 Cryptographic Failures",
          cwe: "CWE-327",
          confidence: "observed",
          source: "nmap",
          status: "open",
          firstSeen: new Date().toISOString(),
        });
    }
    ports.push({
      port,
      state: state as GeneratedPort["state"],
      service: attr(service, "name") || "unknown",
      version: version || "Not identified",
      risk: state === "open" && sensitive ? "medium" : "info",
    });
    if (state === "open" && sensitive)
      findings.push({
        id: createHash("sha256")
          .update(`${target}:port:${port}`)
          .digest("hex")
          .slice(0, 16),
        title: `Review exposed ${attr(service, "name") || "network"} service on port ${port}`,
        severity: "medium",
        category: "network",
        url: target,
        evidence: `Nmap TCP connect confirmed port ${port}/tcp open. Service: ${attr(service, "name") || "unknown"}; ${version || "no version detected"}.`,
        impact:
          "A database, administration, or legacy service is reachable from the scanner. This does not establish unauthenticated access or a CVE.",
        remediation:
          "Confirm the service is intended to be reachable. Restrict access using firewall rules or a private network, require strong authentication, and patch the service.",
        owasp: "A05:2021 Security Misconfiguration",
        cwe: "CWE-200",
        confidence: "needs-review",
        source: "nmap",
        status: "open",
        firstSeen: new Date().toISOString(),
      });
  }
  let closed = ports.filter((p) => p.state === "closed").length;
  let filtered = ports.filter((p) => p.state === "filtered").length;
  for (const extra of list(obj(host.ports).extraports)) {
    const count = Number(attr(extra, "count")) || 0;
    if (attr(extra, "state") === "closed") closed += count;
    if (attr(extra, "state") === "filtered") filtered += count;
  }
  const open = ports.filter((p) => p.state === "open").length;
  return {
    findings,
    result: {
      scripts,
      target,
      scanType: profile,
      startTime: started,
      endTime: new Date().toISOString(),
      duration: `${Math.round((Date.now() - Date.parse(started)) / 1000)}s`,
      osFingerprint: "Not requested (unprivileged TCP scan)",
      osCertainty: 0,
      hostStatus: attr(host.status, "state") === "up" ? "up" : "down",
      totalPorts: open + closed + filtered,
      openPorts: open,
      closedPorts: closed,
      filteredPorts: filtered,
      ports,
      services: [
        ...new Set(
          ports.filter((p) => p.state === "open").map((p) => p.service),
        ),
      ],
      traceroute: [],
    },
  };
}
export async function scanNetwork(
  url: URL,
  profile: Profile,
  timeout: number,
  signal: AbortSignal,
  log: (text: string) => void,
) {
  const resolved = await resolveTarget(url);
  signal.throwIfAborted();
  const args = nmapArgs(
    resolved.address,
    profile,
    timeout,
    url.port || (url.protocol === "https:" ? "443" : "80"),
    url.hostname.replace(/^\[|\]$/g, ""),
  );
  log(`Nmap target ${url.hostname} pinned to ${resolved.address}.`);
  log(`nmap ${args.join(" ")}`);
  const started = new Date().toISOString();
  const xml = await new Promise<string>((resolve, reject) => {
    const child = spawn(/* turbopackIgnore: true */ process.env.NMAP_PATH || "nmap", args, {
      windowsHide: true,
      shell: false,
      signal,
    });
    let output = "";
    let errors = "";
    let last = Date.now();
    const timer = setTimeout(
      () => {
        child.kill();
        reject(new Error("Nmap exceeded its time budget."));
      },
      (timeout + 5) * 1000,
    );
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      if (output.length > 8_000_000) {
        child.kill();
        reject(new Error("Nmap output exceeded 8 MB."));
      }
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      errors = (errors + text).slice(-4000);
      if (Date.now() - last > 1500) {
        log(text.trim().slice(0, 500));
        last = Date.now();
      }
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(
        new Error(
          signal.aborted
            ? "Scan cancelled."
            : `Nmap could not start: ${err.message}`,
        ),
      );
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0)
        reject(
          new Error(
            `Nmap exited ${code}: ${errors.slice(-700) || "No diagnostic output"}`,
          ),
        );
      else resolve(output);
    });
  });
  return parseNmap(xml, url.href, profile, started);
}
