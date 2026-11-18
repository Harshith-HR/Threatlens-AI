"use client";

import React, { useSyncExternalStore } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { severityDistribution } from "@/lib/defensive-data";
import DashboardCard from "@/components/ui/DashboardCard";
import { PieChart as PieIcon } from "lucide-react";

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0];
  return (
    <div className="glass-card px-3 py-2 !rounded-lg !border-white/10">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.payload.color }} />
        <span className="text-[11px] text-text-primary font-semibold">{d.name}</span>
        <span className="text-[11px] font-mono text-text-secondary">{d.value}</span>
      </div>
    </div>
  );
};

const subscribe = () => () => {};
export default function SeverityChart() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const total = severityDistribution.reduce((sum, d) => sum + d.value, 0);

  return (
    <DashboardCard
      title="Severity Distribution"
      subtitle="Alerts by severity (24h)"
      icon={<PieIcon className="w-4 h-4" />}
      glowColor="amber"
      delay={2}
    >
      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          {mounted && (
            <ResponsiveContainer width="99%" height="99%">
              <PieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {severityDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="space-y-1.5">
          {severityDistribution.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[10px] text-text-muted w-14">{d.name}</span>
              <span className="text-[11px] font-mono font-semibold text-text-primary">{d.value}</span>
              <span className="text-[9px] text-text-muted">({Math.round((d.value / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
