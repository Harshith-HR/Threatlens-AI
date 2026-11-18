"use client";

import React from "react";
import { motion } from "motion/react";
import { Radar, Clock } from "lucide-react";
import DashboardCard from "@/components/ui/DashboardCard";
import { activeScans } from "@/lib/mock-data";

export default function ActiveScansWidget() {
  const runningScans = activeScans.filter((s) => s.status === "running");
  const queuedScans = activeScans.filter((s) => s.status === "queued");

  const scanTypeLabels: Record<string, { label: string; color: string }> = {
    recon: { label: "RECON", color: "#f59e0b" },
    vuln: { label: "VULN SCAN", color: "#ef4444" },
    exploit: { label: "EXPLOIT", color: "#ef4444" },
    compliance: { label: "COMPLIANCE", color: "#3b82f6" },
  };

  return (
    <DashboardCard
      title="Active Scans"
      subtitle={`${runningScans.length} running • ${queuedScans.length} queued`}
      icon={<Radar className="w-4 h-4" />}
      glowColor="amber"
      delay={1}
      statusBadge={
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-threat-amber/10 border border-threat-amber/20">
          <div className="w-1.5 h-1.5 rounded-full bg-threat-amber animate-pulse" />
          <span className="text-[10px] font-mono font-semibold text-threat-amber">
            {runningScans.length} LIVE
          </span>
        </div>
      }
    >
      <div className="space-y-3 pt-1">
        {activeScans.map((scan, i) => {
          const typeInfo = scanTypeLabels[scan.type];
          const isRunning = scan.status === "running";

          return (
            <div key={scan.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${typeInfo.color}15`,
                      color: typeInfo.color,
                      border: `1px solid ${typeInfo.color}30`,
                    }}
                  >
                    {typeInfo.label}
                  </span>
                  <span className="text-xs font-mono text-text-secondary">
                    {scan.target}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isRunning && <Clock className="w-3 h-3 text-text-muted" />}
                  <span className="text-[10px] font-mono text-text-muted">
                    {isRunning ? `${scan.progress}%` : scan.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                {isRunning ? (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${scan.progress}%` }}
                    transition={{ delay: 0.3 + i * 0.2, duration: 1 }}
                    className="h-full rounded-full relative"
                    style={{
                      background: `linear-gradient(90deg, ${typeInfo.color}60, ${typeInfo.color})`,
                    }}
                  >
                    <div
                      className="absolute right-0 top-0 w-2 h-full rounded-full animate-pulse"
                      style={{ backgroundColor: typeInfo.color }}
                    />
                  </motion.div>
                ) : (
                  <div className="h-full w-full bg-white/[0.02]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
