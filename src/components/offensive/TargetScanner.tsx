"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Crosshair,
  Zap,
  ScanLine,
  Bug,
  Eye,
  Play,
  Loader2,
  Globe,
  Server,
  CheckCircle,
} from "lucide-react";
import { scanProfiles, type ScanProfile } from "@/lib/offensive-data";

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5" />,
  ScanLine: <ScanLine className="w-5 h-5" />,
  Bug: <Bug className="w-5 h-5" />,
  Eye: <Eye className="w-5 h-5" />,
};

const intensityColors: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "LOW" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "MED" },
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "HIGH" },
  stealth: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", label: "LOW" },
};

interface TargetScannerProps {
  onScanStart: (target: string, profile: ScanProfile) => void;
  isScanning: boolean;
  scanComplete: boolean;
}

export default function TargetScanner({ onScanStart, isScanning, scanComplete }: TargetScannerProps) {
  const [target, setTarget] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<string>("vuln");
  const [isValidTarget, setIsValidTarget] = useState(true);
  useEffect(() => { fetch("/api/settings").then(r => r.json()).then(data => { if (data.settings?.defaultProfile) setSelectedProfile(data.settings.defaultProfile); }).catch(() => {}); }, []);

  const validateTarget = (value: string) => {
    let isValid = value === "";
    try { const url = new URL(value.includes("://") ? value : `https://${value}`); isValid = ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password && !/[\s\\]/.test(value); } catch { /* Show inline validation. */ }
    setIsValidTarget(isValid);
    setTarget(value);
  };

  const handleLaunch = () => {
    if (!target || !isValidTarget || isScanning) return;
    const profile = scanProfiles.find((p) => p.id === selectedProfile);
    if (profile) onScanStart(target, profile);
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-threat-amber/10 border border-threat-amber/20 flex items-center justify-center">
            <Crosshair className="w-4 h-4 text-threat-amber" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Target Scanner</h3>
            <p className="text-[10px] text-text-muted">OSC Reconnaissance Module</p>
          </div>
        </div>
        {scanComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-threat-green/10 border border-threat-green/20"
          >
            <CheckCircle className="w-3 h-3 text-threat-green" />
            <span className="text-[10px] font-mono font-semibold text-threat-green">SCAN COMPLETE</span>
          </motion.div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Target Input */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Website URL / hostname
          </label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={target}
              onChange={(e) => validateTarget(e.target.value)}
              aria-label="Target website URL"
              placeholder="https://your-website.com"
              disabled={isScanning}
              className={`
                w-full pl-10 pr-4 py-3 rounded-lg bg-bg-primary/80 border text-sm font-mono
                text-text-primary placeholder:text-text-muted
                focus:outline-none focus:ring-1 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isValidTarget
                  ? "border-border-default focus:border-threat-green/30 focus:ring-threat-green/20"
                  : "border-threat-red/40 focus:border-threat-red/60 focus:ring-threat-red/20"
                }
              `}
            />
            {target && isValidTarget && (
              <Server className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-threat-green" />
            )}
          </div>
          {!isValidTarget && (
            <p className="text-[10px] text-threat-red font-mono">
              Enter an HTTP(S) URL or a single hostname.
            </p>
          )}
        </div>

        {/* Scan Profile Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Scan Profile
          </label>
          <div className="grid grid-cols-2 gap-2">
            {scanProfiles.map((profile) => {
              const isSelected = selectedProfile === profile.id;
              const intensity = intensityColors[profile.intensity];

              return (
                <button
                  key={profile.id}
                  onClick={() => !isScanning && setSelectedProfile(profile.id)}
                  disabled={isScanning}
                  className={`
                    relative p-3 rounded-lg border text-left transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isSelected
                      ? "bg-threat-green/5 border-threat-green/25 shadow-[0_0_12px_rgba(16,185,129,0.08)]"
                      : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.03]"
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className={`${isSelected ? "text-threat-green" : "text-text-muted"} transition-colors`}>
                      {iconMap[profile.icon]}
                    </div>
                    <span
                      className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: intensity.bg,
                        color: intensity.color,
                        border: `1px solid ${intensity.color}30`,
                      }}
                    >
                      {intensity.label}
                    </span>
                  </div>
                  <h4 className={`text-xs font-semibold mb-0.5 ${isSelected ? "text-threat-green" : "text-text-primary"}`}>
                    {profile.name}
                  </h4>
                  <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed">
                    {profile.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[9px] font-mono text-text-muted">ETA: {profile.estimatedDuration}</span>
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="selectedProfile"
                      className="absolute inset-0 rounded-lg border-2 border-threat-green/30 pointer-events-none"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Technique Tags */}
        <AnimatePresence mode="wait">
          {selectedProfile && (
            <motion.div
              key={selectedProfile}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-wrap gap-1.5"
            >
              {scanProfiles
                .find((p) => p.id === selectedProfile)
                ?.techniques.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded text-[9px] font-mono bg-white/[0.03] border border-white/[0.06] text-text-secondary"
                  >
                    {tech}
                  </span>
                ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Launch Button */}
        <button
          onClick={handleLaunch}
          disabled={!target || !isValidTarget || isScanning}
          className={`
            w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2
            transition-all duration-300 disabled:cursor-not-allowed
            ${isScanning
              ? "bg-threat-amber/20 border border-threat-amber/30 text-threat-amber cursor-wait"
              : scanComplete
              ? "bg-threat-green/20 border border-threat-green/30 text-threat-green hover:bg-threat-green/25"
              : "bg-threat-green/10 border border-threat-green/25 text-threat-green hover:bg-threat-green/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            }
          `}
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning Target...</span>
            </>
          ) : scanComplete ? (
            <>
              <Play className="w-4 h-4" />
              <span>Re-Scan Target</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Launch Scan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
