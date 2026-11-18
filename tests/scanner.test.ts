import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTarget,
  privateAddress,
  resolveTarget,
} from "../src/lib/target";
import {
  analyzePage,
  analyzeExposure,
  extractLinks,
} from "../src/lib/web-scanner";
import { nmapArgs, parseNmap } from "../src/lib/nmap-scanner";
import {
  generateAttackPaths,
  generateMitreFindings,
} from "../src/lib/correlation-engine";

test("URL normalization accepts paths and rejects credentials, schemes, flags and malformed hosts", () => {
  assert.equal(
    normalizeTarget("example.com/path").href,
    "https://example.com/path",
  );
  assert.equal(normalizeTarget("http://127.0.0.1:45123/").port, "45123");
  for (const target of [
    "file:///etc/passwd",
    "https://user:pass@example.com",
    "-sV",
    "http://bad host/",
    "http://bad,host/",
    "https://example.com\\@evil.com",
    "",
    null,
  ])
    assert.throws(() => normalizeTarget(target));
});
test("private and mapped IP ranges are recognized", () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.2.1",
    "169.254.169.254",
    "192.168.1.1",
    "100.64.1.1",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
  ])
    assert.equal(privateAddress(ip), true, ip);
  assert.equal(privateAddress("93.184.216.34"), false);
  assert.equal(privateAddress("2606:4700::1111"), false);
});
test("scope rejects private targets and out-of-scope hostnames", async () => {
  const old = process.env.SCAN_ALLOW_PRIVATE;
  const allowed = process.env.SCAN_ALLOWED_HOSTS;
  try {
    process.env.SCAN_ALLOW_PRIVATE = "false";
    process.env.SCAN_ALLOWED_HOSTS = "";
    await assert.rejects(
      resolveTarget(new URL("http://127.0.0.1")),
      /Private targets/,
    );
    process.env.SCAN_ALLOWED_HOSTS = "example.com";
    await assert.rejects(resolveTarget(new URL("http://127.0.0.1")), /outside/);
  } finally {
    if (old === undefined) delete process.env.SCAN_ALLOW_PRIVATE;
    else process.env.SCAN_ALLOW_PRIVATE = old;
    if (allowed === undefined) delete process.env.SCAN_ALLOWED_HOSTS;
    else process.env.SCAN_ALLOWED_HOSTS = allowed;
  }
});
test("observations contain evidence, remediation, confidence and no cookie values", () => {
  const findings = analyzePage({
    url: "https://example.com",
    status: 200,
    headers: {
      "content-type": "text/html",
      "set-cookie": ["session=TOPSECRET; Path=/"],
    },
    body: '<script src="http://example.com/a.js"></script>',
    duration: 20,
    truncated: false,
  });
  assert.ok(
    findings.some((f) => f.category === "cookies" && f.severity === "medium"),
  );
  assert.ok(findings.some((f) => f.title.includes("Insecure resource")));
  assert.ok(findings.every((f) => f.evidence && f.remediation && f.confidence));
  assert.ok(!JSON.stringify(findings).includes("TOPSECRET"));
  assert.ok(
    !findings.some((f) => f.title.includes("SQL") || f.title.includes("CVE")),
  );
});
test("hardened HTTPS page does not get missing-header or cookie findings", () => {
  assert.deepEqual(
    analyzePage({
      url: "https://example.com",
      status: 200,
      headers: {
        "content-type": "text/html",
        "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
        "strict-transport-security": "max-age=31536000",
        "x-content-type-options": "nosniff",
        "set-cookie": ["session=secret; Secure; HttpOnly; SameSite=Strict"],
      },
      body: "<h1>Hello</h1>",
      duration: 20,
      truncated: false,
    }),
    [],
  );
});
test("exposed files require signatures, reject SPA fallback, and never retain secrets", () => {
  const page = {
    url: "https://example.com/.env",
    status: 200,
    headers: { "content-type": "text/plain" },
    body: "APP_SECRET=do-not-retain-this-value",
    duration: 10,
    truncated: false,
  };
  const findings = analyzeExposure(page);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "high");
  assert.ok(!JSON.stringify(findings).includes("do-not-retain"));
  assert.deepEqual(
    analyzeExposure({ ...page, body: "<html>Not found</html>" }),
    [],
  );
  assert.deepEqual(analyzeExposure({ ...page, status: 404 }), []);
});
test("crawl stays same-origin and excludes logout, state-change-looking links and query strings", () => {
  const links = extractLinks(
    '<a href="/about">A</a><a href="/logout">B</a><a href="https://other.com">C</a><a href="/delete/1">D</a><a href="/find?q=1">E</a><a href="/about#one">F</a>',
    new URL("https://example.com"),
  );
  assert.deepEqual(links, ["https://example.com/about"]);
});
test("full Nmap profile covers all TCP ports and no shell or privilege-dependent options", () => {
  const full = nmapArgs("127.0.0.1", "full", 120, "443");
  assert.ok(full.includes("-p-"));
  assert.ok(full.includes("-sT"));
  assert.ok(!full.includes("-F"));
  assert.ok(!full.includes("-sS"));
  assert.equal(full.at(-1), "127.0.0.1");
  assert.ok(nmapArgs("::1", "quick", 30, "45123").includes("-6"));
});
const xml =
  '<?xml version="1.0"?><nmaprun><host><status state="up"/><ports><extraports state="closed" count="998"/><port protocol="tcp" portid="80"><state state="open"/><service name="http" product="nginx" version="1.24"/></port><port protocol="tcp" portid="3306"><state state="open"/><service name="mysql"/></port></ports></host><runstats><finished exit="success"/></runstats></nmaprun>';
