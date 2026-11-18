"use client";
import { useState } from "react";
import { ChevronDown, Search, Copy, Check, ShieldAlert } from "lucide-react";
import { api } from "@/components/WorkspaceProvider";
import {
  EmptyState,
  SeverityBadge,
  severityOrder,
} from "@/components/ui/WorkspaceUI";
import type { Finding } from "@/lib/scan-types";
export default function FindingsExplorer({
  findings,
  scanId,
  onChange,
}: {
  findings: Finding[];
  scanId: string;
  onChange: () => void;
}) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const filtered = findings
    .filter(
      (f) =>
        (severity === "all" || f.severity === severity) &&
        `${f.title} ${f.url} ${f.evidence} ${f.cwe}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
    );
  return (
    <section className="glass-card panel findings-panel">
      <div className="section-heading">
        <h2>
          <ShieldAlert size={18} /> Findings & evidence{" "}
          <span className="count-pill">{findings.length}</span>
        </h2>
        <span className="muted text-xs">Select a finding to investigate</span>
      </div>
      <div className="filter-row">
        <div className="search-field">
          <Search size={15} />
          <input
            aria-label="Search findings"
            placeholder="Search findings, URLs, evidence…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="field compact"
          aria-label="Filter severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="all">All severities</option>
          {severityOrder.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {filtered.length ? (
        filtered.map((f) => (
          <article
            key={f.id}
            className={`finding-card ${expanded === f.id ? "expanded" : ""}`}
          >
            <button
              className="finding-toggle"
              aria-expanded={expanded === f.id}
              onClick={() => setExpanded(expanded === f.id ? null : f.id)}
            >
              <SeverityBadge severity={f.severity} />
              <div className="min-w-0 flex-1">
                <strong>{f.title}</strong>
                <p className="truncate">{f.url}</p>
              </div>
              <span className="finding-confidence">
                {f.confidence === "observed" ? "Observed" : "Needs review"}
              </span>
              <span className="finding-state">{f.status}</span>
              <ChevronDown size={16} />
            </button>
            {expanded === f.id && (
              <div className="finding-detail">
                <div className="evidence-block">
                  <p className="eyebrow">
                    OBSERVED EVIDENCE / {f.source.toUpperCase()}
                  </p>
                  <pre>{f.evidence}</pre>
                </div>
                <div className="detail-columns">
                  <div>
                    <h4>Why it matters</h4>
                    <p>{f.impact}</p>
                    <div className="tag-row">
                      <span>{f.cwe}</span>
                      <span>{f.owasp}</span>
                    </div>
                  </div>
                  <div>
                    <h4>Recommended remediation</h4>
                    <p>{f.remediation}</p>
                    <button
                      className="text-link mt-3"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(f.remediation);
                          setCopied(f.id);
                        } catch {
                          setError(
                            "Clipboard unavailable. Select the remediation text to copy it.",
                          );
                        }
                      }}
                    >
                      {copied === f.id ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}{" "}
                      {copied === f.id ? "Copied" : "Copy remediation"}
                    </button>
                  </div>
                </div>
                <div className="finding-footer">
                  <span className="muted text-xs">
                    Manual triage status · changes do not modify the target
                  </span>
                  <select
                    aria-label={`Status for ${f.title}`}
                    className="field compact"
                    value={f.status}
                    disabled={busy === f.id}
                    onChange={async (e) => {
                      setBusy(f.id);
                      try {
                        await api(`/api/scan/${scanId}/findings`, {
                          method: "PATCH",
                          body: JSON.stringify({
                            findingId: f.id,
                            status: e.target.value,
                          }),
                        });
                        setError("");
                        onChange();
                      } catch (err) {
                        setError(
                          err instanceof Error ? err.message : "Update failed",
                        );
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved by analyst</option>
                  </select>
                </div>
              </div>
            )}
          </article>
        ))
      ) : (
        <EmptyState
          title={
            findings.length
              ? "No matching observations"
              : "No observations recorded"
          }
          description={
            findings.length
              ? "Try another search or severity filter."
              : "Findings will appear as checks finish. Review assessment coverage before drawing conclusions."
          }
          link={false}
        />
      )}
    </section>
  );
}
