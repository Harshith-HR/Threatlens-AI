"use client";

import React, { useState } from "react";
import {
  Bot,
  ShieldCheck,
  Copy,
  Check,
  Lock,
  Globe,
  Server,
  FileText,
  UserCheck,
  Terminal,
} from "lucide-react";
import type { Finding } from "@/lib/scan-types";

interface AiSecurityAnalystProps {
  text: string;
  model?: string;
  findings: Finding[];
  target: string;
}

export default function AiSecurityAnalyst({
  text,
  model = "google/gemini-2.5-flash",
  findings,
  target,
}: AiSecurityAnalystProps) {
  const [viewMode, setViewMode] = useState<"executive" | "technical">("executive");
  const [copied, setCopied] = useState(false);

  // Derive risk statistics
  const highCount = findings.filter((f) => f.severity === "high" || f.severity === "critical").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;
  const lowCount = findings.filter((f) => f.severity === "low" || f.severity === "info").length;

  const riskLevel =
    highCount > 0
      ? { label: "HIGH RISK", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)", desc: "Immediate remediation required to prevent perimeter infiltration or credential theft." }
      : mediumCount > 0
      ? { label: "MODERATE RISK", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)", desc: "Security hardening required. Defenses against data interception and script injection are lacking." }
      : { label: "LOW RISK", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)", desc: "Good baseline security posture with minimal observed hardening gaps." };

  const handleCopy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to extract or summarize plain English section if available
  const cleanHost = (() => {
    try {
      return new URL(target).hostname;
    } catch {
      return target;
    }
  })();

  return (
    <section className="glass-card panel space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Bot size={18} />
            </span>
            <h2 className="text-base font-semibold text-white tracking-wide">
              AI Security Intelligence & Threat Briefing
            </h2>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Synthesized defensive analysis of <strong className="text-white">{cleanHost}</strong>. Review recommendations before applying configurations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {model && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/[0.05] border border-white/[0.1] text-emerald-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {model}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="button text-xs py-1 px-2.5 flex items-center gap-1.5"
            title="Copy briefing to clipboard"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy Briefing"}</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 rounded-lg bg-black/30 border border-white/[0.06] max-w-md">
        <button
          onClick={() => setViewMode("executive")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
            viewMode === "executive"
              ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.08]"
              : "text-text-muted hover:text-white"
          }`}
        >
          <UserCheck size={14} />
          Executive View (Non-Technical)
        </button>
        <button
          onClick={() => setViewMode("technical")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
            viewMode === "technical"
              ? "bg-white/[0.1] text-white shadow-sm border border-white/[0.08]"
              : "text-text-muted hover:text-white"
          }`}
        >
          <Terminal size={14} />
          Technical Deep-Dive (Engineering)
        </button>
      </div>

      {/* VIEW 1: EXECUTIVE BRIEFING (NON-TECHNICAL) */}
      {viewMode === "executive" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Executive Risk Posture Card */}
          <div
            className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ backgroundColor: riskLevel.bg, borderColor: riskLevel.border }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded text-xs font-black tracking-wider uppercase"
                  style={{ backgroundColor: riskLevel.color, color: "#000" }}
                >
                  {riskLevel.label}
                </span>
                <span className="text-xs font-semibold text-white">Overall Security Posture</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed max-w-2xl">{riskLevel.desc}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0 bg-black/40 px-3.5 py-2 rounded-lg border border-white/10">
              <div className="text-center">
                <div className="text-base font-bold text-red-400">{highCount}</div>
                <div className="text-[10px] text-text-muted uppercase">High</div>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <div className="text-base font-bold text-amber-400">{mediumCount}</div>
                <div className="text-[10px] text-text-muted uppercase">Medium</div>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <div className="text-base font-bold text-slate-400">{lowCount}</div>
                <div className="text-[10px] text-text-muted uppercase">Low/Info</div>
              </div>
            </div>
          </div>

          {/* Plain English Explanation Card */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <FileText size={16} className="text-emerald-400" />
              <h3>Plain English Summary for Leadership</h3>
            </div>
            <p className="text-xs text-white/90 leading-relaxed">
              An automated security audit was conducted on <strong className="text-white">{cleanHost}</strong>. In simple terms:
              the application was evaluated for how well it protects user data, guards against browser tampering, and restricts access to server management ports.
              The system identified <strong className="text-amber-400">{findings.length} security areas</strong> that need attention before the system can be considered hardened against unauthorized actors.
            </p>
          </div>

          {/* Real-World Business Consequences Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Real-World Business Impact & Risks
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Impact Card 1: Data Interception */}
              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <Lock size={15} />
                  <span>Data In Transit Security</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {findings.some((f) => f.cwe === "CWE-319")
                    ? "The site accepts unencrypted HTTP traffic. Attackers on the same WiFi or network can read credentials and passwords in plaintext."
                    : "Traffic encryption is enforced, but secondary browser transport directives (like HSTS) should be confirmed."}
                </p>
              </div>

              {/* Impact Card 2: Browser & Script Injection */}
              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                  <Globe size={15} />
                  <span>Browser & User Protection</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {findings.some((f) => f.cwe === "CWE-693" || f.cwe === "CWE-1021")
                    ? "Missing browser defense rules (CSP & Anti-Clickjacking) allow malicious third parties to attempt script injection or stealthily embed the website into fake portals."
                    : "Standard client browser defense headers are active, minimizing basic clickjacking and MIME spoofing."}
                </p>
              </div>

              {/* Impact Card 3: Exposed Infrastructure */}
              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
                  <Server size={15} />
                  <span>Infrastructure Exposure</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {findings.some((f) => f.category === "nmap" || f.source === "nmap")
                    ? "Network ports (such as database or file-sharing services) are reachable from outside networks. These should be protected behind a firewall or VPN."
                    : "No unintended administrative ports were detected exposed to the public internet."}
                </p>
              </div>
            </div>
          </div>

          {/* Leadership Action Checklist */}
          <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck size={16} />
              <span>Recommended Next Steps for Management</span>
            </div>
            <ul className="text-xs text-text-muted space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">Authorize HTTPS Enforcement:</strong> Instruct engineering to redirect all unencrypted HTTP traffic to HTTPS across the entire domain.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">Deploy Defensive Web Headers:</strong> Approve the deployment of Content Security Policy (CSP) and Strict-Transport-Security (HSTS) headers via Nginx/Apache.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong className="text-white">Firewall Administrative Ports:</strong> Restrict database and file-sharing ports to trusted internal IP subnets only.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* VIEW 2: TECHNICAL DEEP-DIVE (ENGINEERING) */}
      {viewMode === "technical" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="text-xs text-text-muted flex items-center gap-1.5 pb-2">
            <Terminal size={14} className="text-emerald-400" />
            <span>Structured engineering output generated by ThreatLens AI based strictly on observed telemetry:</span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-sans text-white/90 leading-relaxed overflow-x-auto">
            <RenderFormattedAnalysis rawText={text} />
          </div>
        </div>
      )}
    </section>
  );
}

