"use client";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import type { Severity } from "@/lib/scan-types";
export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`severity severity-${severity}`}>
      <span />
      {severity}
    </span>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status status-${status}`}>
      <span />
      {status}
    </span>
  );
}
export function EmptyState({
  title = "Your workspace is ready",
  description = "Start an assessment to see evidence, coverage, and remediation here.",
  link = true,
}: {
  title?: string;
  description?: string;
  link?: boolean;
}) {
  return (
    <div className="empty-state">
      <ShieldCheck size={35} />
      <h3>{title}</h3>
      <p>{description}</p>
      {link && (
        <Link href="/offensive" className="button primary">
          Start assessment
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass-card metric">
      <div className="metric-top">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}
export const severityOrder: Severity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];
export const formatTime = (time: string) =>
  new Date(time).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
