"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  Bot,
  CheckCircle2,
  Clock,
  Globe,
  History,
  Square,
  Terminal as TerminalIcon,
  Printer,
  FileText,
  Layers,
  ShieldCheck,
  Lock,
  Info,
} from "lucide-react";
import TargetScanner from "@/components/offensive/TargetScanner";
import AgentTerminal from "@/components/offensive/AgentTerminal";
import ScanResultsPanel from "@/components/offensive/ScanResultsPanel";
import FindingsExplorer from "@/components/offensive/FindingsExplorer";
import AttackPathVisualizer from "@/components/offensive/AttackPathVisualizer";
import MitreAttackPanel from "@/components/offensive/MitreAttackPanel";
import AiSecurityAnalyst from "@/components/offensive/AiSecurityAnalyst";
import PrintExecutiveReport from "@/components/offensive/PrintExecutiveReport";
import { api, useWorkspace } from "@/components/WorkspaceProvider";
import {
  PageIntro,
  StatusBadge,
  formatTime,
} from "@/components/ui/WorkspaceUI";
import type { ScanProfile } from "@/lib/offensive-data";
import type { ScanSession } from "@/lib/scan-types";
export default function OffensivePage() {
  const { scans, refresh } = useWorkspace();
  const [scan, setScan] = useState<ScanSession | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [tab, setTab] = useState("findings");
  const [streamConnected, setStreamConnected] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const source = useRef<EventSource | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentId = useRef<string | null>(null);
  const disconnect = useCallback(() => {
    source.current?.close();
    source.current = null;
    if (poll.current) clearInterval(poll.current);
    poll.current = null;
  }, []);
  const load = useCallback(
    async (id: string) => {
      currentId.current = id;
      disconnect();
      try {
        const data = await api<ScanSession>(`/api/scan/${id}/results`);
        if (currentId.current !== id) return;
        setScan(data);
        setError("");
        if (data.status === "running") {
          const stream = new EventSource(`/api/scan/${id}/stream`);
          source.current = stream;
          stream.onopen = () => setStreamConnected(true);
          stream.onmessage = (event) => {
            if (currentId.current !== id) return;
            try {
              const update: ScanSession = JSON.parse(event.data);
              setScan(update);
              if (update.status !== "running") {
                disconnect();
                setStreamConnected(false);
                void refresh();
              }
            } catch {
              setError("Unable to decode scan update.");
            }
          };
          stream.onerror = () => {
            setStreamConnected(false);
            stream.close();
            if (poll.current) return;
            poll.current = setInterval(async () => {
              try {
                const update = await api<ScanSession>(
                  `/api/scan/${id}/results`,
                );
                if (currentId.current !== id) return;
                setScan(update);
                if (update.status !== "running") {
                  disconnect();
                  void refresh();
                }
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Reconnection failed",
                );
              }
            }, 2000);
          };
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load scan");
      }
    },
    [disconnect, refresh],
  );
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("scan");
    const initial = id ? setTimeout(() => void load(id), 0) : undefined;
    return () => {
      if (initial) clearTimeout(initial);
      currentId.current = null;
      disconnect();
    };
  }, [load, disconnect]);
  const start = async (target: string, profile: ScanProfile) => {
    setStarting(true);
    setError("");
    try {
      const created = await api<ScanSession>("/api/scan", {
        method: "POST",
        body: JSON.stringify({ target, profileId: profile.id }),
      });
      window.history.replaceState(null, "", `/offensive?scan=${created.id}`);
      await load(created.id);
      setTab("findings");
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start scan");
    } finally {
      setStarting(false);
    }
  };
  const reload = () => {
    if (scan)
      void api<ScanSession>(`/api/scan/${scan.id}/results`)
        .then(setScan)
        .then(refresh)
        .catch((e) => setError(e.message));
  };
  const running = scan?.status === "running";
  const messages = scan?.terminalStream || [];
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="OFFENSIVE RECON / ASSESSMENT WORKSPACE"
        title="Understand your attack surface."
        description="Live web inspection and network discovery. Every finding starts with evidence."
        action={
          scan && (
            <div className="flex flex-wrap gap-2">
              <button
                className="button"
                onClick={() => setShowReportPreview(true)}
              >
                <FileText size={16} />
                <span className="hidden sm:inline">Executive Report</span>
              </button>
              <button className="button" onClick={() => window.print()}>
                <Printer size={16} />
                <span className="hidden sm:inline">Print Report (PDF)</span>
              </button>
              <a className="button" href={`/api/scan/${scan.id}/report`}>
                <ArrowDownToLine size={16} /> Export JSON
              </a>
            </div>
          )
        }
      />
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 no-print">
        <div className="xl:col-span-2">
          <TargetScanner
            onScanStart={start}
            isScanning={starting || Boolean(running)}
            scanComplete={Boolean(scan && scan.status !== "running")}
          />
        </div>
        <div className="xl:col-span-3 space-y-4">
          <div className="glass-card scan-session-summary">
            <div>
              <span className="eyebrow">ASSESSMENT SESSION</span>
              <h2>
                {scan ? new URL(scan.target).hostname : "Ready when you are"}
              </h2>
              <p>
                {scan
                  ? scan.target
                  : "Enter your target to begin collecting evidence."}
              </p>
            </div>
            {scan && <StatusBadge status={scan.status} />}
          </div>
          <AgentTerminal
            messages={messages}
            isActive={Boolean(running)}
            onPhaseChange={() => {}}
            scanComplete={Boolean(scan && scan.status !== "running")}
          />
        </div>
      </div>
      {scan && (
        <>
          <div className="glass-card scan-progress">
            <div>
              <span className="flex items-center gap-2">
                <Activity size={15} />
                {running
                  ? streamConnected
                    ? "Live assessment stream"
                    : "Assessment running · reconnecting"
                  : "Assessment finished"}
              </span>
              <strong>{scan.progress}%</strong>
            </div>
            <div className="bar-track">
              <div style={{ width: `${scan.progress}%` }} />
            </div>
            <footer>
              <span>
                {scan.pages.length} pages inspected · {scan.findings.length}{" "}
                observations
              </span>
              {running && (
                <button
                  className="text-link"
                  onClick={async () => {
                    try {
                      await api(`/api/scan/${scan.id}/cancel`, {
                        method: "POST",
                      });
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Cancellation failed",
                      );
                    }
                  }}
                >
                  <Square size={12} /> Cancel scan
                </button>
              )}
            </footer>
          </div>
          {scan.error && <p className="notice-banner">{scan.error}</p>}
          <div className="coverage-grid">
            {scan.coverage.map((c) => (
              <div className="glass-card coverage-card" key={c.module}>
                <div>
                  <span>
                    {c.module === "Web assessment" ? (
                      <Globe size={18} />
                    ) : c.module === "AI analysis" ? (
                      <Bot size={18} />
                    ) : (
                      <TerminalIcon size={18} />
                    )}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
                <h3>{c.module}</h3>
                <p>{c.detail}</p>
              </div>
            ))}
          </div>
          <nav
            className="workspace-tabs no-print"
            aria-label="Assessment results"
          >
            {[
              { id: "findings", label: `Findings (${scan.findings.length})` },
              { id: "network", label: "Network & services" },
              {
                id: "mitre",
                label: `MITRE ATT&CK (${scan.mitreFindings?.length || 0})`,
              },
              {
                id: "attack-paths",
                label: `Attack Paths (${scan.attackPaths?.length || 0})`,
              },
              { id: "ai", label: "AI analysis" },
              { id: "coverage", label: "Pages & coverage" },
            ].map((t) => (
              <button
                key={t.id}
                aria-pressed={tab === t.id}
                onClick={() => setTab(t.id)}
                className={tab === t.id ? "active" : ""}
              >
                {t.label}
              </button>
            ))}
          </nav>
          {tab === "findings" && (
            <FindingsExplorer
              findings={scan.findings}
              scanId={scan.id}
              onChange={reload}
            />
          )}
          {tab === "mitre" && (
            <MitreAttackPanel isVisible data={scan.mitreFindings} />
          )}
          {tab === "attack-paths" && (
            <AttackPathVisualizer isVisible data={scan.attackPaths} />
          )}
          {tab === "network" &&
            (scan.result ? (
              <ScanResultsPanel isVisible data={scan.result} />
            ) : (
              <div className="glass-card empty-state">
                <TerminalIcon size={30} />
                <h3>No network result available</h3>
                <p>{scan.coverage[1]?.detail}</p>
              </div>
            ))}
          {tab === "network" && Boolean(scan.result?.scripts?.length) && (
            <section className="glass-card panel">
              <h2>Nmap script evidence</h2>
              <div className="space-y-3 mt-5">
                {scan.result?.scripts?.map((s, i) => (
                  <details
                    key={`${s.port}-${s.name}-${i}`}
                    className="evidence-block"
                  >
                    <summary className="cursor-pointer text-xs">
                      Port {s.port} · {s.name}
                    </summary>
                    <pre className="mt-3">{s.output}</pre>
                  </details>
                ))}
              </div>
            </section>
          )}
          {tab === "ai" && (
            <AiSecurityAnalyst
              text={scan.ai?.text || scan.coverage[2]?.detail || ""}
              model={scan.ai?.model}
              findings={scan.findings}
              target={scan.target}
            />
          )}
          {tab === "coverage" && (
            <div className="space-y-5">
              {/* Scope & Architecture Overview */}
              <div className="glass-card panel space-y-4">
                <div className="section-heading">
                  <h2>
                    <Globe size={18} className="text-emerald-400" /> Target Attack Surface & Scope
                  </h2>
                  <span className="count-pill">
                    {scan.pages.length} URL{scan.pages.length === 1 ? "" : "s"} Crawled
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Target Entrypoint</span>
                    <strong className="text-white font-mono truncate block mt-0.5">{scan.target}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Profile Depth</span>
                    <strong className="text-white capitalize block mt-0.5">{scan.profileId} (Standard DAST)</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Open Ports</span>
                    <strong className="text-emerald-400 block mt-0.5">{scan.result?.openPorts ?? 0} Ports Exposed</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Audit Status</span>
                    <strong className="text-white capitalize block mt-0.5">{scan.status}</strong>
                  </div>
                </div>

                {/* Helpful contextual explanation when only 1 page was crawled (e.g. login.php) */}
                {scan.pages.length <= 1 && (
                  <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
                    <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-0.5">Single Unauthenticated Entrypoint Scope Notice</strong>
                      <span>
                        The scanner inspected the public entrypoint (<code>{scan.target}</code>).
                        Internal sub-pages requiring active session authentication (e.g. administrator dashboards) are safely protected and not crawled without valid credentials, in strict compliance with safe vulnerability assessment boundaries.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Assessment Modules Grid */}
              <div className="glass-card panel space-y-4">
                <div className="section-heading">
                  <h2>
                    <Layers size={18} className="text-cyan-400" /> Active Assessment Modules
                  </h2>
                  <span className="text-xs text-text-muted">3 Autonomous Agents</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {scan.coverage.map((c) => (
                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2" key={c.module}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {c.module === "Web assessment" ? (
                            <Globe size={16} className="text-emerald-400" />
                          ) : c.module === "AI analysis" ? (
                            <Bot size={16} className="text-purple-400" />
                          ) : (
                            <TerminalIcon size={16} className="text-cyan-400" />
                          )}
                          <strong className="text-xs text-white">{c.module}</strong>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed">{c.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspected Pages Table */}
              <section className="glass-card panel">
                <div className="section-heading">
                  <h2>
                    <CheckCircle2 size={18} className="text-emerald-400" /> Inspected Endpoints & Latency
                  </h2>
                  <span className="muted text-xs">Public unauthenticated GET requests</span>
                </div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Method</th>
                        <th>HTTP Status</th>
                        <th>Response Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scan.pages.map((p, i) => (
                        <tr key={`${p.url}-${i}`}>
                          <td className="break-all font-mono text-xs">{p.url}</td>
                          <td>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] text-text-muted uppercase">
                              GET
                            </span>
                          </td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                                p.status >= 200 && p.status < 300
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : p.status >= 300 && p.status < 400
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {p.status} {p.status === 200 ? "OK" : ""}
                            </span>
                          </td>
                          <td className="font-mono text-xs text-text-muted">{p.duration} ms</td>
                        </tr>
                      ))}
                      {scan.pages.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-text-muted">
                            Initial endpoint request logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Methodology & Safety Boundaries */}
              <div className="glass-card panel space-y-3">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Assessment Methodology & Safety Guardrails
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <ShieldCheck size={14} />
                      <span>Verified Active Checks</span>
                    </div>
                    <ul className="text-[11px] text-text-muted space-y-1 pl-4 list-disc">
                      <li>HTTP/HTTPS transport & SSL/TLS certificate validity</li>
                      <li>Security response headers (CSP, HSTS, X-Frame-Options)</li>
                      <li>Cookie attributes (Secure, HttpOnly, SameSite)</li>
                      <li>Exposed sensitive dotfiles (.git/HEAD, .env leakage)</li>
                      <li>TCP service discovery and banner fingerprinting</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Lock size={14} />
                      <span>Excluded Out-of-Scope (Safe DAST)</span>
                    </div>
                    <ul className="text-[11px] text-text-muted space-y-1 pl-4 list-disc">
                      <li>No destructive database modification or drop statements</li>
                      <li>No denial-of-service (DoS) or volume flooding</li>
                      <li>No brute-force password cracking on live accounts</li>
                      <li>No persistent remote shell / backdoor installation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <section className="glass-card panel no-print">
        <div className="section-heading">
          <h2>
            <History size={18} /> Assessment history
          </h2>
          <span className="muted text-xs">Saved across restarts</span>
        </div>
        {scans.length ? (
          <div className="history-grid">
            {scans.map((s) => (
              <button
                className={`history-card ${scan?.id === s.id ? "selected" : ""}`}
                key={s.id}
                onClick={() => {
                  window.history.replaceState(
                    null,
                    "",
                    `/offensive?scan=${s.id}`,
                  );
                  void load(s.id);
                }}
              >
                <div>
                  <Globe size={16} />
                  <StatusBadge status={s.status} />
                </div>
                <strong>{new URL(s.target).hostname}</strong>
                <p>
                  <Clock size={12} />
                  {formatTime(s.createdAt)}
                </p>
                <span>
                  {s.findings.length} observations · {s.profileId}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="muted py-5">Your assessments will appear here.</p>
        )}
      </section>

      {/* Full Executive Report Modal Preview */}
      {showReportPreview && scan && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-4 sm:p-8 flex justify-center no-print">
          <div className="relative w-full max-w-5xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <PrintExecutiveReport scan={scan} onClose={() => setShowReportPreview(false)} />
          </div>
        </div>
      )}

      {/* Hidden container exclusively rendered during window.print() */}
      {scan && (
        <div className="print-only">
          <PrintExecutiveReport scan={scan} />
        </div>
      )}
    </div>
  );
}
