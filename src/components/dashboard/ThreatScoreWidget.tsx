"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import DashboardCard from "@/components/ui/DashboardCard";
import { threatScore } from "@/lib/mock-data";

export default function ThreatScoreWidget() {
  const [animatedScore, setAnimatedScore] = useState(0);
  const score = threatScore.current;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timeout = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        if (current >= score) {
          clearInterval(interval);
          setAnimatedScore(score);
        } else {
          setAnimatedScore(current);
        }
      }, 15);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timeout);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return { color: "#ef4444", label: "Critical" };
    if (s >= 60) return { color: "#f59e0b", label: "Elevated" };
    if (s >= 40) return { color: "#3b82f6", label: "Moderate" };
    return { color: "#10b981", label: "Low" };
  };

  const scoreInfo = getScoreColor(score);
  const trendUp = threatScore.trend === "up";

  return (
    <DashboardCard
      title="Threat Score"
      subtitle="Global risk assessment"
      icon={<AlertTriangle className="w-4 h-4" />}
      glowColor={score >= 80 ? "red" : score >= 60 ? "amber" : "green"}
      delay={0}
    >
      <div className="flex flex-col items-center pt-2">
        {/* Circular Gauge */}
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
            />
            {/* Score arc */}
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={scoreInfo.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: `drop-shadow(0 0 6px ${scoreInfo.color}60)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-text-primary font-mono">
              {animatedScore}
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: scoreInfo.color }}
            >
              {scoreInfo.label}
            </span>
          </div>
        </div>

        {/* Trend indicator */}
        <div className="flex items-center gap-1.5 mt-3">
          {trendUp ? (
            <TrendingUp className="w-3.5 h-3.5 text-threat-red" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-threat-green" />
          )}
          <span className={`text-xs font-mono ${trendUp ? "text-threat-red" : "text-threat-green"}`}>
            {trendUp ? "+" : "-"}{Math.abs(score - threatScore.previousScore)} from prev
          </span>
        </div>

        {/* Top factors */}
        <div className="w-full mt-4 space-y-1.5">
          {threatScore.factors.slice(0, 3).map((factor) => (
            <div key={factor.name} className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted truncate">{factor.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${factor.impact * 4}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${scoreInfo.color}60, ${scoreInfo.color})`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-text-muted w-4 text-right">
                  {factor.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
