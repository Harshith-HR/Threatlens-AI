import http from "node:http";
import https from "node:https";
import type { TLSSocket } from "node:tls";
import { createHash } from "node:crypto";
import { resolveTarget } from "./target";
import type { Finding, Severity } from "./scan-types";

export interface PageResponse {
  url: string;
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  duration: number;
  truncated: boolean;
  tls?: { protocol: string; expires: string; issuer: string };
}
export async function requestPage(
  url: URL,
  signal: AbortSignal,
  redirects = 0,
): Promise<PageResponse> {
  signal.throwIfAborted();
  const resolved = await resolveTarget(url);
  const started = Date.now();
  const response = await new Promise<PageResponse>((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const req = transport.request(
      url,
      {
        method: "GET",
        signal,
        timeout: 12000,
        maxHeaderSize: 32768,
        family: resolved.family,
        headers: {
          "User-Agent": "ThreatLens/1.0 Security Assessment",
          Accept: "text/html,application/json,text/plain;q=0.8",
          "Accept-Encoding": "identity",
        },
        lookup: (_hostname, _options, callback) =>
          callback(null, resolved.address, resolved.family),
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        let truncated = false;
        const socket = res.socket as TLSSocket;
        const cert = socket.getPeerCertificate?.();
        const tls = cert?.valid_to
          ? {
              protocol: socket.getProtocol() || "unknown",
              expires: cert.valid_to,
              issuer: String(cert.issuer?.O || cert.issuer?.CN || ""),
            }
          : undefined;
        const finish = () =>
          resolve({
            url: url.href,
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
            duration: Date.now() - started,
            truncated,
            tls,
          });
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size <= 512000) chunks.push(chunk);
          else {
            truncated = true;
            finish();
            res.destroy();
          }
        });
        res.on("end", finish);
        res.on("error", reject);
      },
    );
    req.on("timeout", () =>
      req.destroy(new Error("HTTP request timed out after 12 seconds.")),
    );
    req.on("error", reject);
    req.end();
  });
  if (
    [301, 302, 303, 307, 308].includes(response.status) &&
    response.headers.location
  ) {
    if (redirects >= 5) throw new Error("Redirect limit exceeded.");
    const destination = new URL(response.headers.location, url);
    if (
      !["http:", "https:"].includes(destination.protocol) ||
      destination.username ||
      destination.password
    )
      throw new Error("Unsupported redirect.");
    if (destination.hostname !== url.hostname)
      throw new Error(
        `Redirect changes host to ${destination.hostname}. Scan that hostname explicitly.`,
      );
    if (url.protocol === "https:" && destination.protocol === "http:")
      throw new Error("HTTPS target redirects to insecure HTTP.");
    return requestPage(destination, signal, redirects + 1);
  }
  return response;
}

