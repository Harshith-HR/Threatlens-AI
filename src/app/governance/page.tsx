"use client";
import { useEffect, useState } from "react";
import { BookOpen, FileCheck, Search, Shield, ScrollText } from "lucide-react";
import { api, useWorkspace } from "@/components/WorkspaceProvider";
import OwaspAgentPanel from "@/components/governance/OwaspAgentPanel";
import RbacPanel from "@/components/governance/RbacPanel";
import {
  PageIntro,
  Metric,
  EmptyState,
  formatTime,
} from "@/components/ui/WorkspaceUI";
import type { AuditEvent } from "@/lib/scan-types";
export default function GovernancePage() {
  const { scans } = useWorkspace();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"audit" | "owasp" | "rbac">("audit");
  useEffect(() => {
    let active = true;
    const load = () =>
      api<{ events: AuditEvent[] }>("/api/audit")
        .then((d) => {
          if (active) {
            setEvents(d.events);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    void load();
    const interval = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);
  const findings = scans.flatMap((s) => s.findings);
  const groups = [...new Set(findings.map((f) => f.owasp))];
  const visible = events.filter((e) =>
    `${e.action} ${e.detail}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="GOVERNANCE / TRACEABILITY"
        title="Every assessment, accounted for."
        description="A persistent record of scans, configuration changes, and analyst decisions."
      />
      <div className="metrics-grid">
        <Metric
          label="Audit events"
          value={events.length}
          detail="Latest 2,000 events retained"
          icon={<ScrollText size={18} />}
        />
        <Metric
          label="Assessments"
          value={scans.length}
          detail="Persisted scan records"
          icon={<FileCheck size={18} />}
        />
        <Metric
          label="OWASP categories"
          value={groups.length}
          detail="Mapped from recorded observations"
          icon={<BookOpen size={18} />}
        />
        <Metric
          label="Evidence records"
          value={findings.length}
          detail="Includes historical assessments"
          icon={<Shield size={18} />}
        />
      </div>
      {error && <p className="error-banner">{error}</p>}
      <nav className="workspace-tabs no-print" aria-label="Governance sections">
        {[
          { id: "audit", label: `Audit Trail (${events.length})` },
          { id: "owasp", label: "OWASP Agentic Safety" },
          { id: "rbac", label: "Access Roles (RBAC)" },
        ].map((t) => (
          <button
            key={t.id}
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id as "audit" | "owasp" | "rbac")}
            className={tab === t.id ? "active" : ""}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "audit" && (
        <>
          <section className="glass-card panel">
            <div className="section-heading">
              <h2>Audit trail</h2>
              <span className="muted text-xs">Most recent first</span>
            </div>
            <div className="search-field mb-4">
              <Search size={15} />
              <input
                aria-label="Search audit events"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events and targets…"
              />
            </div>
            {visible.length ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Details</th>
                      <th>Assessment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap">{formatTime(e.time)}</td>
                        <td>
                          <span className="audit-action">{e.action}</span>
                        </td>
                        <td>{e.detail}</td>
                        <td>
                          {e.scanId ? (
                            <a
                              className="text-link"
                              href={`/offensive?scan=${e.scanId}`}
                            >
                              View record ↗
                            </a>
                          ) : (
                            "Workspace"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No matching audit events"
                description="Starting scans, changing settings, and triaging findings creates audit records."
                link={false}
              />
            )}
          </section>
          <div className="dashboard-grid">
            <section className="glass-card panel">
              <h2>OWASP alignment</h2>
              <p className="chart-note">
                Mappings classify observations; they are not compliance
                certifications.
              </p>
              {groups.length ? (
                groups.map((group) => (
                  <div className="framework-row" key={group}>
                    <span>{group}</span>
                    <strong>
                      {findings.filter((f) => f.owasp === group).length}
                    </strong>
                  </div>
                ))
              ) : (
                <p className="muted py-6">Mappings appear after an assessment.</p>
              )}
            </section>
            <section className="glass-card panel">
              <h2>Control boundaries</h2>
              <div className="control-list">
                <p>
                  <Shield size={16} />
                  <span>
                    Workspace access token can protect every scan and settings API.
                  </span>
                </p>
                <p>
                  <Shield size={16} />
                  <span>
                    Target scope and private-network access are controlled by server
                    environment settings.
                  </span>
                </p>
                <p>
                  <Shield size={16} />
                  <span>
                    AI receives limited findings without cookie values and cannot
                    execute actions.
                  </span>
                </p>
                <p>
                  <Shield size={16} />
                  <span>
                    Audit records are stored in MongoDB with indexed IDs and timestamps.
                  </span>
                </p>
              </div>
            </section>
          </div>
        </>
      )}
      {tab === "owasp" && (
        <div className="space-y-6">
          <OwaspAgentPanel />
          <section className="glass-card panel">
            <h2>OWASP Category Breakdown from Target Scans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {groups.map((group) => (
                <div key={group} className="framework-row">
                  <span>{group}</span>
                  <strong>{findings.filter((f) => f.owasp === group).length} findings</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
      {tab === "rbac" && (
        <div className="space-y-6">
          <RbacPanel />
        </div>
      )}
    </div>
  );
}
