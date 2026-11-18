import http from "node:http";

let isHardened = false;
const PORT = 5000;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Instant toggle endpoint for demo
  if (url.pathname === "/toggle") {
    isHardened = !isHardened;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        mode: isHardened ? "HARDENED / SECURED" : "VULNERABLE / MISCONFIGURED",
        message: isHardened
          ? "Remediation applied! Re-scan in ThreatLens to see findings drop."
          : "Vulnerabilities injected! Re-scan in ThreatLens to see findings detected.",
      }),
    );
    console.log(
      `\n🔄 [DEMO TARGET] Mode toggled to: ${isHardened ? "🛡️ HARDENED / SECURE" : "⚠️ VULNERABLE / MISCONFIGURED"}\n`,
    );
    return;
  }

  // Exposed environment file probe
  if (url.pathname === "/.env") {
    if (isHardened) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(
      "DATABASE_URL=postgres://admin:SuperSecretPass2026@127.0.0.1:5432/production\nSECRET_KEY=threatlens-super-secret-jwt-token-98765\nAPI_KEY=AIzaSyD-unprotected-cloud-key\n",
    );
    return;
  }

  // Exposed Git repository metadata probe
  if (url.pathname === "/.git/HEAD") {
    if (isHardened) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ref: refs/heads/main\n");
    return;
  }

  // Default Web Application Home Page
  if (isHardened) {
    // 🛡️ HARDENED CONFIGURATION (Post-Remediation)
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; frame-ancestors 'none'; form-action 'self';",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Access-Control-Allow-Origin": "https://trusted-portal.internal",
      "Set-Cookie":
        "session_auth=9f82bc71e; Path=/; Secure; HttpOnly; SameSite=Strict",
    });

    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Corporate Customer Portal - Hardened</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; padding: 40px; }
    .card { background: #1e293b; border: 1px solid #10b981; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; background: #064e3b; color: #34d399; }
    h1 { font-size: 20px; margin-top: 12px; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
    .status { margin-top: 16px; padding: 12px; background: #022c22; border-radius: 8px; font-family: monospace; font-size: 12px; color: #6ee7b7; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">🛡️ SECURITY STATUS: FULLY HARDENED</span>
    <h1>Corporate Enterprise Portal</h1>
    <p>All defensive security controls recommended by ThreatLens AI have been applied to this web service.</p>
    <div class="status">
      ✓ Content-Security-Policy: ENFORCED<br>
      ✓ X-Frame-Options: DENY (Anti-Clickjacking)<br>
      ✓ MIME Protection: nosniff<br>
      ✓ Dotfiles: BLOCKED (404)<br>
      ✓ Session Cookie: Secure, HttpOnly, SameSite=Strict<br>
      ✓ Server Fingerprint: SUPPRESSED
    </div>
  </div>
</body>
</html>`);
  } else {
    // ⚠️ VULNERABLE / MISCONFIGURED (Pre-Remediation)
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      Server: "Apache/2.4.52 (Ubuntu) PHP/8.1.2 OpenSSL/3.0.2",
      "X-Powered-By": "PHP/8.1.2",
      "Access-Control-Allow-Origin": "*", // Wildcard CORS
      "Set-Cookie": "session_auth=9f82bc71e; Path=/", // Insecure cookie
      // Notice: NO CSP, NO X-Frame-Options, NO X-Content-Type-Options
    });

    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Corporate Customer Portal - Misconfigured</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; padding: 40px; }
    .card { background: #1e293b; border: 1px solid #ef4444; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; background: #450a0a; color: #f87171; }
    h1 { font-size: 20px; margin-top: 12px; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.5; }
    .warning { margin-top: 16px; padding: 12px; background: #2a0b0b; border-radius: 8px; font-family: monospace; font-size: 12px; color: #fca5a5; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">⚠️ SECURITY STATUS: UNHARDENED & VULNERABLE</span>
    <h1>Corporate Enterprise Portal</h1>
    <p>This web service contains classic real-world security misconfigurations ready for ThreatLens AI evaluation.</p>
    <div class="warning">
      ! Missing CSP (Cross-Site Scripting vector)<br>
      ! Missing X-Frame-Options (Clickjacking vulnerability)<br>
      ! Permissive CORS: Access-Control-Allow-Origin: *<br>
      ! Exposed .env credentials file at /.env<br>
      ! Exposed .git repository metadata at /.git/HEAD<br>
      ! Insecure session cookie (Missing HttpOnly & SameSite)<br>
      ! Leaked server version: Apache/2.4.52 (Ubuntu)
    </div>
  </div>
</body>
</html>`);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`
=================================================================
🎯 ThreatLens AI Live Demonstration Target Server
=================================================================
👉 Target URL:       http://127.0.0.1:${PORT}
👉 Current Mode:     ⚠️  VULNERABLE (Misconfigurations Active)
👉 Instant Toggle:   Visit http://127.0.0.1:${PORT}/toggle
                     (Toggles between VULNERABLE and HARDENED)
=================================================================
`);
});

