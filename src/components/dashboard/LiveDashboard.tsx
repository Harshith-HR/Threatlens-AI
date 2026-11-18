"use client";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Bug,
  Globe,
  Layers,
  Radar,
  ScanLine,
  Shield,
  Terminal,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  EmptyState,
  Metric,
  SeverityBadge,
  StatusBadge,
  formatTime,
  severityOrder,
} from "@/components/ui/WorkspaceUI";
export default function LiveDashboard() {
  const { scans, health, error, loading } = useWorkspace();
  const latestByTarget = new Map<string, (typeof scans)[number]>();
  for (const scan of scans)
    if (!latestByTarget.has(scan.target)) latestByTarget.set(scan.target, scan);
  const latest = [...latestByTarget.values()];
  const findings = latest.flatMap((s) =>
    s.findings.map((f) => ({ ...f, scanId: s.id })),
  );
  const open = findings.filter((f) => f.status !== "resolved");
  const active = scans.filter((s) => s.status === "running");
  const priorities = [...open]
    .sort(
      (a, b) =>
        severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
    )
    .slice(0, 5);
  const categories = [...new Set(findings.map((f) => f.category))];
  const requests = scans.slice(0, 12).reverse();
  const maxRequests = Math.max(1, ...requests.map((s) => s.pages.length));
  return (
    <div className="space-y-6">
      <section className="command-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" /> YOUR SECURITY, IN FOCUS
          </p>
          <h1>
            See the exposure.
            <br />
            <span>Own the response.</span>
          </h1>
          <p>
            One workspace for live reconnaissance, evidence-backed findings, and
            a clear path to remediation.
          </p>
          <Link href="/offensive" className="button primary">
            Launch an assessment
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hero-caption">
          <Globe size={14} /> THREATLENS / SECURITY INTELLIGENCE
        </div>
      </section>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      <div className="section-heading">
        <div>
          <p className="eyebrow">COMMAND CENTER</p>
          <h2>Security overview</h2>
        </div>
        <span className="muted text-xs">
          Latest assessment per target · refreshes every 5s
        </span>
      </div>
      <div className="metrics-grid">
        <Metric
          label="Assessed targets"
          value={latest.length}
          detail={`${scans.length} assessments in history`}
          icon={<Globe size={18} />}
        />
        <Metric
          label="Open observations"
          value={open.length}
          detail={`${open.filter((f) => ["critical", "high"].includes(f.severity)).length} high or critical severity`}
          icon={<Bug size={18} />}
        />
        <Metric
          label="Active assessments"
          value={active.length}
          detail="Web + network discovery"
          icon={<Radar size={18} />}
        />
        <Metric
          label="Reviewed / resolved"
          value={findings.filter((f) => f.status !== "open").length}
          detail="Analyst-managed remediation status"
          icon={<Shield size={18} />}
        />
      </div>
      <div className="dashboard-grid">
        <section className="glass-card panel">
          <div className="section-heading">
            <h2>
              <ScanLine size={17} /> Recent assessments
            </h2>
            <Link href="/offensive" className="text-link">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {loading ? (
            <p className="muted p-5">Loading assessments…</p>
          ) : scans.length ? (
            <div className="scan-list">
              {scans.slice(0, 5).map((scan) => (
                <Link
                  className="scan-row"
                  key={scan.id}
                  href={`/offensive?scan=${scan.id}`}
                >
                  <div className="scan-icon">
                    <Globe size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="truncate block">
                      {new URL(scan.target).hostname}
                    </strong>
                    <p>
                      {formatTime(scan.createdAt)} · {scan.findings.length}{" "}
                      observations
                    </p>
                  </div>
                  <StatusBadge status={scan.status} />
                  <ArrowUpRight size={15} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
        <section className="glass-card panel">
          <div className="section-heading">
            <h2>
              <Activity size={17} /> Assessment activity
            </h2>
            <span className="muted text-xs">Pages inspected</span>
          </div>
          {requests.length ? (
            <>
              <div className="activity-chart">
                {requests.map((s) => (
                  <div
                    key={s.id}
                    className="activity-column"
                    title={`${s.target}: ${s.pages.length} pages`}
                  >
                    <span>{s.pages.length}</span>
                    <div
                      style={{
                        height: `${Math.max(4, (s.pages.length / maxRequests) * 140)}px`,
                      }}
                    />
                    <small>
                      {new Date(s.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </small>
                  </div>
                ))}
              </div>
              <p className="chart-note">
                Measured HTTP responses from your last {requests.length}{" "}
                assessments
              </p>
            </>
          ) : (
            <EmptyState
              title="Activity appears here"
              description="Completed HTTP requests populate this chart."
              link={false}
            />
          )}
        </section>
        <section className="glass-card panel">
          <div className="section-heading">
            <h2>
              <Bug size={17} /> Priority findings
            </h2>
            <Link className="text-link" href="/defensive">
              Open triage <ArrowUpRight size={14} />
            </Link>
          </div>
          {priorities.length ? (
            <div>
              {priorities.map((f) => (
                <Link
                  className="finding-preview"
                  key={`${f.scanId}-${f.id}`}
                  href={`/offensive?scan=${f.scanId}`}
                >
                  <SeverityBadge severity={f.severity} />
                  <div>
                    <strong>{f.title}</strong>
                    <p>
                      {new URL(f.url).hostname} ·{" "}
                      {f.confidence === "observed"
                        ? "Observed"
                        : "Review needed"}
                    </p>
                  </div>
                  <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No open observations"
              description="Run an assessment to collect evidence. An empty workspace does not indicate a secure target."
              link={false}
            />
          )}
        </section>
        <section className="glass-card panel">
          <div className="section-heading">
            <h2>
              <Bot size={17} /> Engine status
            </h2>
            <span className="muted text-xs">Configured integrations</span>
          </div>
          <div className="engine-row">
            <div className="engine-icon">
              <Globe size={19} />
            </div>
            <div>
              <strong>Web assessment</strong>
              <p>HTTP · TLS · headers · cookies</p>
            </div>
            <StatusBadge status={error ? "failed" : "ready"} />
          </div>
          <div className="engine-row">
            <div className="engine-icon">
              <Terminal size={19} />
            </div>
            <div>
              <strong>Nmap discovery</strong>
              <p>{health?.nmap.version || "Checking installation…"}</p>
            </div>
            <StatusBadge
              status={
                !health
                  ? "pending"
                  : health.nmap.available
                    ? "ready"
                    : "unavailable"
              }
            />
          </div>
          <div className="engine-row">
            <div className="engine-icon">
              <Bot size={19} />
            </div>
            <div>
              <strong>AI analyst</strong>
              <p>
                {health?.ai.configured
                  ? health.ai.model
                  : "Add your OpenRouter key in .env"}
              </p>
            </div>
            <StatusBadge
              status={health?.ai.configured ? "configured" : "not configured"}
            />
          </div>
        </section>
        <section className="glass-card panel">
          <div className="section-heading">
            <h2>
              <Layers size={17} /> Exposure categories
            </h2>
            <span className="muted text-xs">Observed evidence</span>
          </div>
          {categories.length ? (
            <div className="category-grid">
              {categories.map((c) => (
                <div key={c}>
                  <span>{c}</span>
                  <strong>
                    {findings.filter((f) => f.category === c).length}
                  </strong>
                  <div className="bar-track">
                    <div
                      style={{
                        width: `${(findings.filter((f) => f.category === c).length / Math.max(1, findings.length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted py-8">
              Categories populate from actual scan observations.
            </p>
          )}
        </section>
        <section className="glass-card panel">
          <div className="section-heading">
            <h2>
              <Shield size={17} /> Severity distribution
            </h2>
          </div>
          <div className="severity-bars">
            {severityOrder.map((severity) => {
              const count = open.filter((f) => f.severity === severity).length;
              return (
                <div key={severity}>
                  <SeverityBadge severity={severity} />
                  <div className="bar-track">
                    <div
                      className={`bar-${severity}`}
                      style={{
                        width: `${(count / Math.max(1, open.length)) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
          <p className="chart-note">
            Hardening observations and potential exposures are separated by
            severity and confidence.
          </p>
        </section>
      </div>
    </div>
  );
}
