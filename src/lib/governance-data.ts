// ===== THREATLENS AI — GOVERNANCE MOCK DATA =====

export type AuditAction = "scan_initiated" | "scan_completed" | "alert_triggered" | "remediation_started" | "remediation_completed" | "agent_spawned" | "agent_terminated" | "config_changed" | "access_granted" | "access_denied" | "policy_violation" | "privilege_escalation";
export type AuditSource = "OSC" | "DRC" | "GAC" | "SYSTEM" | "USER";
export type RiskLevel = "critical" | "high" | "medium" | "low" | "none";

// ----- Audit Log Entries -----
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  source: AuditSource;
  actor: string;
  target: string;
  detail: string;
  riskLevel: RiskLevel;
  approved: boolean;
  sessionId: string;
}

export const auditLogs: AuditLogEntry[] = [
  { id: "AUD-001", timestamp: "2026-04-23T09:32:14Z", action: "scan_initiated", source: "OSC", actor: "PentestAgent-01", target: "192.168.1.105", detail: "Vulnerability Assessment scan launched against target. Profile: Full Port + CVE Detection.", riskLevel: "medium", approved: true, sessionId: "SES-4a2b" },
  { id: "AUD-002", timestamp: "2026-04-23T09:32:15Z", action: "agent_spawned", source: "OSC", actor: "AgentOrchestrator", target: "ReconAgent-Alpha", detail: "Reconnaissance agent spawned for target enumeration. Memory allocation: 512MB. TTL: 300s.", riskLevel: "low", approved: true, sessionId: "SES-4a2b" },
  { id: "AUD-003", timestamp: "2026-04-23T09:33:01Z", action: "alert_triggered", source: "DRC", actor: "AnomalyDetector", target: "DC-01", detail: "CRITICAL: LSASS memory access detected. Mimikatz-like behavior from PID 4892.", riskLevel: "critical", approved: true, sessionId: "SES-9f1c" },
  { id: "AUD-004", timestamp: "2026-04-23T09:33:15Z", action: "remediation_started", source: "DRC", actor: "RemediationAgent-02", target: "DC-01", detail: "Auto-isolation triggered for endpoint DC-01. Playbook PB-001 initiated.", riskLevel: "high", approved: true, sessionId: "SES-9f1c" },
  { id: "AUD-005", timestamp: "2026-04-23T09:34:00Z", action: "privilege_escalation", source: "GAC", actor: "PentestAgent-01", target: "SYSTEM", detail: "⚠ OWASP A01: Agent requested elevated privileges beyond initial scope. Action was BLOCKED by governance policy.", riskLevel: "critical", approved: false, sessionId: "SES-4a2b" },
  { id: "AUD-006", timestamp: "2026-04-23T09:34:30Z", action: "policy_violation", source: "GAC", actor: "ReconAgent-Alpha", target: "10.0.0.0/8", detail: "⚠ OWASP A04: Agent attempted to scan targets outside approved scope (10.0.1.0/24 → 10.0.0.0/8). Scope creep BLOCKED.", riskLevel: "high", approved: false, sessionId: "SES-4a2b" },
  { id: "AUD-007", timestamp: "2026-04-23T09:35:12Z", action: "scan_completed", source: "OSC", actor: "PentestAgent-01", target: "192.168.1.105", detail: "Scan complete. 8 open ports, 7 CVEs, 3 attack paths generated. Results forwarded to DRC.", riskLevel: "low", approved: true, sessionId: "SES-4a2b" },
  { id: "AUD-008", timestamp: "2026-04-23T09:35:30Z", action: "agent_terminated", source: "OSC", actor: "AgentOrchestrator", target: "ReconAgent-Alpha", detail: "Agent gracefully terminated after task completion. Runtime: 195s. Memory freed.", riskLevel: "none", approved: true, sessionId: "SES-4a2b" },
  { id: "AUD-009", timestamp: "2026-04-23T09:36:00Z", action: "remediation_completed", source: "DRC", actor: "RemediationAgent-02", target: "DC-01", detail: "Automated steps 1-2 of PB-001 completed. Malicious process terminated. Endpoint isolated.", riskLevel: "low", approved: true, sessionId: "SES-9f1c" },
  { id: "AUD-010", timestamp: "2026-04-23T09:37:00Z", action: "config_changed", source: "USER", actor: "admin@threatlens.ai", target: "OSC-Config", detail: "Scan scope updated: Added 10.0.2.0/24 to approved target list. Max concurrent agents: 4 → 6.", riskLevel: "medium", approved: true, sessionId: "SES-d210" },
  { id: "AUD-011", timestamp: "2026-04-23T09:38:00Z", action: "access_denied", source: "GAC", actor: "analyst@threatlens.ai", target: "Exploit Execution", detail: "⚠ RBAC: User 'analyst' attempted to execute exploit simulation. Required role: 'red_team_lead'. Access DENIED.", riskLevel: "medium", approved: false, sessionId: "SES-e5a1" },
  { id: "AUD-012", timestamp: "2026-04-23T09:39:00Z", action: "access_granted", source: "SYSTEM", actor: "red_team_lead@threatlens.ai", target: "Exploit Execution", detail: "RBAC: User 'red_team_lead' authorized for exploit simulation on target 192.168.1.105.", riskLevel: "low", approved: true, sessionId: "SES-f7b3" },
];

