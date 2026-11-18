// ===== THREATLENS AI — MOCK DATA =====
// Centralized mock data for dashboard widgets and components

export type ThreatSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AgentStatus = "online" | "idle" | "alert" | "offline";

// ----- Recent Alerts -----
export interface Alert {
  id: string;
  severity: ThreatSeverity;
  title: string;
  description: string;
  source: string;
  sourceIp: string;
  timestamp: string;
  mitreTactic?: string;
  status: "active" | "investigating" | "resolved";
}

export const recentAlerts: Alert[] = [
  {
    id: "ALT-001",
    severity: "critical",
    title: "Credential Dumping Detected",
    description: "Mimikatz-like behavior detected on endpoint DC-01. LSASS memory access from unauthorized process.",
    source: "Endpoint Detection",
    sourceIp: "10.0.1.15",
    timestamp: "2026-04-23T09:32:14Z",
    mitreTactic: "Credential Access (T1003)",
    status: "active",
  },
  {
    id: "ALT-002",
    severity: "high",
    title: "Lateral Movement via SMB",
    description: "Unusual SMB traffic pattern detected. Multiple authentication attempts across subnet 10.0.2.x.",
    source: "Network IDS",
    sourceIp: "10.0.2.34",
    timestamp: "2026-04-23T09:28:47Z",
    mitreTactic: "Lateral Movement (T1021.002)",
    status: "investigating",
  },
  {
    id: "ALT-003",
    severity: "high",
    title: "Suspicious PowerShell Execution",
    description: "Encoded PowerShell command with network callback detected on WKS-042.",
    source: "EDR Agent",
    sourceIp: "10.0.3.42",
    timestamp: "2026-04-23T09:25:03Z",
    mitreTactic: "Execution (T1059.001)",
    status: "active",
  },
  {
    id: "ALT-004",
    severity: "medium",
    title: "Brute Force Login Attempts",
    description: "347 failed login attempts against SSH service on DMZ server within 10-minute window.",
    source: "Auth Monitor",
    sourceIp: "203.0.113.42",
    timestamp: "2026-04-23T09:18:22Z",
    mitreTactic: "Credential Access (T1110)",
    status: "investigating",
  },
  {
    id: "ALT-005",
    severity: "medium",
    title: "DNS Tunneling Suspected",
    description: "Anomalous DNS query volume detected: 2,847 TXT queries to single domain in 5 minutes.",
    source: "DNS Analytics",
    sourceIp: "10.0.1.88",
    timestamp: "2026-04-23T09:12:55Z",
    mitreTactic: "Exfiltration (T1048.001)",
    status: "active",
  },
  {
    id: "ALT-006",
    severity: "low",
    title: "Port Scan Detected",
    description: "Sequential TCP SYN scan across ports 1-1024 from external IP targeting perimeter firewall.",
    source: "Firewall",
    sourceIp: "198.51.100.77",
    timestamp: "2026-04-23T09:05:33Z",
    mitreTactic: "Reconnaissance (T1046)",
    status: "resolved",
  },
];

// ----- Network Activity (24h) -----
export interface NetworkDataPoint {
  time: string;
  inbound: number;
  outbound: number;
  threats: number;
}

export const networkActivityData: NetworkDataPoint[] = [
  { time: "00:00", inbound: 342, outbound: 278, threats: 2 },
  { time: "01:00", inbound: 198, outbound: 156, threats: 0 },
  { time: "02:00", inbound: 145, outbound: 132, threats: 1 },
  { time: "03:00", inbound: 167, outbound: 143, threats: 0 },
  { time: "04:00", inbound: 189, outbound: 167, threats: 0 },
  { time: "05:00", inbound: 234, outbound: 198, threats: 1 },
  { time: "06:00", inbound: 456, outbound: 389, threats: 3 },
  { time: "07:00", inbound: 678, outbound: 534, threats: 2 },
  { time: "08:00", inbound: 892, outbound: 756, threats: 5 },
  { time: "09:00", inbound: 1024, outbound: 867, threats: 8 },
  { time: "10:00", inbound: 1156, outbound: 934, threats: 12 },
  { time: "11:00", inbound: 1289, outbound: 1023, threats: 7 },
  { time: "12:00", inbound: 1198, outbound: 987, threats: 4 },
  { time: "13:00", inbound: 1345, outbound: 1098, threats: 6 },
  { time: "14:00", inbound: 1456, outbound: 1189, threats: 9 },
  { time: "15:00", inbound: 1389, outbound: 1134, threats: 5 },
  { time: "16:00", inbound: 1234, outbound: 1056, threats: 3 },
  { time: "17:00", inbound: 987, outbound: 845, threats: 4 },
  { time: "18:00", inbound: 756, outbound: 634, threats: 2 },
  { time: "19:00", inbound: 678, outbound: 567, threats: 1 },
  { time: "20:00", inbound: 589, outbound: 478, threats: 3 },
  { time: "21:00", inbound: 456, outbound: 389, threats: 2 },
  { time: "22:00", inbound: 398, outbound: 312, threats: 1 },
  { time: "23:00", inbound: 356, outbound: 289, threats: 0 },
];

