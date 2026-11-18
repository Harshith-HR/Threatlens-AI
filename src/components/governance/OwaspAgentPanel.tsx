"use client";

import React from "react";
import { motion } from "motion/react";
import { Shield, ShieldCheck, ShieldAlert, ShieldBan, ShieldX } from "lucide-react";
import { owaspAgentRisks, type OwaspAgentRisk } from "@/lib/governance-data";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  monitored: { icon: <Shield className="w-4 h-4" />, color: "#3b82f6", bg: "rgba(59,130,246,0.1)", label: "MONITORED" },
  detected: { icon: <ShieldAlert className="w-4 h-4" />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "DETECTED" },
  blocked: { icon: <ShieldBan className="w-4 h-4" />, color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "BLOCKED" },
  cleared: { icon: <ShieldCheck className="w-4 h-4" />, color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "CLEARED" },
};

export default function OwaspAgentPanel() {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-threat-amber/10 border border-threat-amber/20 flex items-center justify-center">
            <ShieldX className="w-4 h-4 text-threat-amber" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">OWASP Top 10 Agentic Risks</h3>
            <p className="text-[10px] text-text-muted">Real-time agent safety monitoring</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-2.5">
        {owaspAgentRisks.map((risk, i) => (
          <OwaspRiskCard key={risk.id} risk={risk} index={i} />
        ))}
      </div>
    </div>
  );
}

function OwaspRiskCard({ risk, index }: { risk: OwaspAgentRisk; index: number }) {
  const status = statusConfig[risk.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-3.5 rounded-lg border transition-all duration-200 ${
        risk.status === "blocked"
          ? "bg-threat-red/[0.03] border-threat-red/15"
          : risk.status === "detected"
          ? "bg-threat-amber/[0.03] border-threat-amber/15"
          : "bg-white/[0.01] border-white/[0.04] hover:border-white/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            {status.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono font-bold text-threat-cyan">{risk.code}</span>
              <span className="text-xs font-semibold text-text-primary">{risk.name}</span>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed mb-1.5">{risk.description}</p>
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-text-muted">
                Checked: <span className="font-mono">{risk.lastChecked}</span>
              </span>
              {risk.detectionCount > 0 && (
                <span className="text-[9px] font-mono text-threat-red">
                  {risk.detectionCount} detection{risk.detectionCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {risk.detectionCount > 0 && (
              <p className="text-[10px] font-mono text-threat-amber mt-1.5 px-2 py-1 rounded bg-threat-amber/5 border border-threat-amber/10">
                ⚠ {risk.example}
              </p>
            )}
          </div>
        </div>

        <span
          className="text-[8px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0"
          style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.color}25` }}
        >
          {status.label}
        </span>
      </div>
    </motion.div>
  );
}