// Clean Formatter for Markdown Headings and Code Blocks
function RenderFormattedAnalysis({ rawText }: { rawText: string }) {
  if (!rawText) return <p className="text-text-muted">No analysis available.</p>;

  // Clean raw hex finding references from text if any, making it cleaner to read
  const lines = rawText.split("\n");

  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Level 2 / 3 Heading
        if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
          const heading = trimmed.replace(/^#{2,3}\s+/, "");
          return (
            <h3
              key={idx}
              className="text-sm font-bold text-emerald-400 pt-3 pb-1 border-b border-white/[0.06] flex items-center gap-2"
            >
              <span>{heading}</span>
            </h3>
          );
        }

        // Level 1 Heading
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={idx} className="text-base font-bold text-white pt-2 pb-1">
              {trimmed.replace(/^#\s+/, "")}
            </h2>
          );
        }

        // Bullet point
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const bullet = trimmed.replace(/^[\*\-]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="text-white/80">{renderInlineFormatting(bullet)}</span>
            </div>
          );
        }

        // Code block indicator
        if (trimmed.startsWith("```")) {
          return (
            <div key={idx} className="text-[10px] font-mono text-emerald-300/70 py-0.5">
              {trimmed.replace(/```/, "") ? `[${trimmed.replace(/```/, "")} configuration snippet]` : ""}
            </div>
          );
        }

        // Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Regular line
        return (
          <p key={idx} className="text-white/80 leading-relaxed">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Simple inline bold formatting parser
function renderInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-white/[0.08] text-emerald-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
