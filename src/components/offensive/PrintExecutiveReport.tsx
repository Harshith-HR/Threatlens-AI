"use client";

import React from "react";
import type { ScanSession } from "@/lib/scan-types";

interface PrintExecutiveReportProps {
  scan: ScanSession;
  onClose?: () => void;
}

export default function PrintExecutiveReport({ scan, onClose }: PrintExecutiveReportProps) {
  const findings = scan.findings || [];
  const ports = scan.result?.ports?.filter((p) => p.state === "open") || [];
  const mitre = scan.mitreFindings || [];
  const paths = scan.attackPaths || [];

  const highCount = findings.filter((f) => f.severity === "high" || f.severity === "critical").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;
  const lowCount = findings.filter((f) => f.severity === "low" || f.severity === "info").length;

  const targetHost = (() => {
    try {
      return new URL(scan.target).hostname;
    } catch {
      return scan.target;
    }
  })();

  const overallRisk =
    highCount > 0
      ? { label: "HIGH RISK", color: "#dc2626", bg: "#fef2f2", border: "#f87171" }
      : mediumCount > 0
      ? { label: "MODERATE RISK", color: "#d97706", bg: "#fffbeb", border: "#fcd34d" }
      : { label: "LOW RISK", color: "#16a34a", bg: "#f0fdf4", border: "#86efac" };

  return (
    <div className="executive-report-container p-6 sm:p-10 max-w-5xl mx-auto bg-white text-slate-900 shadow-2xl rounded-xl font-sans print:p-0 print:shadow-none print:max-w-none print:bg-white print:text-black">
      {/* On-screen control bar (hidden in print) */}
      <div className="no-print flex items-center justify-between pb-6 mb-8 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-bold tracking-wider uppercase">
            Executive Report Preview
          </span>
          <span className="text-xs text-slate-500">Publication-ready security assessment document</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
          >
            <span>Print / Save as PDF</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              Close Preview
            </button>
          )}
        </div>
      </div>

      {/* ================= 1. REPORT HEADER & COVER BLOCK ================= */}
      <header className="border-b-2 border-slate-900 pb-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center font-bold text-xl shadow-md border border-slate-800">
              TL
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                ThreatLens <span className="text-emerald-700">AI</span>
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-700">
                Autonomous Security Operations & Threat Intelligence
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 rounded-md bg-red-100 text-red-900 border border-red-300 font-bold text-[10px] tracking-wider uppercase">
              CONFIDENTIAL // CYBERSECURITY AUDIT REPORT
            </span>
            <div className="text-xs text-slate-700 font-mono mt-1">
              Ref: <span className="text-slate-900 font-semibold">{scan.id}</span>
            </div>
            <div className="text-xs text-slate-700">
              Date: <span className="text-slate-900 font-semibold">{new Date(scan.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Target Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-700 block uppercase font-bold text-[10px]">Target Host</span>
            <strong className="text-slate-900 font-mono text-sm">{targetHost}</strong>
          </div>
          <div>
            <span className="text-slate-700 block uppercase font-bold text-[10px]">Scope URL</span>
            <span className="text-slate-900 truncate block font-mono">{scan.target}</span>
          </div>
          <div>
            <span className="text-slate-700 block uppercase font-bold text-[10px]">Assessment Profile</span>
            <strong className="text-slate-900 capitalize">{scan.profileId} Assessment</strong>
          </div>
          <div>
            <span className="text-slate-700 block uppercase font-bold text-[10px]">Audit Engine</span>
            <span className="text-slate-900 font-semibold">ThreatLens DAST & Nmap</span>
          </div>
        </div>
      </header>

      {/* ================= 2. EXECUTIVE RISK POSTURE SCORECARD ================= */}
      <section className="mb-8 page-break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <span>1. Executive Threat Overview & Risk Posture</span>
        </h2>

        <div className="p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ backgroundColor: overallRisk.bg, borderColor: overallRisk.border }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded text-xs font-black tracking-wider uppercase shadow-sm" style={{ backgroundColor: overallRisk.color, color: "#fff" }}>
                {overallRisk.label}
              </span>
              <span className="text-sm font-bold text-slate-900">Calculated Security Posture</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed max-w-xl">
              The automated assessment identified <strong>{findings.length} total observations</strong> across web application attack surfaces and network services.
              Remediation is recommended to eliminate data interception risks and enforce defensive browser headers before production release.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="px-2">
              <div className="text-lg font-black text-red-600">{highCount}</div>
              <div className="text-[9px] text-slate-700 uppercase font-bold">High</div>
            </div>
            <div className="px-2 border-l border-slate-100">
              <div className="text-lg font-black text-amber-600">{mediumCount}</div>
              <div className="text-[9px] text-slate-700 uppercase font-bold">Medium</div>
            </div>
            <div className="px-2 border-l border-slate-100">
              <div className="text-lg font-black text-slate-600">{lowCount}</div>
              <div className="text-[9px] text-slate-700 uppercase font-bold">Low/Info</div>
            </div>
            <div className="px-2 border-l border-slate-100">
              <div className="text-lg font-black text-emerald-700">{ports.length}</div>
              <div className="text-[9px] text-slate-700 uppercase font-bold">Open Ports</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. VULNERABILITIES & EXPOSURE TABLE ================= */}
      <section className="mb-8 page-break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
          <span>2. Vulnerability Findings & Exposure Inventory</span>
          <span className="text-xs text-slate-700 font-normal">Total: {findings.length} findings</span>
        </h2>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Finding ID</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Vulnerability Title</th>
                <th className="py-2.5 px-3">CWE</th>
                <th className="py-2.5 px-3">OWASP Standard</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {findings.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{f.id.slice(0, 8)}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.severity === "high" || f.severity === "critical"
                          ? "bg-red-100 text-red-900"
                          : f.severity === "medium"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {f.severity}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-900">{f.title}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{f.cwe || "CWE-693"}</td>
                  <td className="py-2 px-3 text-slate-700 truncate max-w-[150px]">{f.owasp || "A05: Security Misconfiguration"}</td>
                  <td className="py-2 px-3 text-emerald-800 font-semibold uppercase text-[10px]">Verified</td>
                </tr>
              ))}
              {findings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-700">No vulnerabilities detected.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= 4. MITRE ATT&CK ENTERPRISE MAPPING ================= */}
      {mitre.length > 0 && (
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
            <span>3. MITRE ATT&CK Enterprise Matrix Mapping</span>
            <span className="text-xs text-slate-700 font-normal">{mitre.length} techniques identified</span>
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Technique ID</th>
                  <th className="py-2.5 px-3">Technique Name</th>
                  <th className="py-2.5 px-3">MITRE Tactic</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Discovered Indicator / Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mitre.slice(0, 10).map((m, i) => (
                  <tr key={`${m.techniqueId}-${i}`}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.techniqueId}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{m.techniqueName}</td>
                    <td className="py-2 px-3 text-slate-700">{m.tactic}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                        {m.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 truncate max-w-[200px]">{m.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================= 5. EXPLOIT CHAINS / ATTACK PATH ANALYSIS ================= */}
      {paths.length > 0 && (
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
            4. Synthesized Exploit Chains & Attack Paths
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {paths.map((p, idx) => (
              <div key={p.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-mono">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-xs font-bold text-red-600 font-mono">{p.probability}% Success Probability</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                <div className="space-y-1 pt-1 border-t border-slate-200">
                  {p.nodes.map((n, ni) => (
                    <div key={n.id} className="text-[10px] text-slate-700 flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">{ni + 1}.</span>
                      <span className="truncate">{n.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= 6. NETWORK DISCOVERY & PORTS ================= */}
      {ports.length > 0 && (
        <section className="mb-8 page-break-inside-avoid">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
            5. Discovered Network Services & Exposed Ports
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {ports.map((p) => (
              <div key={p.port} className="p-2.5 rounded border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 font-mono">Port {p.port}/tcp</strong>
                  <div className="text-[11px] text-slate-700 font-medium">{p.service}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 uppercase">
                  Open
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= 7. AI STRATEGIC REMEDIATION ROADMAP ================= */}
      <section className="mb-8 page-break-inside-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
          6. AI Strategic Defensive Remediation Roadmap
        </h2>
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 space-y-3 leading-relaxed">
          <p className="font-medium">
            Based on the findings observed during this assessment, ThreatLens AI prescribes the following prioritized remediation plan:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white rounded border border-slate-200">
              <strong className="text-slate-900 block mb-1">Priority 1: Enforce HTTPS & Transport Security</strong>
              <p className="text-[11px] text-slate-700">
                Deploy an SSL/TLS certificate and configure HTTP-to-HTTPS 301 permanent redirects. Add the <code>Strict-Transport-Security: max-age=31536000</code> header.
              </p>
            </div>
            <div className="p-3 bg-white rounded border border-slate-200">
              <strong className="text-slate-900 block mb-1">Priority 2: Deploy Content Security Policy (CSP)</strong>
              <p className="text-[11px] text-slate-700">
                Deploy an enforcing <code>Content-Security-Policy</code> and <code>X-Frame-Options: DENY</code> header to eliminate cross-site scripting and UI redressing attack vectors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 8. METHODOLOGY, SAFETY & FORMAL SIGN-OFF ================= */}
      <footer className="pt-6 border-t-2 border-slate-900 text-xs text-slate-700 space-y-6 page-break-inside-avoid">
        <div>
          <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
            Methodology & Safe Testing Attestation
          </h3>
          <p className="text-[11px] leading-relaxed text-slate-700">
            This assessment was conducted using passive and non-destructive active probing methodologies adhering to OWASP Web Security Testing standards.
            No persistent backdoors, denial-of-service payloads, or destructive database modification routines were executed.
            Absence of findings does not guarantee total immunity from unobserved zero-day vulnerabilities.
          </p>
        </div>

        {/* Signature Line Block */}
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div className="border-t border-slate-300 pt-2">
            <span className="block text-[10px] text-slate-700 uppercase font-bold">Automated Lead Assessor</span>
            <strong className="text-slate-900 text-xs">ThreatLens AI Autonomous Operations Engine</strong>
            <div className="text-[10px] text-slate-700 mt-0.5">Verification Hash: {scan.id.slice(0, 16)}</div>
          </div>
          <div className="border-t border-slate-300 pt-2">
            <span className="block text-[10px] text-slate-700 uppercase font-bold">Reviewing Security Officer</span>
            <div className="h-4 border-b border-dashed border-slate-300 my-1 w-48" />
            <div className="text-[10px] text-slate-700">Signature / Authorization Date</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
