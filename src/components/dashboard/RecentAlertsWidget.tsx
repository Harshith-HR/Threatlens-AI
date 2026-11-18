"use client";

import React from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Search,
  MonitorDot,
} from "lucide-react";
import DashboardCard from "@/components/ui/DashboardCard";
import { recentAlerts, type ThreatSeverity } from "@/lib/mock-data";

export default function RecentAlertsWidget() {
  const severityConfig: Record<
    ThreatSeverity,
    { icon: React.ReactNode; color: string; bg: string }
  > = {
    critical: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
    },
    high: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    },
    medium: {
      icon: <Info className="w-3.5 h-3.5" />,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
    },
    low: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
    },
    info: {
      icon: <Info className="w-3.5 h-3.5" />,
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.1)",
    },
  };

  const statusIcons: Record<string, React.ReactNode> = {
    active: <MonitorDot className="w-3 h-3 text-threat-red" />,
    investigating: <Search className="w-3 h-3 text-threat-amber" />,
    resolved: <CheckCircle className="w-3 h-3 text-threat-green" />,
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <DashboardCard
      title="Recent Alerts"
      subtitle={`${recentAlerts.filter((a) => a.status === "active").length} active threats`}
      icon={<AlertCircle className="w-4 h-4" />}
      colSpan={2}
      glowColor="red"
      delay={4}
      statusBadge={
        <span className="text-[10px] font-mono text-text-muted">
          {recentAlerts.length} alerts
        </span>
      }
    >
      <div className="space-y-1 pt-1 max-h-[280px] overflow-y-auto">
        {recentAlerts.map((alert, i) => {
          const sev = severityConfig[alert.severity];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer group"
            >
              {/* Severity icon */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: sev.bg, color: sev.color }}
              >
                {sev.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-text-primary group-hover:text-white transition-colors truncate">
                    {alert.title}
                  </span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                    style={{
                      backgroundColor: sev.bg,
                      color: sev.color,
                      border: `1px solid ${sev.color}25`,
                    }}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted line-clamp-1">
                  {alert.description}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-mono text-text-muted">
                    {alert.sourceIp}
                  </span>
                  {alert.mitreTactic && (
                    <span className="text-[9px] font-mono text-threat-purple/70">
                      {alert.mitreTactic}
                    </span>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    {statusIcons[alert.status]}
                    <Clock className="w-2.5 h-2.5 text-text-muted" />
                    <span className="text-[10px] font-mono text-text-muted">
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
