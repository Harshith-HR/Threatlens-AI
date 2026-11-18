"use client";

import React from "react";
import { Bot, Zap, Shield, Eye } from "lucide-react";
import DashboardCard from "@/components/ui/DashboardCard";
import { agentClusters, type AgentStatus } from "@/lib/mock-data";

export default function AgentStatusWidget() {
  const statusConfig: Record<AgentStatus, { color: string; bg: string; label: string }> = {
    online: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "ONLINE" },
    idle: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", label: "IDLE" },
    alert: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "ALERT" },
    offline: { color: "#475569", bg: "rgba(71,85,105,0.1)", label: "OFFLINE" },
  };

  const clusterIcons: Record<string, React.ReactNode> = {
    OSC: <Zap className="w-4 h-4" />,
    DRC: <Shield className="w-4 h-4" />,
    GAC: <Eye className="w-4 h-4" />,
  };

  return (
    <DashboardCard
      title="Agent Clusters"
      subtitle="Multi-agent orchestration"
      icon={<Bot className="w-4 h-4" />}
      glowColor="purple"
      delay={3}
    >
      <div className="space-y-2.5 pt-1">
        {agentClusters.map((cluster) => {
          const status = statusConfig[cluster.status];

          return (
            <div
              key={cluster.shortName}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.06] transition-all duration-200"
            >
              {/* Cluster icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                {clusterIcons[cluster.shortName]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    {cluster.shortName}
                  </span>
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: status.bg,
                      color: status.color,
                      border: `1px solid ${status.color}30`,
                    }}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-text-muted truncate">
                    {cluster.activeAgents}/{cluster.totalAgents} agents
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    {cluster.lastActivity}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
