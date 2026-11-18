"use client";

import React from "react";
import { motion } from "motion/react";
import { Activity, AlertTriangle, Clock, Zap, Shield, BarChart3 } from "lucide-react";
import { siemStats } from "@/lib/defensive-data";

export default function SiemStatsBar() {
  const stats = [
    {
      label: "Events/sec",
      value: siemStats.eventsPerSecond.toLocaleString(),
      icon: <Zap className="w-4 h-4" />,
      color: "#06b6d4",
      pulse: true,
    },
    {
      label: "Active Alerts",
      value: siemStats.activeAlerts.toString(),
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "#ef4444",
      pulse: siemStats.activeAlerts > 0,
    },
    {
      label: "Mean Response",
      value: siemStats.meanResponseTime,
      icon: <Clock className="w-4 h-4" />,
      color: "#f59e0b",
    },
    {
      label: "Alerts (24h)",
      value: siemStats.alertsLast24h.toString(),
      icon: <Activity className="w-4 h-4" />,
      color: "#3b82f6",
    },
    {
      label: "False Positive %",
      value: `${siemStats.falsePositiveRate}%`,
      icon: <Shield className="w-4 h-4" />,
      color: "#10b981",
    },
    {
      label: "Auto Responses",
      value: siemStats.automatedResponses.toString(),
      icon: <BarChart3 className="w-4 h-4" />,
      color: "#8b5cf6",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          className="glass-card px-4 py-3 flex items-center gap-3 group hover:border-white/[0.08] transition-all duration-200"
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${stat.color}12`, color: stat.color }}
          >
            {stat.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold font-mono text-text-primary">{stat.value}</span>
              {stat.pulse && (
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: stat.color }} />
              )}
            </div>
            <span className="text-[10px] text-text-muted">{stat.label}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
