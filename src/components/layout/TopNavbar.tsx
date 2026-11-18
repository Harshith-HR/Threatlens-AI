"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronRight, RefreshCw, ScanLine } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
const titles: Record<string, string> = {
  "/": "Command Center",
  "/offensive": "Offensive Recon",
  "/defensive": "Defensive Telemetry",
  "/governance": "Governance Logs",
  "/settings": "Settings",
};
export default function TopNavbar() {
  const path = usePathname();
  const { health, error, refresh } = useWorkspace();
  return (
    <header className="workspace-topbar">
      <div className="breadcrumb">
        <span>Workspace</span>
        <ChevronRight size={13} />
        <strong>{titles[path] || "Assessment"}</strong>
      </div>
      <div className="topbar-actions">
        <span className={`connection ${error ? "offline" : ""}`}>
          <Activity size={13} />
          {error
            ? "Connection issue"
            : health
              ? "Workspace connected"
              : "Connecting"}
        </span>
        <button
          className="icon-button"
          aria-label="Refresh workspace"
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} />
        </button>
        <Link href="/offensive" className="button small">
          <ScanLine size={15} />
          <span>New scan</span>
        </Link>
      </div>
    </header>
  );
}
