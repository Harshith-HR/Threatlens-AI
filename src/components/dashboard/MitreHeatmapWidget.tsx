"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Grid3X3 } from "lucide-react";
import DashboardCard from "@/components/ui/DashboardCard";
import { mitreData } from "@/lib/mock-data";

export default function MitreHeatmapWidget() {
  const [hoveredTechnique, setHoveredTechnique] = useState<{
    tactic: string;
    technique: string;
    coverage: number;
    detected: number;
    total: number;
  } | null>(null);

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 80) return { bg: "rgba(16,185,129,0.6)", border: "rgba(16,185,129,0.3)" };
    if (coverage >= 60) return { bg: "rgba(16,185,129,0.35)", border: "rgba(16,185,129,0.2)" };
    if (coverage >= 40) return { bg: "rgba(245,158,11,0.35)", border: "rgba(245,158,11,0.2)" };
    if (coverage >= 20) return { bg: "rgba(239,68,68,0.35)", border: "rgba(239,68,68,0.2)" };
    return { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.1)" };
  };

  const overallCoverage = Math.round(
    mitreData.reduce((acc, t) => {
      const tacticAvg =
        t.techniques.reduce((sum, tech) => sum + tech.coverage, 0) / t.techniques.length;
      return acc + tacticAvg;
    }, 0) / mitreData.length
  );

  return (
    <DashboardCard
      title="MITRE ATT&CK Coverage"
      subtitle={`${overallCoverage}% overall detection coverage`}
      icon={<Grid3X3 className="w-4 h-4" />}
      colSpan={2}
      rowSpan={2}
      glowColor="green"
      delay={6}
      statusBadge={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "rgba(16,185,129,0.6)" }} />
            <span className="text-[9px] text-text-muted">80%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "rgba(245,158,11,0.35)" }} />
            <span className="text-[9px] text-text-muted">40-60%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "rgba(239,68,68,0.3)" }} />
            <span className="text-[9px] text-text-muted">&lt;40%</span>
          </div>
        </div>
      }
    >
      <div className="pt-2">
        {/* Heatmap Grid */}
        <div className="space-y-1.5">
          {mitreData.map((tactic, ti) => (
            <div key={tactic.id} className="flex items-stretch gap-1.5">
              {/* Tactic label */}
              <div className="w-20 flex-shrink-0 flex items-center">
                <span className="text-[10px] font-mono text-text-muted truncate" title={tactic.name}>
                  {tactic.shortName}
                </span>
              </div>

              {/* Technique cells */}
              <div className="flex-1 flex gap-1">
                {tactic.techniques.map((tech, i) => {
                  const colors = getCoverageColor(tech.coverage);
                  return (
                    <motion.div
                      key={tech.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + ti * 0.05 + i * 0.03, duration: 0.3 }}
                      className="flex-1 h-8 rounded cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10 relative"
                      style={{
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.border}`,
                      }}
                      onMouseEnter={() =>
                        setHoveredTechnique({
                          tactic: tactic.name,
                          technique: tech.name,
                          coverage: tech.coverage,
                          detected: tech.detected,
                          total: tech.total,
                        })
                      }
                      onMouseLeave={() => setHoveredTechnique(null)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-mono font-semibold text-white/70">
                          {tech.coverage}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tooltip / Detail Panel */}
        <div className="mt-4 h-14">
          {hoveredTechnique ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-text-primary">
                    {hoveredTechnique.technique}
                  </span>
                  <span className="text-[10px] text-text-muted ml-2">
                    ({hoveredTechnique.tactic})
                  </span>
                </div>
                <span
                  className="text-sm font-mono font-bold"
                  style={{
                    color:
                      hoveredTechnique.coverage >= 70
                        ? "#10b981"
                        : hoveredTechnique.coverage >= 40
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                >
                  {hoveredTechnique.coverage}%
                </span>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                {hoveredTechnique.detected}/{hoveredTechnique.total} techniques detected
              </p>
            </motion.div>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-white/[0.01] border border-white/[0.02] flex items-center justify-center">
              <span className="text-[11px] text-text-muted">
                Hover over a cell to view technique details
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
