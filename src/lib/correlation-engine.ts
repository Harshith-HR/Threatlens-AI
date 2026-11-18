import type {
  Finding,
  GeneratedAttackPath,
  GeneratedMitreFinding,
  GeneratedScanResult,
} from "./scan-types";

// Standard tactic colors adhering to MITRE ATT&CK visualization palettes
const TACTIC_COLORS: Record<string, string> = {
  Reconnaissance: "#8b5cf6",
  "Resource Development": "#6366f1",
  "Initial Access": "#3b82f6",
  Execution: "#f59e0b",
  Persistence: "#ec4899",
  "Privilege Escalation": "#ef4444",
  "Defense Evasion": "#10b981",
  "Credential Access": "#f97316",
  Discovery: "#06b6d4",
  "Lateral Movement": "#d946ef",
  Collection: "#84cc16",
  "Command and Control": "#14b8a6",
  Exfiltration: "#f43f5e",
  Impact: "#dc2626",
};

/**
 * Maps discovered web findings and open network services to MITRE ATT&CK enterprise techniques.
 */
export function generateMitreFindings(
  findings: Finding[],
  result?: GeneratedScanResult,
): GeneratedMitreFinding[] {
  const mitreList: GeneratedMitreFinding[] = [];
  const seen = new Set<string>();

  const add = (item: GeneratedMitreFinding) => {
    const key = `${item.techniqueId}:${item.relatedPort}`;
    if (!seen.has(key)) {
      seen.add(key);
      mitreList.push(item);
    }
  };

  // 1. Map Web Application Findings
  for (const f of findings) {
    if (f.title.includes("unencrypted HTTP")) {
      add({
        techniqueId: "T1040",
        techniqueName: "Network Sniffing",
        tactic: "Credential Access",
        tacticColor: TACTIC_COLORS["Credential Access"],
        description:
          "Target transmits plaintext HTTP traffic allowing adversaries positioned on adjacent networks to capture credentials and session identifiers.",
        relatedPort: 80,
        relatedService: "http",
        severity: "high",
        detection:
          "Monitor cleartext HTTP requests carrying Authorization or Cookie headers in perimeter network taps.",
      });
    }

    if (f.title.includes("Strict-Transport-Security")) {
      add({
        techniqueId: "T1557",
        techniqueName: "Adversary-in-the-Middle",
        tactic: "Credential Access",
        tacticColor: TACTIC_COLORS["Credential Access"],
        description:
          "Absence of HTTP Strict Transport Security (HSTS) allows attackers to perform SSL-stripping downgrades to unencrypted HTTP.",
        relatedPort: 443,
        relatedService: "https",
        severity: "medium",
        detection:
          "Inspect TLS negotiation telemetry for protocol downgrade anomalies and unexpected port 80 redirects.",
      });
    }

    if (f.title.includes("Content Security Policy")) {
      add({
        techniqueId: "T1189",
        techniqueName: "Drive-by Compromise",
        tactic: "Initial Access",
        tacticColor: TACTIC_COLORS["Initial Access"],
        description:
          "Missing Content-Security-Policy (CSP) allows execution of untrusted scripts and client-side injection vectors if an XSS flaw exists.",
        relatedPort: 80,
        relatedService: "http",
        severity: "medium",
        detection:
          "Review browser CSP violation telemetry and unexpected external resource requests in WAF logs.",
      });
    }

    if (f.title.includes("Framing restrictions")) {
      add({
        techniqueId: "T1204.001",
        techniqueName: "User Execution: Malicious Link",
        tactic: "Execution",
        tacticColor: TACTIC_COLORS["Execution"],
        description:
          "Missing X-Frame-Options or CSP frame-ancestors permits framing and clickjacking attacks to trick users into unintended actions.",
        relatedPort: 80,
        relatedService: "http",
        severity: "low",
        detection:
          "Log iframe parent origins and monitor iframe embedding attempts in client-side telemetry.",
      });
    }

    if (f.title.includes("MIME sniffing")) {
      add({
        techniqueId: "T1059.007",
        techniqueName: "Command and Scripting Interpreter: JavaScript",
        tactic: "Execution",
        tacticColor: TACTIC_COLORS["Execution"],
        description:
          "Without X-Content-Type-Options: nosniff, browsers may interpret non-executable MIME types as executable JavaScript.",
        relatedPort: 80,
        relatedService: "http",
        severity: "low",
        detection:
          "Audit outbound responses for mismatched Content-Type headers and executable script payload patterns.",
      });
    }

    if (f.title.includes("Git repository") || f.title.includes(".git")) {
      add({
        techniqueId: "T1552.001",
        techniqueName: "Unsecured Credentials: Credentials In Files",
        tactic: "Credential Access",
        tacticColor: TACTIC_COLORS["Credential Access"],
        description:
          "Exposed .git version control metadata enables adversaries to extract source code, commit history, and hardcoded API tokens.",
        relatedPort: 80,
        relatedService: "http",
        severity: "critical",
        detection:
          "Alert on HTTP requests accessing /.git/, /.git/HEAD, or /.git/config in web server access logs.",
      });
      add({
        techniqueId: "T1592",
        techniqueName: "Gather Victim Host Information",
        tactic: "Reconnaissance",
        tacticColor: TACTIC_COLORS["Reconnaissance"],
        description:
          "Version control metadata reveals internal repository structures, branch names, and build pipelines to external reconnaissance probes.",
        relatedPort: 80,
        relatedService: "http",
        severity: "high",
        detection:
          "Audit web access logs for automated crawlers requesting hidden dot-files and directories.",
      });
    }

    if (f.title.includes("Environment configuration") || f.title.includes(".env")) {
      add({
        techniqueId: "T1552.001",
        techniqueName: "Unsecured Credentials: Credentials In Files",
        tactic: "Credential Access",
        tacticColor: TACTIC_COLORS["Credential Access"],
        description:
          "Publicly accessible .env configuration files expose database credentials, cloud secrets, and encryption keys.",
        relatedPort: 80,
        relatedService: "http",
        severity: "critical",
        detection:
          "Monitor WAF access logs for requests matching dot-env filenames and secret variable signatures.",
      });
    }

    if (f.title.includes("Directory listing")) {
      add({
        techniqueId: "T1083",
        techniqueName: "File and Directory Discovery",
        tactic: "Discovery",
        tacticColor: TACTIC_COLORS["Discovery"],
        description:
          "Enabled directory indexing discloses file hierarchy, backup archives, and unlinked development assets.",
        relatedPort: 80,
        relatedService: "http",
        severity: "medium",
        detection:
          "Inspect HTTP responses containing automated web server directory index signatures (e.g. 'Index of /').",
      });
    }

    if (f.title.includes("Insecure cookie")) {
      add({
        techniqueId: "T1539",
        techniqueName: "Steal Web Session Cookie",
        tactic: "Credential Access",
        tacticColor: TACTIC_COLORS["Credential Access"],
        description:
          "Session cookies lacking HttpOnly or Secure flags are vulnerable to cross-site script theft and unencrypted interception.",
        relatedPort: 80,
        relatedService: "http",
        severity: "medium",
        detection:
          "Inspect Set-Cookie response headers in egress proxies to verify HttpOnly, Secure, and SameSite attributes.",
      });
    }

    if (f.title.includes("Server banner") || f.title.includes("version")) {
      add({
        techniqueId: "T1592.002",
        techniqueName: "Gather Victim Host Info: Software",
        tactic: "Reconnaissance",
        tacticColor: TACTIC_COLORS["Reconnaissance"],
        description:
          "Explicit web server or application framework banners expose exact versions to automated exploit vulnerability scanners.",
        relatedPort: 80,
        relatedService: "http",
        severity: "low",
        detection:
          "Audit HTTP response headers for 'Server', 'X-Powered-By', and technology fingerprint disclosures.",
      });
    }
  }

  // 2. Map Open Network Services from Nmap
  if (result?.ports) {
    for (const p of result.ports.filter((port) => port.state === "open")) {
      const num = p.port;
      const s = p.service.toLowerCase();

      // Port 22 - SSH
      if (num === 22 || s.includes("ssh")) {
        add({
          techniqueId: "T1021.004",
          techniqueName: "Remote Services: SSH",
          tactic: "Lateral Movement",
          tacticColor: TACTIC_COLORS["Lateral Movement"],
          description:
            "Exposed SSH service permits remote interactive shell access and credential brute-force attacks.",
          relatedPort: num,
          relatedService: p.service,
          severity: "medium",
          detection:
            "Monitor auth.log and secure logs for SSH authentication failures, repeated failed passwords, or anomalous source IPs.",
        });
      }

      // Port 3389 - RDP
      if (num === 3389 || s.includes("rdp") || s.includes("ms-wbt-server")) {
        add({
          techniqueId: "T1021.001",
          techniqueName: "Remote Services: Remote Desktop Protocol",
          tactic: "Lateral Movement",
          tacticColor: TACTIC_COLORS["Lateral Movement"],
          description:
            "Publicly exposed Remote Desktop Protocol (RDP) listener is a primary target for ransomware operators and credential sprayers.",
          relatedPort: num,
          relatedService: p.service,
          severity: "high",
          detection:
            "Track Windows Event ID 4624 (Logon Type 10) and Event ID 4625 for remote logon failures and external RDP attempts.",
        });
      }

      // Port 445 / 139 - SMB
      if (num === 445 || num === 139 || s.includes("smb") || s.includes("microsoft-ds")) {
        add({
          techniqueId: "T1021.002",
          techniqueName: "Remote Services: SMB/Windows Admin Shares",
          tactic: "Lateral Movement",
          tacticColor: TACTIC_COLORS["Lateral Movement"],
          description:
            "Direct SMB exposure over the network enables lateral movement, remote service creation, and relay attacks.",
          relatedPort: num,
          relatedService: p.service,
          severity: "high",
          detection:
            "Block inbound TCP 445 at perimeter edge; monitor Event ID 5140 for network share object access.",
        });
      }

      // Database Ports (MySQL 3306, Postgres 5432, MSSQL 1433, Redis 6379, MongoDB 27017)
      if (
        [3306, 5432, 1433, 6379, 27017].includes(num) ||
        s.includes("mysql") ||
        s.includes("postgres") ||
        s.includes("redis") ||
        s.includes("mongodb") ||
        s.includes("ms-sql")
      ) {
        add({
          techniqueId: "T1190",
          techniqueName: "Exploit Public-Facing Application",
          tactic: "Initial Access",
          tacticColor: TACTIC_COLORS["Initial Access"],
          description:
            `Directly accessible database listener (${p.service.toUpperCase()}) permits credential brute-forcing, unauthenticated queries, or data exfiltration.`,
          relatedPort: num,
          relatedService: p.service,
          severity: "critical",
          detection:
            "Alert on external IP connections connecting directly to database listener ports.",
        });
      }

      // Port 21 - FTP
      if (num === 21 || s.includes("ftp")) {
        add({
          techniqueId: "T1071",
          techniqueName: "Application Layer Protocol: FTP",
          tactic: "Command and Control",
          tacticColor: TACTIC_COLORS["Command and Control"],
          description:
            "Plaintext FTP daemon allows credential sniffing, anonymous logins, and file manipulation.",
          relatedPort: num,
          relatedService: p.service,
          severity: "medium",
          detection:
            "Inspect FTP authentication logs for anonymous logins and repetitive authentication failures.",
        });
      }

      // Generic Port Exposure Discovery
      add({
        techniqueId: "T1046",
        techniqueName: "Network Service Discovery",
        tactic: "Discovery",
        tacticColor: TACTIC_COLORS["Discovery"],
        description: `Active listening port ${num} (${p.service}) detected during network reconnaissance.`,
        relatedPort: num,
        relatedService: p.service,
        severity: "low",
        detection:
          "Deploy network intrusion detection system (NIDS) to identify external port scan probes and SYN sweeps.",
      });
    }
  }

  // Always ensure baseline reconnaissance is represented
  if (mitreList.length === 0) {
    mitreList.push({
      techniqueId: "T1595.002",
      techniqueName: "Active Scanning: Vulnerability Scanning",
      tactic: "Reconnaissance",
      tacticColor: TACTIC_COLORS["Reconnaissance"],
      description: "Host was enumerated for open network ports and web exposure vectors.",
      relatedPort: 80,
      relatedService: "http",
      severity: "low",
      detection: "Audit firewall logs for sequential connection requests across multiple ports.",
    });
  }

  return mitreList;
}

