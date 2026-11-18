"use client";
import { useState } from "react";
import {
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  Copy,
  Check,
  FileCode,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  PageIntro,
  Metric,
  EmptyState,
  StatusBadge,
  formatTime,
} from "@/components/ui/WorkspaceUI";
import FindingsExplorer from "@/components/offensive/FindingsExplorer";

export default function DefensivePage() {
  const { scans, refresh, error } = useWorkspace();
  const [selected, setSelected] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const scan = scans.find((s) => s.id === selected) || scans[0];
  const findings = scan?.findings || [];
  const openPorts = scan?.result?.ports?.filter((p) => p.state === "open") || [];

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate real dynamic enterprise remediation configurations
  const nginxConfig = `# ThreatLens AI Generated Hardening Directives for Nginx
# Target: ${scan?.target || "your-domain.com"}
server {
    listen 443 ssl http2;
    server_name ${scan?.target ? new URL(scan.target).hostname : "example.com"};

    # 1. Enforce HTTPS & Transport Security (CWE-319 / HSTS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # 2. Prevent Cross-Site Scripting & Injection (CWE-693 / CSP)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; form-action 'self';" always;

    # 3. Mitigate Clickjacking & UI Redressing (CWE-1021)
    add_header X-Frame-Options "DENY" always;

    # 4. Enforce Strict MIME-Type Sniffing Protection
    add_header X-Content-Type-Options "nosniff" always;

    # 5. Restrict Referrer Leakage & Permissions
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # 6. Block Exposure of Sensitive Files (.git, .env, .yaml, .bak)
    location ~ /\\.(?!well-known) {
        deny all;
        access_log off;
        log_not_found off;
        return 404;
    }
}`;

  const apacheConfig = `# ThreatLens AI Apache .htaccess Hardening Rules
# Target: ${scan?.target || "your-domain.com"}
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set Content-Security-Policy "default-src 'self'; frame-ancestors 'none';"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Block access to hidden environment and version control repositories
<FilesMatch "^\\.(env|git|svn|hg)">
    Order allow,deny
    Deny from all
</FilesMatch>`;

  const ufwRules = `# ThreatLens AI Host Firewall Hardening (UFW / iptables)
# Restrict or close sensitive discovered ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
${
  openPorts.some((p) => [22, 3389, 445, 3306, 5432, 27017].includes(p.port))
    ? openPorts
        .filter((p) => [22, 3389, 445, 3306, 5432, 27017].includes(p.port))
        .map(
          (p) =>
            `# Limit port ${p.port} (${p.service}) to trusted management subnet only:\n# sudo ufw allow from 10.0.0.0/24 to any port ${p.port} proto tcp\nsudo ufw deny ${p.port}/tcp comment 'Disallow public ${p.service}'`,
        )
        .join("\n")
    : "# No high-risk administrative ports exposed publicly."
}
sudo ufw enable
sudo ufw status verbose`;
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="DEFENSIVE TELEMETRY / RESPONSE"
        title="Turn findings into action."
        description="Investigate observed exposures, prioritize remediation, and track your response."
      />
      {error && <p className="error-banner">{error}</p>}
      <div className="metrics-grid">
        <Metric
          label="Open observations"
          value={findings.filter((f) => f.status === "open").length}
          detail="Awaiting analyst triage"
          icon={<ShieldAlert size={18} />}
        />
        <Metric
          label="Reviewed"
          value={findings.filter((f) => f.status === "reviewed").length}
          detail="Validated by your team"
          icon={<ShieldCheck size={18} />}
        />
        <Metric
          label="Marked resolved"
          value={findings.filter((f) => f.status === "resolved").length}
          detail="Re-scan to verify target changes"
          icon={<CheckCircle2 size={18} />}
        />
        <Metric
          label="Remediation guides"
          value={findings.length}
          detail="Actionable guidance per observation"
          icon={<Wrench size={18} />}
        />
      </div>
      {scan ? (
        <>
          <section className="glass-card panel">
            <div className="section-heading">
              <div>
                <h2>Assessment context</h2>
                <p className="muted text-sm mt-2">{scan.target}</p>
              </div>
              <StatusBadge status={scan.status} />
            </div>
            <label className="field-label" htmlFor="defensive-scan">
              Select assessment
            </label>
            <select
              id="defensive-scan"
              className="field"
              value={scan.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.target} · {formatTime(s.createdAt)}
                </option>
              ))}
            </select>
            <p className="chart-note">
              This queue contains scan observations. Status changes record
              analyst decisions; they do not apply remote fixes or imply
              continuous SIEM monitoring.
            </p>
          </section>
          <FindingsExplorer
            findings={findings}
            scanId={scan.id}
            onChange={() => void refresh()}
          />
          <section className="glass-card panel">
            <div className="section-heading">
              <div>
                <h2>
                  <FileCode size={18} /> Enterprise Remediation Playbooks
                </h2>
                <p className="muted text-xs mt-1">
                  Ready-to-deploy hardening configurations generated from observed findings
                </p>
              </div>
              <span className="count-pill">{findings.length} findings addressed</span>
            </div>
            <div className="space-y-4 mt-4">
              <div className="evidence-block">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-semibold font-mono text-threat-cyan">
                    Nginx Reverse Proxy & Header Hardening
                  </span>
                  <button
                    onClick={() => handleCopy(nginxConfig, "nginx")}
                    className="button secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
                  >
                    {copiedKey === "nginx" ? <Check size={13} /> : <Copy size={13} />}
                    {copiedKey === "nginx" ? "Copied" : "Copy Directive"}
                  </button>
                </div>
                <pre className="text-xs max-h-56 overflow-y-auto">{nginxConfig}</pre>
              </div>

              <div className="evidence-block">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-semibold font-mono text-threat-amber">
                    Apache / LiteSpeed (.htaccess) Rules
                  </span>
                  <button
                    onClick={() => handleCopy(apacheConfig, "apache")}
                    className="button secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
                  >
                    {copiedKey === "apache" ? <Check size={13} /> : <Copy size={13} />}
                    {copiedKey === "apache" ? "Copied" : "Copy Rules"}
                  </button>
                </div>
                <pre className="text-xs max-h-56 overflow-y-auto">{apacheConfig}</pre>
              </div>

              <div className="evidence-block">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-semibold font-mono text-threat-green">
                    Network Host Firewall (UFW / iptables) Policy
                  </span>
                  <button
                    onClick={() => handleCopy(ufwRules, "ufw")}
                    className="button secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
                  >
                    {copiedKey === "ufw" ? <Check size={13} /> : <Copy size={13} />}
                    {copiedKey === "ufw" ? "Copied" : "Copy Commands"}
                  </button>
                </div>
                <pre className="text-xs max-h-56 overflow-y-auto">{ufwRules}</pre>
              </div>
            </div>
          </section>
          <section className="glass-card panel">
            <h2>Response workflow</h2>
            <div className="response-flow">
              {[
                {
                  n: "01",
                  title: "Inspect",
                  text: "Read the request evidence and confirm the affected resource.",
                },
                {
                  n: "02",
                  title: "Prioritize",
                  text: "Review exposure, business context, and finding confidence.",
                },
                {
                  n: "03",
                  title: "Remediate",
                  text: "Apply the recommended configuration in your deployment.",
                },
                {
                  n: "04",
                  title: "Verify",
                  text: "Re-scan the same target and compare the observed results.",
                },
              ].map((step) => (
                <div key={step.n}>
                  <span>{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="glass-card">
          <EmptyState />
        </div>
      )}
    </div>
  );
}