test("Nmap XML parsing counts ports and reports exposure without inventing CVEs", () => {
  const data = parseNmap(
    xml,
    "https://example.com",
    "vuln",
    new Date().toISOString(),
  );
  assert.equal(data.result.totalPorts, 1000);
  assert.equal(data.result.openPorts, 2);
  assert.equal(data.findings.length, 1);
  assert.equal(data.findings[0].confidence, "needs-review");
  assert.equal(data.result.ports[0].cve, undefined);
});
test("malformed or timed-out Nmap output cannot become synthetic success", () => {
  assert.throws(() => parseNmap("<nmaprun>", "x", "quick", ""));
  assert.throws(
    () =>
      parseNmap(
        xml.replace("<host>", '<host timedout="true">'),
        "x",
        "quick",
        "",
      ),
    /timed out/,
  );
});

test("MITRE ATT&CK correlation engine maps web vulnerabilities and network ports to enterprise techniques", () => {
  const parsed = parseNmap(xml, "http://example.com", "vuln", new Date().toISOString());
  const webFindings = analyzePage({
    url: "http://example.com/",
    status: 200,
    headers: { "content-type": "text/html" },
    body: "<html><body>Hello</body></html>",
    duration: 50,
    truncated: false,
  });

  const mitre = generateMitreFindings(webFindings, parsed.result);
  assert.ok(mitre.length >= 3);
  // Verify specific enterprise techniques
  const techniqueIds = mitre.map((m) => m.techniqueId);
  assert.ok(techniqueIds.includes("T1040"), "Should include Network Sniffing for cleartext HTTP");
  assert.ok(techniqueIds.includes("T1189"), "Should include Drive-by Compromise for missing CSP");
  assert.ok(techniqueIds.includes("T1190"), "Should include Exploit Public-Facing Application for open MySQL port 3306");
});

test("Attack Path generator synthesizes actionable multi-step exploit chains with grounded probabilities", () => {
  const parsed = parseNmap(xml, "http://example.com", "vuln", new Date().toISOString());
  const webFindings = analyzePage({
    url: "http://example.com/",
    status: 200,
    headers: { "content-type": "text/html" },
    body: "<html><body>Hello</body></html>",
    duration: 50,
    truncated: false,
  });

  const paths = generateAttackPaths(webFindings, parsed.result, "http://example.com");
  assert.equal(paths.length, 3, "Should generate 3 attack chains");
  assert.ok(paths[0].nodes.length >= 3, "Web path should have multiple stages");
  assert.ok(paths[0].probability > 0 && paths[0].probability <= 100);
  assert.ok(paths[2].nodes.some((n) => n.detail.includes("3306")), "Infrastructure path should reference MySQL port 3306");
});

