"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Terminal,
  MapPin,
  ArrowRight,
  Clock,
  User,
  Filter,
  Search,
} from "lucide-react";
import { siemAlerts, type SiemAlert, type AlertSeverity, type AlertStatus } from "@/lib/defensive-data";

const severityConfig: Record<AlertSeverity, { icon: React.ReactNode; color: string; bg: string }> = {
  critical: { icon: <AlertCircle className="w-4 h-4" />, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  high: { icon: <AlertTriangle className="w-4 h-4" />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  medium: { icon: <Info className="w-4 h-4" />, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  low: { icon: <CheckCircle className="w-4 h-4" />, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  info: { icon: <ShieldCheck className="w-4 h-4" />, color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
};

const statusConfig: Record<AlertStatus, { color: string; bg: string; label: string }> = {
  active: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "ACTIVE" },
  investigating: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "INVESTIGATING" },
  contained: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", label: "CONTAINED" },
  resolved: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "RESOLVED" },
  "false-positive": { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", label: "FALSE POSITIVE" },
};

interface AlertTimelineProps {
  onOpenPlaybook: (alertId: string) => void;
}

export default function AlertTimeline({ onOpenPlaybook }: AlertTimelineProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = siemAlerts.filter((alert) => {
    if (filterSeverity !== "all" && alert.severity !== filterSeverity) return false;
    if (searchQuery && !alert.title.toLowerCase().includes(searchQuery.toLowerCase()) && !alert.sourceIp.includes(searchQuery)) return false;
    return true;
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
          <div className="w-8 h-8 rounded-lg bg-threat-red/10 border border-threat-red/20 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-threat-red" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Alert Timeline</h3>
            <p className="text-[10px] text-text-muted">{filteredAlerts.length} alerts shown</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 py-3 border-b border-white/[0.03] flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts, IPs..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-bg-primary/60 border border-border-default text-[11px] text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-threat-green/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-text-muted" />
          {(["all", "critical", "high", "medium", "low"] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-all duration-200 ${
                filterSeverity === sev
                  ? sev === "all"
                    ? "bg-white/10 text-text-primary border border-white/15"
                    : `text-white border`
                  : "text-text-muted hover:text-text-secondary bg-white/[0.02] border border-transparent"
              }`}
              style={
                filterSeverity === sev && sev !== "all"
                  ? {
                      backgroundColor: severityConfig[sev].bg,
                      borderColor: `${severityConfig[sev].color}30`,
                      color: severityConfig[sev].color,
                    }
                  : undefined
              }
            >
              {sev.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="max-h-[520px] overflow-y-auto">
        {filteredAlerts.map((alert, i) => (
          <AlertRow
            key={alert.id}
            alert={alert}
            index={i}
            isExpanded={expandedAlert === alert.id}
            onToggle={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
            onOpenPlaybook={onOpenPlaybook}
            formatTime={formatTime}
          />
        ))}
      </div>
    </div>
  );
}

function AlertRow({
  alert,
  index,
  isExpanded,
  onToggle,
  onOpenPlaybook,
  formatTime,
}: {
  alert: SiemAlert;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenPlaybook: (id: string) => void;
  formatTime: (ts: string) => string;
}) {
  const sev = severityConfig[alert.severity];
  const status = statusConfig[alert.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`border-b border-white/[0.03] transition-colors duration-150 ${
        isExpanded ? "bg-white/[0.02]" : "hover:bg-white/[0.01]"
      }`}
    >
      {/* Main Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3 text-left"
      >
        {/* Severity */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: sev.bg, color: sev.color }}
        >
          {sev.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-text-primary truncate">{alert.title}</span>
            <span
              className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.color}25` }}
            >
              {alert.severity.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-text-muted">
            <span className="font-mono">{alert.sourceIp}</span>
            <ArrowRight className="w-2.5 h-2.5" />
            <span className="font-mono">{alert.destIp}</span>
            <span>•</span>
            <span>{alert.source}</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.color}25` }}
          >
            {status.label}
          </span>
          <div className="flex items-center gap-1 text-text-muted">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-mono">{formatTime(alert.timestamp)}</span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </button>

      {/* Expanded Detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pl-16 space-y-3">
              {/* Description */}
              <p className="text-xs text-text-secondary leading-relaxed">{alert.description}</p>

              {/* Meta grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <span className="text-[9px] text-text-muted uppercase">Alert ID</span>
                  <p className="text-[11px] font-mono text-text-primary">{alert.id}</p>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted uppercase">MITRE Tactic</span>
                  <p className="text-[11px] font-mono text-threat-purple">{alert.mitreTactic}</p>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted uppercase">Technique ID</span>
                  <p className="text-[11px] font-mono text-threat-cyan">{alert.mitreId}</p>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted uppercase">Event Count</span>
                  <p className="text-[11px] font-mono text-text-primary">{alert.count.toLocaleString()}</p>
                </div>
              </div>

              {/* Assignee */}
              {alert.assignee && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-text-muted" />
                  <span className="text-[10px] text-text-muted">Assigned to:</span>
                  <span className="text-[10px] font-mono text-text-primary">{alert.assignee}</span>
                </div>
              )}

              {/* OSC Simulation Link */}
              {alert.relatedOscSim && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-threat-amber" />
                  <span className="text-[10px] text-text-muted">Related OSC Simulation:</span>
                  <span className="text-[10px] font-mono text-threat-amber">{alert.relatedOscSim}</span>
                </div>
              )}

              {/* Raw Log */}
              <div className="p-3 rounded-lg bg-[#0a0a12] border border-white/[0.04] overflow-x-auto">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Terminal className="w-3 h-3 text-text-muted" />
                  <span className="text-[9px] font-semibold text-text-muted uppercase">Raw Log</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 whitespace-pre-wrap break-all leading-relaxed">
                  {alert.rawLog}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPlaybook(alert.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-threat-blue/10 border border-threat-blue/20 text-threat-blue text-[11px] font-semibold hover:bg-threat-blue/15 transition-colors"
                >
                  View Remediation Playbook
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-secondary text-[11px] font-semibold hover:bg-white/[0.05] transition-colors">
                  Escalate
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-secondary text-[11px] font-semibold hover:bg-white/[0.05] transition-colors">
                  Mark Resolved
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
