"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Grid3X3, ExternalLink, X } from "lucide-react";

import type { GeneratedMitreFinding } from "@/lib/scan-engine";

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const severityColors: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  high: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  medium: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
};

interface MitreAttackPanelProps {
  isVisible: boolean;
  data?: GeneratedMitreFinding[];
}

export default function MitreAttackPanel({ isVisible, data: apiData }: MitreAttackPanelProps) {
  const [selectedFinding, setSelectedFinding] = useState<GeneratedMitreFinding | null>(null);

  if (!isVisible || !apiData) return null;

  const findings: GeneratedMitreFinding[] = apiData;

  const sorted = [...findings].sort(
    (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );

  // Group by tactic
  const tactics = Array.from(new Set(sorted.map((f) => f.tactic)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-threat-cyan/10 border border-threat-cyan/20 flex items-center justify-center">
            <Grid3X3 className="w-4 h-4 text-threat-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">MITRE ATT&CK Mapping</h3>
            <p className="text-[10px] text-text-muted">{findings.length} techniques identified from scan</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Tactic Flow */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
          {tactics.map((tactic, i) => {
            const finding = sorted.find((f) => f.tactic === tactic);
            return (
              <React.Fragment key={tactic}>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                  style={{
                    backgroundColor: `${finding?.tacticColor}10`,
                    border: `1px solid ${finding?.tacticColor}25`,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: finding?.tacticColor }}
                  />
                  <span
                    className="text-[10px] font-mono font-semibold"
                    style={{ color: finding?.tacticColor }}
                  >
                    {tactic}
                  </span>
                </div>
                {i < tactics.length - 1 && (
                  <div className="text-text-muted text-xs">→</div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Technique Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {sorted.map((finding, i) => {
            const sev = severityColors[finding.severity];

            return (
              <motion.button
                key={`${finding.techniqueId}-${finding.relatedPort}-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                onClick={() => setSelectedFinding(finding)}
                className="text-left p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.03] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <span className="text-[9px] font-mono text-text-muted">{finding.techniqueId}</span>
                </div>
                <h4 className="text-[11px] font-semibold text-text-primary mb-1 group-hover:text-white transition-colors">
                  {finding.techniqueName}
                </h4>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-mono"
                    style={{ color: finding.tacticColor }}
                  >
                    {finding.tactic}
                  </span>
                  <span className="text-[9px] text-text-muted">•</span>
                  <span className="text-[9px] font-mono text-text-muted">
                    Port {finding.relatedPort}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFinding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFinding(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-lg !border-white/[0.1]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-threat-cyan">{selectedFinding.techniqueId}</span>
                  <span className="text-xs text-text-primary font-semibold">{selectedFinding.techniqueName}</span>
                </div>
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="p-1 rounded hover:bg-white/[0.05] transition-colors"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: severityColors[selectedFinding.severity].bg,
                      color: severityColors[selectedFinding.severity].color,
                      border: `1px solid ${severityColors[selectedFinding.severity].border}`,
                    }}
                  >
                    {selectedFinding.severity.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: selectedFinding.tacticColor }}>
                    {selectedFinding.tactic}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted">
                    {selectedFinding.relatedService}:{selectedFinding.relatedPort}
                  </span>
                </div>

                <div>
                  <h5 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Description
                  </h5>
                  <p className="text-xs text-text-primary leading-relaxed">
                    {selectedFinding.description}
                  </p>
                </div>

                <div>
                  <h5 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Detection & Mitigation
                  </h5>
                  <p className="text-xs text-text-primary leading-relaxed">
                    {selectedFinding.detection}
                  </p>
                </div>

                <a
                  href={`https://attack.mitre.org/techniques/${selectedFinding.techniqueId.replace(".", "/")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-threat-cyan hover:underline"
                >
                  View on MITRE ATT&CK <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
