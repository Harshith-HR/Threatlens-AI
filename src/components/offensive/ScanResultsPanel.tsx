"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";

import type { GeneratedScanResult, GeneratedPort } from "@/lib/scan-engine";

const riskConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  critical: { icon: <AlertCircle className="w-3 h-3" />, color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  high: { icon: <AlertTriangle className="w-3 h-3" />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  medium: { icon: <Info className="w-3 h-3" />, color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  low: { icon: <CheckCircle className="w-3 h-3" />, color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  info: { icon: <Info className="w-3 h-3" />, color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.15)" },
};

type PortLike = GeneratedPort | { port: number; state: string; service: string; version: string; risk: string; cve?: string; cvssScore?: number };

interface ScanResultsPanelProps {
  isVisible: boolean;
  data?: GeneratedScanResult;
}

export default function ScanResultsPanel({ isVisible, data: apiData }: ScanResultsPanelProps) {
  const [selectedPort, setSelectedPort] = useState<PortLike | null>(null);
  const [activeTab, setActiveTab] = useState<"ports" | "os" | "route">("ports");
  
  if (!isVisible || !apiData) return null;
  const data = apiData;

  const portsByRisk = [...data.ports].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return (order[a.risk] ?? 5) - (order[b.risk] ?? 5);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-threat-red/10 border border-threat-red/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-threat-red" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Scan Results</h3>
            <p className="text-[10px] text-text-muted font-mono">
              {data.target} • {data.duration} • {data.scanType}
            </p>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded bg-threat-green/10 border border-threat-green/20">
            <span className="text-[10px] font-mono font-bold text-threat-green">{data.openPorts} OPEN</span>
          </div>
          <div className="px-2 py-1 rounded bg-threat-amber/10 border border-threat-amber/20">
            <span className="text-[10px] font-mono font-bold text-threat-amber">{data.filteredPorts} FILTERED</span>
          </div>
        </div>
      </div>

      {/* OS + Summary Row */}
      <div className="px-5 py-3 border-b border-white/[0.03] grid grid-cols-4 gap-4">
        <div>
          <span className="text-[10px] text-text-muted block">OS Fingerprint</span>
          <span className="text-xs font-mono text-text-primary">{data.osFingerprint}</span>
        </div>
        <div>
          <span className="text-[10px] text-text-muted block">Confidence</span>
          <span className="text-xs font-mono text-threat-green">{data.osCertainty}%</span>
        </div>
        <div>
          <span className="text-[10px] text-text-muted block">Host Status</span>
          <span className="text-xs font-mono text-threat-green uppercase">{data.hostStatus}</span>
        </div>
        <div>
          <span className="text-[10px] text-text-muted block">Total Ports Scanned</span>
          <span className="text-xs font-mono text-text-primary">{data.totalPorts.toLocaleString()}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-0 px-5 border-b border-white/[0.03]">
        {(["ports", "os", "route"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 ${
              activeTab === tab
                ? "text-threat-green border-threat-green"
                : "text-text-muted border-transparent hover:text-text-secondary"
            }`}
          >
            {tab === "ports" ? `Ports (${data.ports.length})` : tab === "os" ? "Services" : "Traceroute"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {activeTab === "ports" && (
            <motion.div
              key="ports"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Port Table */}
              <div className="rounded-lg border border-white/[0.04] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="text-left text-[10px] font-mono font-semibold text-text-muted px-3 py-2 uppercase">Port</th>
                      <th className="text-left text-[10px] font-mono font-semibold text-text-muted px-3 py-2 uppercase">State</th>
                      <th className="text-left text-[10px] font-mono font-semibold text-text-muted px-3 py-2 uppercase">Service</th>
                      <th className="text-left text-[10px] font-mono font-semibold text-text-muted px-3 py-2 uppercase">Version</th>
                      <th className="text-left text-[10px] font-mono font-semibold text-text-muted px-3 py-2 uppercase">Risk</th>
                      <th className="text-left text-[10px] font-mono font-semibold text-text-muted px-3 py-2 uppercase">CVE</th>
                      <th className="text-left text-[10px] font-mono font-semibold text-text-muted px-3 py-2 uppercase">CVSS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portsByRisk.map((port, i) => {
                      const risk = riskConfig[port.risk];
                      return (
                        <motion.tr
                          key={port.port}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => setSelectedPort(port)}
                          className={`
                            border-t border-white/[0.03] cursor-pointer transition-colors duration-150
                            ${selectedPort?.port === port.port ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}
                          `}
                        >
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-mono font-semibold text-text-primary">{port.port}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: port.state === "open" ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.08)",
                                color: port.state === "open" ? "#10b981" : "#94a3b8",
                              }}
                            >
                              {port.state.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-text-secondary">{port.service}</td>
                          <td className="px-3 py-2.5 text-[11px] font-mono text-text-muted">{port.version}</td>
                          <td className="px-3 py-2.5">
                            <div
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                              style={{ backgroundColor: risk.bg, color: risk.color, border: `1px solid ${risk.border}` }}
                            >
                              {risk.icon}
                              {port.risk.toUpperCase()}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            {port.cve ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-mono text-threat-red">{port.cve}</span>
                                <ExternalLink className="w-3 h-3 text-text-muted" />
                              </div>
                            ) : (
                              <span className="text-[10px] text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {port.cvssScore ? (
                              <span
                                className="text-xs font-mono font-bold"
                                style={{
                                  color: port.cvssScore >= 9 ? "#ef4444" : port.cvssScore >= 7 ? "#f59e0b" : port.cvssScore >= 4 ? "#3b82f6" : "#10b981",
                                }}
                              >
                                {port.cvssScore}
                              </span>
                            ) : (
                              <span className="text-[10px] text-text-muted">—</span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Selected Port Detail */}
              <AnimatePresence>
                {selectedPort && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-text-primary">Port {selectedPort.port}</span>
                      <ChevronRight className="w-3 h-3 text-text-muted" />
                      <span className="text-xs text-text-secondary">{selectedPort.service} {selectedPort.version}</span>
                    </div>
                    {selectedPort.cve && (
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-threat-red">{selectedPort.cve}</span>
                        <span className="text-[10px] text-text-muted">CVSS: {selectedPort.cvssScore}</span>
                        <a href={`https://nvd.nist.gov/vuln/detail/${selectedPort.cve}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-threat-blue flex items-center gap-0.5 hover:underline">
                          NVD <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === "os" && (
            <motion.div
              key="os"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {data.services.map((service, i) => (
                <motion.div
                  key={service}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03]"
                >
                  <span className="text-xs font-mono text-text-primary">{service}</span>
                  <span className="text-[10px] font-mono text-threat-green px-2 py-0.5 rounded bg-threat-green/10">DETECTED</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "route" && (
            <motion.div
              key="route"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {data.traceroute.length === 0 && <p className="text-xs text-text-secondary p-3">Traceroute was not requested by this scan profile.</p>}
              {data.traceroute.map((hop, i) => (
                <motion.div
                  key={hop.hop}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03]"
                >
                  <span className="w-6 text-center text-[10px] font-mono font-bold text-text-muted">{hop.hop}</span>
                  <div className="w-2 h-2 rounded-full bg-threat-cyan" />
                  {i < data.traceroute.length - 1 && (
                    <div className="absolute left-[38px] top-[28px] w-px h-6 bg-threat-cyan/20" />
                  )}
                  <span className="text-xs font-mono text-text-primary">{hop.ip}</span>
                  <span className="text-[10px] font-mono text-text-muted ml-auto">{hop.rtt}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