/**
 * Constructs a structured Penetration Task Graph (PTG) containing actionable exploit paths.
 */
export function generateAttackPaths(
  findings: Finding[],
  result?: GeneratedScanResult,
  targetUrl?: string,
): GeneratedAttackPath[] {
  const paths: GeneratedAttackPath[] = [];
  const openPorts = result?.ports?.filter((p) => p.state === "open") || [];
  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasHigh = findings.some((f) => f.severity === "high");
  const hasGitOrEnv = findings.some(
    (f) => f.title.includes(".git") || f.title.includes(".env"),
  );
  const hasHttp = findings.some((f) => f.title.includes("unencrypted HTTP"));
  const hasCspMissing = findings.some((f) => f.title.includes("Content Security Policy"));
  const hasInsecureCookie = findings.some((f) => f.title.includes("cookie"));

  const targetHost = targetUrl ? new URL(targetUrl).hostname : "target";

  // -------------------------------------------------------------
  // Path A: Web Perimeter & Client-Side Compromise Chain
  // -------------------------------------------------------------
  const webNodes = [
    {
      id: "node-web-1",
      label: "Active Target Reconnaissance",
      technique: "T1595.002 Active Scanning",
      tactic: "Reconnaissance",
      status: "completed" as const,
      probability: 100,
      detail: `Target perimeter crawled; verified HTTP service headers and application attack surface on ${targetHost}.`,
    },
    {
      id: "node-web-2",
      label: hasHttp
        ? "Network Traffic Interception (Plaintext HTTP)"
        : hasCspMissing
        ? "Client-Side Protection Bypass (Missing CSP)"
        : "Web Defense Evasion",
      technique: hasHttp ? "T1040 Network Sniffing" : "T1189 Drive-by Compromise",
      tactic: hasHttp ? "Credential Access" : "Initial Access",
      status: hasHttp || hasCspMissing ? ("active" as const) : ("pending" as const),
      probability: hasHttp ? 85 : hasCspMissing ? 65 : 40,
      detail: hasHttp
        ? "Plaintext HTTP transport observed; adversary can capture session data or inject malicious payloads into in-flight responses."
        : hasCspMissing
        ? "Missing Content Security Policy enables unrestricted execution of injected scripts if reflection points are discovered."
        : "Standard web defenses in place; requires zero-day or complex client-side vector.",
    },
    {
      id: "node-web-3",
      label: hasInsecureCookie
        ? "Session Cookie Extraction"
        : "Clickjacking / Unauthorized Action Triggers",
      technique: hasInsecureCookie ? "T1539 Steal Web Session Cookie" : "T1204 User Execution",
      tactic: hasInsecureCookie ? "Credential Access" : "Execution",
      status: hasInsecureCookie ? ("active" as const) : ("pending" as const),
      probability: hasInsecureCookie ? 75 : 50,
      detail: hasInsecureCookie
        ? "Insecure cookie flags permit script-based theft or transmission across unencrypted channels."
        : "Missing framing controls allow overlay attacks to trick authenticated users into executing privileged operations.",
    },
    {
      id: "node-web-4",
      label: "Persistent Administrative Session Takeover",
      technique: "T1078 Valid Accounts",
      tactic: "Persistence",
      status: "pending" as const,
      probability: hasCritical || hasHigh ? 65 : 30,
      detail:
        "Adversary uses hijacked credentials or session state to maintain access as an authenticated operator.",
    },
  ];

  const pathAProb = Math.round(
    webNodes.reduce((acc, n) => acc + (n.status === "completed" ? 100 : n.probability), 0) /
      webNodes.length,
  );

  paths.push({
    id: "path-a",
    name: "Web Application Perimeter Compromise Chain",
    probability: pathAProb,
    nodes: webNodes,
  });

  // -------------------------------------------------------------
  // Path B: Sensitive Data & Secret Exfiltration Chain
  // -------------------------------------------------------------
  const secretNodes = [
    {
      id: "node-sec-1",
      label: "Directory & Exposure Enumeration",
      technique: "T1083 File and Directory Discovery",
      tactic: "Discovery",
      status: "completed" as const,
      probability: 100,
      detail: "Endpoint crawler probed sensitive paths including /.git/HEAD, /.env, and standard backup paths.",
    },
    {
      id: "node-sec-2",
      label: hasGitOrEnv
        ? "Direct Sensitive File Exposure Harvested"
        : "Configuration & Backup Probing",
      technique: "T1552.001 Credentials in Files",
      tactic: "Credential Access",
      status: hasGitOrEnv ? ("completed" as const) : ("pending" as const),
      probability: hasGitOrEnv ? 95 : 25,
      detail: hasGitOrEnv
        ? "Direct exposure of configuration or source control metadata detected with verifiable signatures."
        : "Probing indicated no public disclosure of primary .env or .git files on scanned endpoints.",
    },
    {
      id: "node-sec-3",
      label: "Secret Extraction & Key Reconstruction",
      technique: "T1555 Credentials from Password Stores",
      tactic: "Credential Access",
      status: hasGitOrEnv ? ("active" as const) : ("pending" as const),
      probability: hasGitOrEnv ? 90 : 20,
      detail: hasGitOrEnv
        ? "Extracted environment contents allow adversaries to parse database connection URIs, JWT secrets, and cloud API tokens."
        : "Adversary would require secondary brute-force or memory dump to acquire application secrets.",
    },
    {
      id: "node-sec-4",
      label: "Automated Data Exfiltration to External C2",
      technique: "T1567 Exfiltration Over Web Service",
      tactic: "Exfiltration",
      status: "pending" as const,
      probability: hasGitOrEnv ? 80 : 20,
      detail: "Exfiltrating sensitive internal customer data, credentials, and telemetry to adversary-controlled cloud endpoints.",
    },
  ];

  const pathBProb = Math.round(
    secretNodes.reduce((acc, n) => acc + (n.status === "completed" ? 100 : n.probability), 0) /
      secretNodes.length,
  );

  paths.push({
    id: "path-b",
    name: "Configuration & Credential Exfiltration Chain",
    probability: pathBProb,
    nodes: secretNodes,
  });

  // -------------------------------------------------------------
  // Path C: Network Infrastructure & Service Pivot Chain
  // -------------------------------------------------------------
  const hasSensitivePort = openPorts.some((p) =>
    [21, 22, 445, 1433, 3306, 3389, 5432, 6379, 27017].includes(p.port),
  );
  const sensitivePortList = openPorts
    .filter((p) => [21, 22, 445, 1433, 3306, 3389, 5432, 6379, 27017].includes(p.port))
    .map((p) => `${p.port}/${p.service}`)
    .join(", ");

  const infraNodes = [
    {
      id: "node-inf-1",
      label: "Network Port & Banner Enumeration",
      technique: "T1046 Network Service Discovery",
      tactic: "Discovery",
      status: "completed" as const,
      probability: 100,
      detail: `TCP discovery identified ${openPorts.length} open port(s)${sensitivePortList ? `: ${sensitivePortList}` : ""}.`,
    },
    {
      id: "node-inf-2",
      label: hasSensitivePort
        ? `Direct Service Authentication Probe (${sensitivePortList || "Open Ports"})`
        : "Perimeter Boundary Defense",
      technique: hasSensitivePort ? "T1110 Brute Force" : "T1190 Exploit Public-Facing App",
      tactic: hasSensitivePort ? "Credential Access" : "Initial Access",
      status: hasSensitivePort ? ("active" as const) : ("pending" as const),
      probability: hasSensitivePort ? 70 : 30,
      detail: hasSensitivePort
        ? `Exposed administrative/database services (${sensitivePortList}) allow password spraying or targeted credential attacks.`
        : "No direct remote administrative ports discovered outside standard web listener.",
    },
    {
      id: "node-inf-3",
      label: "Local Privilege Escalation",
      technique: "T1068 Exploitation for Privilege Escalation",
      tactic: "Privilege Escalation",
      status: "pending" as const,
      probability: hasSensitivePort ? 55 : 25,
      detail: "Exploiting local kernel vulnerabilities or misconfigured sudo/service permissions to gain root or SYSTEM privilege.",
    },
    {
      id: "node-inf-4",
      label: "Internal Subnet Lateral Movement",
      technique: "T1021 Remote Services",
      tactic: "Lateral Movement",
      status: "pending" as const,
      probability: hasSensitivePort ? 60 : 20,
      detail: "Using compromised target as a pivot proxy to scan and exploit adjacent internal infrastructure.",
    },
  ];

  const pathCProb = Math.round(
    infraNodes.reduce((acc, n) => acc + (n.status === "completed" ? 100 : n.probability), 0) /
      infraNodes.length,
  );

  paths.push({
    id: "path-c",
    name: "Network Service Exposure & Lateral Pivot Chain",
    probability: pathCProb,
    nodes: infraNodes,
  });

  return paths;
}

