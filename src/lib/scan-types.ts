export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Profile = "quick" | "full" | "vuln" | "stealth";
export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  url: string;
  evidence: string;
  impact: string;
  remediation: string;
  owasp: string;
  cwe: string;
  confidence: "observed" | "needs-review";
  source: "web" | "nmap";
  status: "open" | "reviewed" | "resolved";
  firstSeen: string;
}
export interface GeneratedPort {
  port: number;
  state: "open" | "filtered" | "closed";
  service: string;
  version: string;
  risk: Severity;
  cve?: string;
  cvssScore?: number;
}
export interface GeneratedScanResult {
  target: string;
  scanType: string;
  startTime: string;
  endTime: string;
  duration: string;
  osFingerprint: string;
  osCertainty: number;
  hostStatus: "up" | "down";
  totalPorts: number;
  openPorts: number;
  filteredPorts: number;
  closedPorts: number;
  ports: GeneratedPort[];
  services: string[];
  traceroute: { hop: number; ip: string; rtt: string }[];
  scripts?: { port: number; name: string; output: string }[];
}
export interface GeneratedAttackPath {
  id: string;
  name: string;
  probability: number;
  nodes: {
    id: string;
    label: string;
    technique: string;
    tactic: string;
    status: "completed" | "active" | "pending";
    probability: number;
    detail: string;
  }[];
}
export interface GeneratedMitreFinding {
  techniqueId: string;
  techniqueName: string;
  tactic: string;
  tacticColor: string;
  description: string;
  relatedPort: number;
  relatedService: string;
  severity: "critical" | "high" | "medium" | "low";
  detection: string;
}
export interface TerminalMessage {
  id: number;
  phase: "init" | "recon" | "tda" | "exploit" | "complete";
  type:
    | "system"
    | "thought"
    | "command"
    | "result"
    | "warning"
    | "success"
    | "error"
    | "separator";
  content: string;
  timestamp: string;
  delay: number;
}
export interface Coverage {
  module: string;
  status: "pending" | "running" | "complete" | "failed" | "skipped";
  detail: string;
}
export interface ScanSession {
  id: string;
  target: string;
  scanType: string;
  profileId: Profile;
  status: "running" | "complete" | "partial" | "failed" | "cancelled";
  createdAt: string;
  finishedAt?: string;
  progress: number;
  error?: string;
  result?: GeneratedScanResult;
  attackPaths: GeneratedAttackPath[];
  mitreFindings: GeneratedMitreFinding[];
  findings: Finding[];
  terminalStream: TerminalMessage[];
  coverage: Coverage[];
  pages: { url: string; status: number; duration: number }[];
  ai?: {
    status: "complete" | "skipped" | "failed";
    model?: string;
    text: string;
  };
}
export interface Settings {
  defaultProfile: Profile;
  maxPages: number;
  timeoutSeconds: number;
  nmapEnabled: boolean;
  aiEnabled: boolean;
}
export interface AuditEvent {
  id: string;
  time: string;
  action: string;
  detail: string;
  scanId?: string;
}
