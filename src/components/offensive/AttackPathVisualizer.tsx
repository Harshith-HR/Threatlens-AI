"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  GitBranch,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle2,
  AlertCircle,
  Circle,
} from "lucide-react";

import type { GeneratedAttackPath } from "@/lib/scan-engine";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "#10b981", label: "COMPROMISED" },
  active: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: "#f59e0b", label: "ACTIVE VECTOR" },
  pending: { icon: <Circle className="w-3.5 h-3.5" />, color: "#64748b", label: "POTENTIAL NEXT STEP" },
};

interface AttackPathVisualizerProps {
  isVisible: boolean;
  data?: GeneratedAttackPath[];
}

export default function AttackPathVisualizer({ isVisible, data: apiData }: AttackPathVisualizerProps) {
  const [expandedPath, setExpandedPath] = useState<string>("path-a");

  const paths: GeneratedAttackPath[] = apiData || [];

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-threat-purple/10 border border-threat-purple/20 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-threat-purple" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Attack Path Analysis</h3>
            <p className="text-[10px] text-text-muted">Evidence-guided exploit trees</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          {paths.length} paths generated
        </span>
      </div>

      <div className="p-5 space-y-3">
        {paths.map((path, pi) => (
          <AttackPathCard
            key={path.id}
            path={path}
            index={pi}
            isExpanded={expandedPath === path.id}
            onToggle={() => setExpandedPath(expandedPath === path.id ? "" : path.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function AttackPathCard({
  path,
  index,
  isExpanded,
  onToggle,
}: {
  path: GeneratedAttackPath;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const probColor =
    path.probability >= 80 ? "#ef4444" : path.probability >= 60 ? "#f59e0b" : "#3b82f6";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className={`rounded-lg border transition-all duration-200 ${
        isExpanded
          ? "bg-white/[0.03] border-white/[0.08]"
          : "bg-white/[0.01] border-white/[0.04] hover:border-white/[0.06]"
      }`}
    >
      {/* Path Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono"
            style={{
              backgroundColor: `${probColor}15`,
              color: probColor,
              border: `1px solid ${probColor}30`,
            }}
          >
            {String.fromCharCode(65 + index)}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-primary">{path.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-text-muted">
                {path.nodes.length} steps
              </span>
              <span className="text-[10px] text-text-muted">•</span>
              <span className="text-[10px] font-mono font-semibold" style={{ color: probColor }}>
                {path.probability}% success
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mini probability bar */}
          <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${path.probability}%`,
                background: `linear-gradient(90deg, ${probColor}60, ${probColor})`,
              }}
            />
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </button>

      {/* Expanded: Attack Steps */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-3.5 pb-3.5"
        >
          <div className="relative pl-6 space-y-0">
            {path.nodes.map((node, i) => (
              <AttackStepNode key={node.id} node={node} index={i} isLast={i === path.nodes.length - 1} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function AttackStepNode({
  node,
  index,
  isLast,
}: {
  node: GeneratedAttackPath["nodes"][0];
  index: number;
  isLast: boolean;
}) {
  const status = statusConfig[node.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative pb-3"
    >
      {/* Vertical line */}
      {!isLast && (
        <div
          className="absolute left-[-16px] top-5 w-px h-[calc(100%-4px)]"
          style={{
            background:
              node.status === "completed"
                ? "rgba(16,185,129,0.3)"
                : node.status === "active"
                ? "rgba(245,158,11,0.3)"
                : "rgba(71,85,105,0.2)",
          }}
        />
      )}

      {/* Node dot */}
      <div
        className="absolute left-[-20px] top-1.5 flex items-center justify-center"
        style={{ color: status.color }}
      >
        {status.icon}
      </div>

      {/* Content */}
      <div
        className={`p-2.5 rounded-lg transition-all duration-200 ${
          node.status === "active"
            ? "bg-threat-amber/5 border border-threat-amber/15"
            : "bg-white/[0.01] border border-transparent"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-primary">{node.label}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-text-muted">
              {node.technique}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono font-semibold"
              style={{ color: status.color }}
            >
              {node.probability}%
            </span>
          </div>
        </div>
        <p className="text-[10px] text-text-muted mt-1">{node.detail}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Target className="w-2.5 h-2.5 text-text-muted" />
          <span className="text-[9px] font-mono text-text-muted">{node.tactic}</span>
        </div>
      </div>
    </motion.div>
  );
}