export function analyzePage(page: PageResponse): Finding[] {
  const findings: Finding[] = [];
  const url = new URL(page.url);
  const h = page.headers;
  const html = String(h["content-type"] || "").includes("text/html");
  const add = (
    key: string,
    title: string,
    severity: Severity,
    evidence: string,
    impact: string,
    remediation: string,
    cwe = "CWE-693",
    confidence: Finding["confidence"] = "observed",
    owasp = "A05:2021 Security Misconfiguration",
  ) => {
    findings.push({
      id: createHash("sha256")
        .update(`${page.url}:${key}`)
        .digest("hex")
        .slice(0, 16),
      title,
      severity,
      category: key.split(":")[0],
      url: page.url,
      evidence,
      impact,
      remediation,
      cwe,
      confidence,
      owasp,
      source: "web",
      status: "open",
      firstSeen: new Date().toISOString(),
    });
  };
  if (url.protocol === "http:")
    add(
      "transport",
      "Page served over unencrypted HTTP",
      "medium",
      `GET ${url.pathname} returned HTTP ${page.status} over HTTP.`,
      "Traffic can be read or modified in transit.",
      "Serve this resource over HTTPS and redirect HTTP requests to HTTPS.",
      "CWE-319",
      "observed",
      "A02:2021 Cryptographic Failures",
    );
  if (url.protocol === "https:" && !h["strict-transport-security"])
    add(
      "headers:hsts",
      "Strict-Transport-Security missing",
      "low",
      "Response has no Strict-Transport-Security header.",
      "Browsers are not instructed to enforce HTTPS on subsequent visits.",
      "After validating HTTPS across your domain, set Strict-Transport-Security: max-age=31536000; includeSubDomains.",
    );
  if (html && !h["content-security-policy"])
    add(
      "headers:csp",
      "Content Security Policy missing",
      "low",
      "HTML response has no enforcing Content-Security-Policy header.",
      "An additional browser defense against injected scripts is absent; this does not establish an XSS vulnerability.",
      "Deploy a nonce-based CSP appropriate to your application. Start in report-only mode, review reports, then enforce it.",
    );
  if (
    html &&
    !h["x-frame-options"] &&
    !String(h["content-security-policy"] || "").includes("frame-ancestors")
  )
    add(
      "headers:frame",
      "Framing restrictions missing",
      "low",
      "Neither X-Frame-Options nor CSP frame-ancestors was observed.",
      "Sensitive pages may be embeddable for clickjacking; impact needs application review.",
      "Set Content-Security-Policy: frame-ancestors 'self' (or 'none') to match your embedding requirements.",
      "CWE-1021",
      "needs-review",
    );
  if (
    html &&
    String(h["x-content-type-options"] || "").toLowerCase() !== "nosniff"
  )
    add(
      "headers:nosniff",
      "MIME sniffing protection missing",
      "low",
      "X-Content-Type-Options: nosniff was not present.",
      "Browsers may interpret some responses with an unintended content type.",
      "Return accurate Content-Type headers and X-Content-Type-Options: nosniff.",
    );
  if (h["access-control-allow-origin"] === "*")
    add(
      "cors",
      "Wildcard cross-origin access",
      "info",
      "Access-Control-Allow-Origin: *",
      "Public resources may intentionally allow this. Review whether this endpoint exposes non-public data.",
      "For private resources, allow only trusted origins and return Vary: Origin.",
      "CWE-942",
      "needs-review",
    );
  for (const cookie of h["set-cookie"] || []) {
    const name = cookie.split("=", 1)[0].slice(0, 80);
    const session = /session|auth|token|sid/i.test(name);
    if (url.protocol === "https:" && !/;\s*secure(?:;|$)/i.test(cookie))
      add(
        `cookies:${name}:secure`,
        `Cookie ${name} lacks Secure`,
        session ? "medium" : "low",
        `Set-Cookie for ${name} omitted Secure. Value redacted.`,
        "Cookie may be transmitted over HTTP.",
        "Enable the Secure cookie attribute and enforce HTTPS.",
        "CWE-614",
      );
    if (session && !/;\s*httponly(?:;|$)/i.test(cookie))
      add(
        `cookies:${name}:httponly`,
        `Potential session cookie ${name} lacks HttpOnly`,
        "low",
        `Cookie name suggests a session; HttpOnly missing. Value redacted.`,
        "If this is a session credential, client scripts can access it.",
        "Verify the cookie purpose, then enable HttpOnly for session credentials.",
        "CWE-1004",
        "needs-review",
      );
    if (!/;\s*samesite=/i.test(cookie))
      add(
        `cookies:${name}:samesite`,
        `Cookie ${name} has no explicit SameSite policy`,
        "info",
        `Set-Cookie for ${name} omitted SameSite. Value redacted.`,
        "Behavior depends on browser defaults; this does not confirm CSRF.",
        "Explicitly set SameSite=Lax or Strict as appropriate, and use CSRF tokens for state changes.",
        "CWE-1275",
        "needs-review",
      );
  }
  if (
    html &&
    url.protocol === "https:" &&
    /<(?:script|iframe|img|link)[^>]+(?:src|href)\s*=\s*["']http:\/\//i.test(
      page.body,
    )
  )
    add(
      "content:mixed",
      "Insecure resource referenced by HTTPS page",
      "medium",
      "HTML contains an HTTP resource URL in a script, iframe, image, or link element.",
      "Resources may be blocked or exposed to network tampering.",
      "Serve all resources over HTTPS and remove insecure resource references.",
      "CWE-319",
    );
  if (html && /<title>\s*Index of\s/i.test(page.body))
    add(
      "content:listing",
      "Directory listing detected",
      "medium",
      "HTML title matches an Index of directory listing.",
      "Directory contents may reveal unintended files.",
      "Disable directory indexing and explicitly restrict access to non-public files.",
      "CWE-548",
    );
  const server = [h.server, h["x-powered-by"]].filter(Boolean).join("; ");
  if (/\d+\.\d+/.test(server))
    add(
      "headers:version",
      "Software version exposed in response headers",
      "info",
      server.slice(0, 180),
      "Version metadata assists fingerprinting; it does not prove the version is vulnerable.",
      "Keep software patched and suppress unnecessary version headers.",
      "CWE-200",
    );
  if (page.tls) {
    const days = Math.floor(
      (Date.parse(page.tls.expires) - Date.now()) / 86400000,
    );
    if (days < 30)
      add(
        "tls:expiry",
        "TLS certificate expires soon",
        "low",
        `Certificate expires ${page.tls.expires} (${days} days).`,
        "Certificate expiry can interrupt secure access.",
        "Renew the certificate and configure automated renewal monitoring.",
        "CWE-295",
        "observed",
        "A02:2021 Cryptographic Failures",
      );
  }
  return findings;
}
export function extractLinks(body: string, base: URL): string[] {
  const links = new Set<string>();
  for (const match of body.matchAll(
    /<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["']/gi,
  )) {
    try {
      const url = new URL(match[1].replace(/&amp;/g, "&"), base);
      url.hash = "";
      if (
        url.origin === base.origin &&
        !url.username &&
        !url.password &&
        !url.search &&
        !/logout|signout|delete|remove|unsubscribe/i.test(url.pathname) &&
        !/\.(png|jpg|gif|svg|pdf|zip|css|js|mp4)$/i.test(url.pathname)
      )
        links.add(url.href);
    } catch {
      /* Ignore invalid anchors. */
    }
  }
  return [...links];
}

export function analyzeExposure(page: PageResponse): Finding[] {
  if (
    page.status !== 200 ||
    page.truncated ||
    /<html|<!doctype/i.test(page.body) ||
    String(page.headers["content-type"]).includes("text/html")
  )
    return [];
  const path = new URL(page.url).pathname;
  const git =
    path.endsWith("/.git/HEAD") &&
    /^(?:ref: refs\/(?:heads|tags)\/[^\s]+|[a-f0-9]{40})\s*$/i.test(
      page.body.trim(),
    );
  const environment =
    path.endsWith("/.env") &&
    /^(?:export\s+)?[A-Z_][A-Z0-9_]*(?:KEY|SECRET|PASSWORD|TOKEN)[A-Z0-9_]*\s*=\s*\S+/m.test(
      page.body,
    );
  if (!git && !environment) return [];
  return [
    {
      id: createHash("sha256")
        .update(`${page.url}:exposed-config`)
        .digest("hex")
        .slice(0, 16),
      title: git
        ? "Git repository metadata publicly readable"
        : "Environment configuration publicly readable",
      severity: "high",
      category: "exposure",
      url: page.url,
      evidence: git
        ? "HTTP 200 response matched a Git HEAD reference or commit identifier. Contents withheld."
        : "HTTP 200 response matched environment assignments containing a credential-like variable name. Values withheld.",
      impact: git
        ? "Repository metadata is exposed and may enable source disclosure if additional Git objects are accessible."
        : "Environment configuration may disclose credentials. Credential validity was not tested.",
      remediation: git
        ? "Block access to .git and other VCS directories at the web server, remove repository metadata from public deployment artifacts, and review access logs."
        : "Remove .env files from the public web root, deny access to dotfiles, rotate any exposed credentials, and inspect access logs.",
      owasp: "A05:2021 Security Misconfiguration",
      cwe: "CWE-552",
      confidence: "observed",
      source: "web",
      status: "open",
      firstSeen: new Date().toISOString(),
    },
  ];
}