// ----- OWASP Top 10 Agentic Application Risks -----
export interface OwaspAgentRisk {
  id: string;
  code: string;
  name: string;
  description: string;
  status: "monitored" | "detected" | "blocked" | "cleared";
  lastChecked: string;
  detectionCount: number;
  example: string;
}

export const owaspAgentRisks: OwaspAgentRisk[] = [
  {
    id: "owasp-01",
    code: "A01",
    name: "Agent Goal Hijacking",
    description: "An attacker manipulates agent objectives through prompt injection, causing the agent to deviate from intended security tasks.",
    status: "blocked",
    lastChecked: "2 min ago",
    detectionCount: 1,
    example: "PentestAgent-01 attempted privilege escalation beyond scope",
  },
  {
    id: "owasp-02",
    code: "A02",
    name: "Sensitive Information Disclosure",
    description: "Agent inadvertently exposes credentials, API keys, or PII during task execution or in output logs.",
    status: "monitored",
    lastChecked: "5 min ago",
    detectionCount: 0,
    example: "No incidents detected in current session",
  },
  {
    id: "owasp-03",
    code: "A03",
    name: "Insufficient Sandboxing",
    description: "Agents execute code or commands without proper isolation, risking host system compromise.",
    status: "cleared",
    lastChecked: "10 min ago",
    detectionCount: 0,
    example: "All agents running in containerized sandbox",
  },
  {
    id: "owasp-04",
    code: "A04",
    name: "Unauthorized Scope Expansion",
    description: "Agent exceeds its defined operational boundaries by targeting systems or data outside its approved scope.",
    status: "blocked",
    lastChecked: "3 min ago",
    detectionCount: 1,
    example: "ReconAgent-Alpha attempted scan of 10.0.0.0/8 (outside scope)",
  },
  {
    id: "owasp-05",
    code: "A05",
    name: "Privilege Abuse",
    description: "Agent uses elevated permissions beyond what's necessary for its assigned task (violation of least privilege).",
    status: "monitored",
    lastChecked: "8 min ago",
    detectionCount: 0,
    example: "No privilege abuse detected",
  },
  {
    id: "owasp-06",
    code: "A06",
    name: "Uncontrolled Resource Consumption",
    description: "Agent consumes excessive compute, memory, or network resources, potentially causing denial of service.",
    status: "cleared",
    lastChecked: "1 min ago",
    detectionCount: 0,
    example: "All agents within resource limits",
  },
];

// ----- RBAC Roles -----
export interface RbacRole {
  id: string;
  name: string;
  level: number;
  permissions: string[];
  assignedUsers: number;
  color: string;
}

export const rbacRoles: RbacRole[] = [
  {
    id: "role-admin",
    name: "System Admin",
    level: 5,
    permissions: ["full_access", "config_change", "user_management", "agent_deploy", "exploit_execute", "data_export"],
    assignedUsers: 1,
    color: "#ef4444",
  },
  {
    id: "role-rtl",
    name: "Red Team Lead",
    level: 4,
    permissions: ["scan_execute", "exploit_execute", "agent_deploy", "report_generate", "scope_modify"],
    assignedUsers: 2,
    color: "#f59e0b",
  },
  {
    id: "role-btl",
    name: "Blue Team Lead",
    level: 4,
    permissions: ["alert_manage", "remediation_execute", "playbook_modify", "agent_deploy", "report_generate"],
    assignedUsers: 2,
    color: "#3b82f6",
  },
  {
    id: "role-analyst",
    name: "SOC Analyst",
    level: 3,
    permissions: ["alert_view", "scan_view", "report_view", "alert_investigate"],
    assignedUsers: 6,
    color: "#10b981",
  },
  {
    id: "role-auditor",
    name: "Compliance Auditor",
    level: 2,
    permissions: ["audit_view", "report_view", "governance_view"],
    assignedUsers: 3,
    color: "#8b5cf6",
  },
  {
    id: "role-viewer",
    name: "Read-Only Viewer",
    level: 1,
    permissions: ["dashboard_view"],
    assignedUsers: 12,
    color: "#94a3b8",
  },
];
