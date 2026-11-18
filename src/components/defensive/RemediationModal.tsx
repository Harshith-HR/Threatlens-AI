"use client";

import React from "react";
import { motion } from "motion/react";
import { X, Shield, CheckCircle2, Loader2, Circle, Clock, AlertTriangle, FileText } from "lucide-react";
import { remediationPlaybooks, type NistFunction } from "@/lib/defensive-data";

const nistColors: Record<NistFunction, { color: string; bg: string; label: string }> = {
  identify: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", label: "IDENTIFY" },
  protect: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", label: "PROTECT" },
  detect: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "DETECT" },
  respond: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "RESPOND" },
  recover: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "RECOVER" },
};

const stepStatusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  complete: { icon: <CheckCircle2 className="w-4 h-4" />, color: "#10b981" },
  "in-progress": { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "#f59e0b" },
  pending: { icon: <Circle className="w-4 h-4" />, color: "#475569" },
};

interface RemediationModalProps {
  alertId: string | null;
  onClose: () => void;
}

export default function RemediationModal({ alertId, onClose }: RemediationModalProps) {
  if (!alertId) return null;

  const playbook = remediationPlaybooks[alertId];
  if (!playbook) {
    return (
      <ModalWrapper onClose={onClose}>
        <div className="p-8 text-center">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">No Playbook Available</h3>
          <p className="text-xs text-text-muted">No remediation playbook has been generated for alert {alertId}.</p>
        </div>
      </ModalWrapper>
    );
  }

  const completedSteps = playbook.steps.filter((s) => s.status === "complete").length;
  const progressPct = Math.round((completedSteps / playbook.steps.length) * 100);

  return (
    <ModalWrapper onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-threat-blue/10 border border-threat-blue/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-threat-blue" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">{playbook.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-text-muted">{playbook.id}</span>
              <span className="text-text-muted">•</span>
              <span className="text-[10px] font-mono text-text-muted">Alert: {playbook.alertId}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
          <X className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[70vh] p-5 space-y-5">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary">Remediation Progress</span>
            <span className="text-xs font-mono text-threat-green">{completedSteps}/{playbook.steps.length} steps ({progressPct}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-threat-blue/60 to-threat-green"
            />
          </div>
        </div>

        {/* Root Cause */}
        <div className="p-3.5 rounded-lg bg-threat-red/5 border border-threat-red/15">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-threat-red" />
            <span className="text-[10px] font-semibold text-threat-red uppercase">Root Cause Analysis</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{playbook.rootCause}</p>
        </div>

        {/* Impact */}
        <div className="p-3.5 rounded-lg bg-threat-amber/5 border border-threat-amber/15">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-threat-amber" />
            <span className="text-[10px] font-semibold text-threat-amber uppercase">Impact Assessment</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{playbook.impact}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {playbook.affectedAssets.map((asset) => (
              <span key={asset} className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-text-muted">
                {asset}
              </span>
            ))}
          </div>
        </div>

        {/* NIST Alignment */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <span className="text-[10px] text-text-muted">NIST CSF:</span>
          <span className="text-[10px] font-mono text-threat-cyan">{playbook.nistAlignment}</span>
        </div>

        {/* Steps */}
        <div className="space-y-0">
          <h4 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">
            Response Steps
          </h4>
          {playbook.steps.map((step, i) => {
            const stepStatus = stepStatusConfig[step.status];
            const nist = nistColors[step.nistFunction];

            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative pl-8 pb-4 ${i < playbook.steps.length - 1 ? "border-l border-white/[0.06] ml-2" : "ml-2"}`}
              >
                {/* Status dot */}
                <div
                  className="absolute left-[-9px] top-0.5"
                  style={{ color: stepStatus.color }}
                >
                  {stepStatus.icon}
                </div>

                <div
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    step.status === "in-progress"
                      ? "bg-threat-amber/5 border border-threat-amber/15"
                      : step.status === "complete"
                      ? "bg-threat-green/3 border border-threat-green/10"
                      : "bg-white/[0.01] border border-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary">{step.action}</span>
                      {step.automated && (
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-threat-cyan/10 text-threat-cyan border border-threat-cyan/20">
                          AUTO
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: nist.bg, color: nist.color, border: `1px solid ${nist.color}25` }}
                    >
                      {nist.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">{step.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Estimated time */}
        <div className="flex items-center gap-2 text-text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[11px]">Estimated total time: <span className="font-mono text-text-secondary">{playbook.estimatedTime}</span></span>
        </div>
      </div>
    </ModalWrapper>
  );
}

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-2xl !border-white/[0.1]"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
