"use client";

import React from "react";
import { motion } from "motion/react";

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  statusBadge?: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
  children: React.ReactNode;
  delay?: number;
  glowColor?: "green" | "amber" | "red" | "blue" | "purple";
  noPadding?: boolean;
}

export default function DashboardCard({
  title,
  subtitle,
  icon,
  statusBadge,
  className = "",
  colSpan = 1,
  rowSpan = 1,
  children,
  delay = 0,
  glowColor,
  noPadding = false,
}: DashboardCardProps) {
  const glowClasses: Record<string, string> = {
    green: "hover:border-threat-green/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]",
    amber: "hover:border-threat-amber/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]",
    red: "hover:border-threat-red/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.08)]",
    blue: "hover:border-threat-blue/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]",
    purple: "hover:border-threat-purple/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)]",
  };

  const spanClass = `col-span-1 ${
    colSpan === 2 ? "md:col-span-2" : ""
  } ${colSpan === 3 ? "md:col-span-3" : ""} ${colSpan === 4 ? "md:col-span-4" : ""} ${
    rowSpan === 2 ? "row-span-2" : ""
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }}
      className={`
        ${spanClass}
        glass-card group
        transition-all duration-300 ease-out
        ${glowColor ? glowClasses[glowColor] : "hover:border-white/[0.08]"}
        ${className}
      `}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="text-text-muted group-hover:text-text-secondary transition-colors duration-200">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {statusBadge && <div>{statusBadge}</div>}
      </div>

      {/* Card Body */}
      <div className={noPadding ? "" : "px-5 pb-4"}>{children}</div>
    </motion.div>
  );
}