// ----- MITRE ATT&CK Coverage -----
export interface MitreTactic {
  id: string;
  name: string;
  shortName: string;
  techniques: MitreTechnique[];
}

export interface MitreTechnique {
  id: string;
  name: string;
  coverage: number; // 0-100
  detected: number;
  total: number;
}

export const mitreData: MitreTactic[] = [
  {
    id: "TA0043",
    name: "Reconnaissance",
    shortName: "Recon",
    techniques: [
      { id: "T1595", name: "Active Scanning", coverage: 85, detected: 17, total: 20 },
      { id: "T1592", name: "Gather Victim Host Info", coverage: 60, detected: 6, total: 10 },
      { id: "T1589", name: "Gather Victim Identity", coverage: 45, detected: 9, total: 20 },
    ],
  },
  {
    id: "TA0001",
    name: "Initial Access",
    shortName: "Access",
    techniques: [
      { id: "T1566", name: "Phishing", coverage: 92, detected: 23, total: 25 },
      { id: "T1190", name: "Exploit Public Apps", coverage: 78, detected: 7, total: 9 },
      { id: "T1133", name: "External Remote Services", coverage: 65, detected: 13, total: 20 },
    ],
  },
  {
    id: "TA0002",
    name: "Execution",
    shortName: "Exec",
    techniques: [
      { id: "T1059", name: "Command & Scripting", coverage: 88, detected: 22, total: 25 },
      { id: "T1203", name: "Exploitation for Client Exec", coverage: 55, detected: 11, total: 20 },
      { id: "T1204", name: "User Execution", coverage: 72, detected: 18, total: 25 },
    ],
  },
  {
    id: "TA0003",
    name: "Persistence",
    shortName: "Persist",
    techniques: [
      { id: "T1547", name: "Boot/Logon Autostart", coverage: 80, detected: 16, total: 20 },
      { id: "T1053", name: "Scheduled Task/Job", coverage: 70, detected: 14, total: 20 },
      { id: "T1078", name: "Valid Accounts", coverage: 40, detected: 8, total: 20 },
    ],
  },
  {
    id: "TA0004",
    name: "Privilege Escalation",
    shortName: "PrivEsc",
    techniques: [
      { id: "T1548", name: "Abuse Elevation Control", coverage: 75, detected: 15, total: 20 },
      { id: "T1134", name: "Access Token Manipulation", coverage: 50, detected: 5, total: 10 },
    ],
  },
  {
    id: "TA0005",
    name: "Defense Evasion",
    shortName: "Evasion",
    techniques: [
      { id: "T1027", name: "Obfuscated Files", coverage: 62, detected: 31, total: 50 },
      { id: "T1070", name: "Indicator Removal", coverage: 48, detected: 12, total: 25 },
      { id: "T1036", name: "Masquerading", coverage: 55, detected: 11, total: 20 },
    ],
  },
  {
    id: "TA0006",
    name: "Credential Access",
    shortName: "CredAccess",
    techniques: [
      { id: "T1003", name: "OS Credential Dumping", coverage: 90, detected: 18, total: 20 },
      { id: "T1110", name: "Brute Force", coverage: 95, detected: 19, total: 20 },
    ],
  },
  {
    id: "TA0007",
    name: "Discovery",
    shortName: "Discover",
    techniques: [
      { id: "T1087", name: "Account Discovery", coverage: 68, detected: 17, total: 25 },
      { id: "T1046", name: "Network Service Scan", coverage: 82, detected: 41, total: 50 },
    ],
  },
  {
    id: "TA0008",
    name: "Lateral Movement",
    shortName: "LatMov",
    techniques: [
      { id: "T1021", name: "Remote Services", coverage: 75, detected: 15, total: 20 },
      { id: "T1570", name: "Lateral Tool Transfer", coverage: 45, detected: 9, total: 20 },
    ],
  },
  {
    id: "TA0010",
    name: "Exfiltration",
    shortName: "Exfil",
    techniques: [
      { id: "T1048", name: "Exfil Over Alt Protocol", coverage: 58, detected: 29, total: 50 },
      { id: "T1041", name: "Exfil Over C2 Channel", coverage: 42, detected: 21, total: 50 },
    ],
  },
  {
    id: "TA0040",
    name: "Impact",
    shortName: "Impact",
    techniques: [
      { id: "T1486", name: "Data Encrypted for Impact", coverage: 85, detected: 17, total: 20 },
      { id: "T1489", name: "Service Stop", coverage: 70, detected: 14, total: 20 },
    ],
  },
];

