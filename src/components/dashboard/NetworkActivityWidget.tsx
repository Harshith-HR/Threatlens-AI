"use client";

import React, { useSyncExternalStore } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";
import DashboardCard from "@/components/ui/DashboardCard";
import { networkActivityData } from "@/lib/mock-data";

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload) return null;

  return (
    <div className="glass-card px-3 py-2 !rounded-lg !border-white/10">
      <p className="text-[11px] font-mono text-text-muted mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] text-text-secondary">
            {entry.dataKey === "threats" ? "Threats" : entry.dataKey === "inbound" ? "Inbound" : "Outbound"}:
          </span>
          <span className="text-[11px] font-mono font-semibold text-text-primary">
            {entry.value.toLocaleString()}
            {entry.dataKey !== "threats" ? " req" : ""}
          </span>
        </div>
      ))}
    </div>
  );
};

const subscribe = () => () => {};
export default function NetworkActivityWidget() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <DashboardCard
      title="Network Activity"
      subtitle="24h traffic overview"
      icon={<Activity className="w-4 h-4" />}
      colSpan={2}
      glowColor="blue"
      delay={5}
      statusBadge={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-threat-cyan" />
            <span className="text-[10px] text-text-muted">Inbound</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-threat-blue" />
            <span className="text-[10px] text-text-muted">Outbound</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-threat-red" />
            <span className="text-[10px] text-text-muted">Threats</span>
          </div>
        </div>
      }
    >
      <div className="h-52 pt-2">
        {mounted && (
          <ResponsiveContainer width="99%" height="99%">
            <AreaChart data={networkActivityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientThreats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }}
                interval={3}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#475569", fontFamily: "monospace" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="inbound"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#gradientInbound)"
                dot={false}
                activeDot={{ r: 3, fill: "#06b6d4", stroke: "#0f172a", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="outbound"
                stroke="#3b82f6"
                strokeWidth={1.5}
                fill="url(#gradientOutbound)"
                dot={false}
                activeDot={{ r: 3, fill: "#3b82f6", stroke: "#0f172a", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="threats"
                stroke="#ef4444"
                strokeWidth={1.5}
                fill="url(#gradientThreats)"
                dot={false}
                activeDot={{ r: 3, fill: "#ef4444", stroke: "#0f172a", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  );
}
