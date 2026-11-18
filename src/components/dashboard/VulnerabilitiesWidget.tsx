"use client";

import React from "react";
import { motion } from "motion/react";
import { Bug, TrendingDown } from "lucide-react";
import DashboardCard from "@/components/ui/DashboardCard";
import { vulnerabilitySummary } from "@/lib/mock-data";

export default function VulnerabilitiesWidget() {
  const data = vulnerabilitySummary;

  const severities = [
    { label: "Critical", count: data.critical, color: "#ef4444", bgClass: "badge-critical" },
    { label: "High", count: data.high, color: "#f59e0b", bgClass: "badge-high" },
    { label: "Medium", count: data.medium, color: "#3b82f6", bgClass: "badge-medium" },
    { label: "Low", count: data.low, color: "#10b981", bgClass: "badge-low" },
  ];

  return (
    <DashboardCard
      title="Vulnerabilities"
      subtitle={`Last scan: ${data.lastScanTime}`}
      icon={<Bug className="w-4 h-4" />}
      glowColor="red"
      delay={2}
      statusBadge={
        <div className="flex items-center gap-1 text-threat-green">
          <TrendingDown className="w-3 h-3" />
          <span className="text-[10px] font-mono font-semibold">{data.trendVsPrevious}%</span>
        </div>
      }
    >
      <div className="pt-1">
        {/* Total count */}
        <div className="text-center mb-3">
          <span className="text-4xl font-bold font-mono text-text-primary">{data.total}</span>
          <p className="text-[10px] text-text-muted mt-0.5">Total findings</p>
        </div>

        {/* Severity breakdown bars */}
        <div className="space-y-2">
          {severities.map((sev, i) => (
            <div key={sev.label} className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-text-muted w-12 text-right">
                {sev.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(sev.count / data.total) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${sev.color}50, ${sev.color})`,
                  }}
                />
              </div>
              <span className="text-xs font-mono font-semibold w-6 text-right" style={{ color: sev.color }}>
                {sev.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
