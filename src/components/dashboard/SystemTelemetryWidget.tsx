"use client";

import React from "react";
import { Cpu } from "lucide-react";
import DashboardCard from "@/components/ui/DashboardCard";
import { systemTelemetry } from "@/lib/mock-data";

function MiniSparkline({ data, color, status }: { data: number[]; color: string; status: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const padding = 2;

  const points = data
    .map((value, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${status}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#spark-fill-${status})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Latest point dot */}
      {data.length > 0 && (
        <circle
          cx={width - padding}
          cy={
            height -
            padding -
            ((data[data.length - 1] - min) / range) * (height - padding * 2)
          }
          r={2}
          fill={color}
          style={{ filter: `drop-shadow(0 0 3px ${color})` }}
        />
      )}
    </svg>
  );
}

export default function SystemTelemetryWidget() {
  const statusColors: Record<string, string> = {
    normal: "#10b981",
    warning: "#f59e0b",
    critical: "#ef4444",
  };

  return (
    <DashboardCard
      title="System Telemetry"
      subtitle="Infrastructure health"
      icon={<Cpu className="w-4 h-4" />}
      glowColor="green"
      delay={7}
    >
      <div className="space-y-3 pt-1">
        {systemTelemetry.map((metric) => {
          const color = statusColors[metric.status];

          return (
            <div key={metric.name} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-text-muted">{metric.name}</span>
                  <span className="text-xs font-mono font-semibold" style={{ color }}>
                    {metric.value}
                    <span className="text-text-muted text-[10px] ml-0.5">{metric.unit}</span>
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${metric.unit === "%" ? metric.value : Math.min(metric.value / 3, 100)}%`,
                      background: `linear-gradient(90deg, ${color}50, ${color})`,
                    }}
                  />
                </div>
              </div>

              <MiniSparkline
                data={metric.trend}
                color={color}
                status={metric.status}
              />
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
