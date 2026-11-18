"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Terminal, Circle, Minus, X, ChevronRight } from "lucide-react";

const phaseLabels: Record<string, { label: string; color: string }> = {
  init: { label: "INITIALIZING", color: "#94a3b8" },
  recon: { label: "RECONNAISSANCE", color: "#f59e0b" },
  tda: { label: "EVIDENCE ANALYSIS", color: "#3b82f6" },
  exploit: { label: "REMEDIATION", color: "#ef4444" },
  complete: { label: "COMPLETE", color: "#10b981" },
};

const typeStyles: Record<string, string> = {
  system: "text-blue-400",
  thought: "text-purple-400 italic",
  command: "text-threat-green font-semibold",
  result: "text-slate-300",
  warning: "text-amber-400",
  success: "text-emerald-400 font-semibold",
  error: "text-red-400",
  separator: "",
};

interface TerminalMsg {
  id: number;
  phase: string;
  type: string;
  content: string;
}

interface AgentTerminalProps {
  messages: TerminalMsg[];
  isActive: boolean;
  onPhaseChange?: (phase: string) => void;
  scanComplete?: boolean;
}

export default function AgentTerminal({ messages, isActive, scanComplete }: AgentTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine current phase from last message
  const currentPhase = messages.length > 0 ? messages[messages.length - 1].phase : "init";
  const isComplete = scanComplete || false;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const phaseInfo = phaseLabels[currentPhase] || phaseLabels.init;

  // Phase progress
  const phases = ["init", "recon", "tda", "exploit", "complete"];
  const phaseIndex = phases.indexOf(currentPhase);

  return (
    <div className="glass-card overflow-hidden flex flex-col h-full">
      {/* Terminal Chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0c0c14] border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          {/* Window controls */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-threat-red/60 flex items-center justify-center group cursor-pointer hover:bg-threat-red">
              <X className="w-1.5 h-1.5 text-threat-red/0 group-hover:text-black" />
            </div>
            <div className="w-3 h-3 rounded-full bg-threat-amber/60 flex items-center justify-center group cursor-pointer hover:bg-threat-amber">
              <Minus className="w-1.5 h-1.5 text-threat-amber/0 group-hover:text-black" />
            </div>
            <div className="w-3 h-3 rounded-full bg-threat-green/60 flex items-center justify-center group cursor-pointer hover:bg-threat-green">
              <Circle className="w-1.5 h-1.5 text-threat-green/0 group-hover:text-black" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-3">
            <Terminal className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[11px] font-mono text-text-muted">
              scanner@threatlens
            </span>
          </div>
        </div>

        {/* Phase indicator */}
        <div className="flex items-center gap-2">
          {isActive && !isComplete && (
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: phaseInfo.color }} />
          )}
          <span
            className="text-[9px] font-mono font-bold tracking-wider"
            style={{ color: phaseInfo.color }}
          >
            {messages.length > 0 ? phaseInfo.label : "STANDBY"}
          </span>
        </div>
      </div>

      {/* Phase Progress Bar */}
      {messages.length > 0 && (
        <div className="flex items-center gap-0 px-4 py-1.5 bg-[#0a0a12] border-b border-white/[0.03]">
          {phases.slice(1, -1).map((phase, i) => {
            const isCompleted = phaseIndex > i + 1;
            const isCurrent = currentPhase === phase;
            const phInfo = phaseLabels[phase];

            return (
              <React.Fragment key={phase}>
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      isCompleted ? "scale-100" : isCurrent ? "animate-pulse scale-110" : "scale-75 opacity-30"
                    }`}
                    style={{
                      backgroundColor: isCompleted || isCurrent ? phInfo.color : "#475569",
                      boxShadow: isCurrent ? `0 0 6px ${phInfo.color}80` : "none",
                    }}
                  />
                  <span
                    className={`text-[8px] font-mono tracking-wider transition-colors duration-300 ${
                      isCompleted || isCurrent ? "opacity-100" : "opacity-30"
                    }`}
                    style={{ color: isCompleted || isCurrent ? phInfo.color : "#475569" }}
                  >
                    {phInfo.label}
                  </span>
                </div>
                {i < 2 && (
                  <ChevronRight
                    className={`w-3 h-3 mx-1.5 transition-opacity ${
                      phaseIndex > i + 1 ? "text-text-muted opacity-60" : "text-text-muted opacity-20"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[11.5px] leading-relaxed bg-[#0a0a12] min-h-[300px] max-h-[520px]"
      >
        {messages.length === 0 && !isActive && (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <Terminal className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-xs">Awaiting scan initiation...</p>
            <p className="text-[10px] mt-1 opacity-50">Configure target and launch scan to begin</p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === "separator") {
            return <div key={msg.id} className="h-2" />;
          }

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={`${typeStyles[msg.type] || "text-slate-300"} py-0.5 whitespace-pre-wrap break-all`}
            >
              {msg.type === "command" && (
                <span className="text-text-muted mr-1">❯</span>
              )}
              {msg.content}
            </motion.div>
          );
        })}

        {/* Blinking cursor */}
        {isActive && !isComplete && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-text-muted">❯</span>
            <div className="w-2 h-4 bg-threat-green/70 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