// ----- Agent Cluster Status -----
export interface AgentCluster {
  name: string;
  shortName: string;
  status: AgentStatus;
  activeAgents: number;
  totalAgents: number;
  lastActivity: string;
  description: string;
}

export const agentClusters: AgentCluster[] = [
  {
    name: "Offensive Simulation Cluster",
    shortName: "OSC",
    status: "online",
    activeAgents: 3,
    totalAgents: 4,
    lastActivity: "2 min ago",
    description: "Red Team — Active recon and exploit simulation",
  },
  {
    name: "Defensive Remediation Cluster",
    shortName: "DRC",
    status: "alert",
    activeAgents: 5,
    totalAgents: 5,
    lastActivity: "Just now",
    description: "Blue Team — Monitoring and auto-remediation",
  },
  {
    name: "Governance & Alignment Cluster",
    shortName: "GAC",
    status: "idle",
    activeAgents: 2,
    totalAgents: 3,
    lastActivity: "5 min ago",
    description: "Overseer — Compliance and audit logging",
  },
];

// ----- System Telemetry -----
export interface TelemetryMetric {
  name: string;
  value: number;
  unit: string;
  trend: number[];
  status: "normal" | "warning" | "critical";
}

export const systemTelemetry: TelemetryMetric[] = [
  {
    name: "CPU Usage",
    value: 47,
    unit: "%",
    trend: [32, 38, 42, 45, 40, 47, 52, 48, 45, 47],
    status: "normal",
  },
  {
    name: "Memory",
    value: 68,
    unit: "%",
    trend: [55, 58, 62, 65, 67, 68, 70, 69, 68, 68],
    status: "warning",
  },
  {
    name: "Network I/O",
    value: 234,
    unit: "Mbps",
    trend: [120, 145, 178, 210, 198, 220, 234, 256, 240, 234],
    status: "normal",
  },
  {
    name: "Disk I/O",
    value: 12,
    unit: "ms",
    trend: [8, 9, 11, 10, 12, 14, 13, 11, 12, 12],
    status: "normal",
  },
];

// ----- Vulnerability Summary -----
export interface VulnerabilitySummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  lastScanTime: string;
  trendVsPrevious: number; // +/- percentage
}

export const vulnerabilitySummary: VulnerabilitySummary = {
  critical: 3,
  high: 12,
  medium: 28,
  low: 45,
  total: 88,
  lastScanTime: "14 min ago",
  trendVsPrevious: -8,
};

// ----- Active Scans -----
export interface ActiveScan {
  id: string;
  target: string;
  type: "recon" | "vuln" | "exploit" | "compliance";
  progress: number;
  status: "running" | "queued" | "complete";
  startedAt: string;
}

export const activeScans: ActiveScan[] = [
  {
    id: "SCN-001",
    target: "10.0.1.0/24",
    type: "recon",
    progress: 72,
    status: "running",
    startedAt: "09:15:00",
  },
  {
    id: "SCN-002",
    target: "webapp.internal",
    type: "vuln",
    progress: 45,
    status: "running",
    startedAt: "09:22:00",
  },
  {
    id: "SCN-003",
    target: "192.168.1.0/24",
    type: "compliance",
    progress: 0,
    status: "queued",
    startedAt: "--:--:--",
  },
];

// ----- Threat Score -----
export const threatScore = {
  current: 73,
  level: "Elevated" as const,
  previousScore: 68,
  trend: "up" as const,
  factors: [
    { name: "Active Exploits", impact: 25 },
    { name: "Unpatched CVEs", impact: 18 },
    { name: "Anomalous Traffic", impact: 15 },
    { name: "Credential Exposure", impact: 10 },
    { name: "Policy Violations", impact: 5 },
  ],
};
