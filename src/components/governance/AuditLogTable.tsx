"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { auditLogs, type AuditSource, type RiskLevel } from "@/lib/governance-data";

const sourceColors: Record<AuditSource, string> = {
  OSC: "#f59e0b",
  DRC: "#3b82f6",
  GAC: "#8b5cf6",
  SYSTEM: "#06b6d4",
  USER: "#10b981",
};

const riskColors: Record<RiskLevel, { color: string; bg: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  high: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  medium: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  none: { color: "#94a3b8", bg: "rgba(148,163,184,0.05)" },
};

const actionLabels: Record<string, string> = {
  scan_initiated: "Scan Initiated",
  scan_completed: "Scan Completed",
  alert_triggered: "Alert Triggered",
  remediation_started: "Remediation Started",
  remediation_completed: "Remediation Completed",
  agent_spawned: "Agent Spawned",
  agent_terminated: "Agent Terminated",
  config_changed: "Config Changed",
  access_granted: "Access Granted",
  access_denied: "Access Denied",
  policy_violation: "Policy Violation",
  privilege_escalation: "Privilege Escalation",
};

export default function AuditLogTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<AuditSource | "all">("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filtered = auditLogs
    .filter((log) => {
      if (filterSource !== "all" && log.source !== filterSource) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          log.detail.toLowerCase().includes(q) ||
          log.actor.toLowerCase().includes(q) ||
          log.target.toLowerCase().includes(q) ||
          log.id.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return sortOrder === "desc" ? tb - ta : ta - tb;
    });

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-threat-purple/10 border border-threat-purple/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-threat-purple" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Audit Log</h3>
            <p className="text-[10px] text-text-muted">{filtered.length} entries</p>
          </div>
        </div>
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-text-muted hover:text-text-secondary bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all"
        >
          <Clock className="w-3 h-3" />
          {sortOrder === "desc" ? "Newest First" : "Oldest First"}
          {sortOrder === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* Filters */}
      <div className="px-5 py-3 border-b border-white/[0.03] flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actors, targets, details..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-bg-primary/60 border border-border-default text-[11px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-threat-purple/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-text-muted" />
          {(["all", "OSC", "DRC", "GAC", "SYSTEM", "USER"] as const).map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-all duration-200 border ${
                filterSource === src
                  ? src === "all"
                    ? "bg-white/10 text-text-primary border-white/15"
                    : "border-opacity-30"
                  : "text-text-muted hover:text-text-secondary bg-white/[0.02] border-transparent"
              }`}
              style={
                filterSource === src && src !== "all"
                  ? {
                      backgroundColor: `${sourceColors[src]}15`,
                      borderColor: `${sourceColors[src]}30`,
                      color: sourceColors[src],
                    }
                  : undefined
              }
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[460px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-bg-secondary/95 backdrop-blur-sm z-10">
            <tr>
              <th className="text-left text-[9px] font-mono font-semibold text-text-muted px-5 py-2.5 uppercase">Time</th>
              <th className="text-left text-[9px] font-mono font-semibold text-text-muted px-3 py-2.5 uppercase">Source</th>
              <th className="text-left text-[9px] font-mono font-semibold text-text-muted px-3 py-2.5 uppercase">Action</th>
              <th className="text-left text-[9px] font-mono font-semibold text-text-muted px-3 py-2.5 uppercase">Actor</th>
              <th className="text-left text-[9px] font-mono font-semibold text-text-muted px-3 py-2.5 uppercase">Target</th>
              <th className="text-left text-[9px] font-mono font-semibold text-text-muted px-3 py-2.5 uppercase">Risk</th>
              <th className="text-center text-[9px] font-mono font-semibold text-text-muted px-3 py-2.5 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => {
              const risk = riskColors[log.riskLevel];
              const isExpanded = expandedRow === log.id;

              return (
                <React.Fragment key={log.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                    className={`border-t border-white/[0.03] cursor-pointer transition-colors ${
                      isExpanded ? "bg-white/[0.03]" : "hover:bg-white/[0.015]"
                    } ${!log.approved ? "bg-threat-red/[0.02]" : ""}`}
                  >
                    <td className="px-5 py-2.5 text-[10px] font-mono text-text-muted">{formatTime(log.timestamp)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${sourceColors[log.source]}15`, color: sourceColors[log.source], border: `1px solid ${sourceColors[log.source]}25` }}
                      >
                        {log.source}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-text-secondary">{actionLabels[log.action] || log.action}</td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-text-primary">{log.actor}</td>
                    <td className="px-3 py-2.5 text-[10px] font-mono text-text-muted">{log.target}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: risk.bg, color: risk.color, border: `1px solid ${risk.color}25` }}
                      >
                        {log.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {log.approved ? (
                        <CheckCircle className="w-4 h-4 text-threat-green mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-threat-red mx-auto" />
                      )}
                    </td>
                  </motion.tr>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={7} className="px-5 py-3 bg-white/[0.01]">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-text-secondary leading-relaxed">{log.detail}</p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                              <span className="font-mono">Session: {log.sessionId}</span>
                              <span>•</span>
                              <span className="font-mono">ID: {log.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
