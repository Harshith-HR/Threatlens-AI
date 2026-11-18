"use client";
import { useEffect, useState } from "react";
import { Bot, Check, KeyRound, Save, Settings2, Terminal } from "lucide-react";
import { api, useWorkspace } from "@/components/WorkspaceProvider";
import { PageIntro, StatusBadge } from "@/components/ui/WorkspaceUI";
import { scanProfiles } from "@/lib/offensive-data";
import type { Settings } from "@/lib/scan-types";
type Config = {
  settings: Settings;
  integrations: {
    openRouterConfigured: boolean;
    model: string;
    privateTargets: boolean;
    accessProtected: boolean;
    allowedHosts: string[];
  };
};
export default function SettingsPage() {
  const { health, refresh } = useWorkspace();
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Config>("/api/settings")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setConfig((prev) =>
      prev ? { ...prev, settings: { ...prev.settings, [key]: value } } : prev,
    );
    setSaved(false);
  };
  const save = async () => {
    if (!config) return;
    setBusy(true);
    try {
      await api("/api/settings", {
        method: "PUT",
        body: JSON.stringify(config.settings),
      });
      setSaved(true);
      setError("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="WORKSPACE / CONFIGURATION"
        title="Your tools. Your control."
        description="Configure assessment depth, execution limits, and optional AI analysis."
        action={
          <button
            className="button primary"
            disabled={!config || busy}
            onClick={save}
          >
            {saved ? <Check size={16} /> : <Save size={16} />}{" "}
            {busy ? "Saving…" : saved ? "Saved to workspace" : "Save changes"}
          </button>
        }
      />
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      {saved && (
        <p className="success-banner" role="status">
          Settings saved. New assessments will use this configuration.
        </p>
      )}
      {config && (
        <div className="settings-layout">
          <section className="glass-card panel">
            <h2>
              <Settings2 size={18} /> Assessment configuration
            </h2>
            <div className="setting-row">
              <label htmlFor="profile">
                <strong>Default scan profile</strong>
                <span>Preselected when opening a new assessment.</span>
              </label>
              <select
                id="profile"
                className="field"
                value={config.settings.defaultProfile}
                onChange={(e) =>
                  update(
                    "defaultProfile",
                    e.target.value as Settings["defaultProfile"],
                  )
                }
              >
                {scanProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="setting-row">
              <label htmlFor="max-pages">
                <strong>Maximum linked pages</strong>
                <span>
                  1–25 same-origin pages. Quick scans inspect one page.
                </span>
              </label>
              <input
                id="max-pages"
                type="number"
                min={1}
                max={25}
                className="field"
                value={config.settings.maxPages}
                onChange={(e) => update("maxPages", Number(e.target.value))}
              />
            </div>
            <div className="setting-row">
              <label htmlFor="timeout">
                <strong>Time budget (seconds)</strong>
                <span>
                  30–900 seconds. Use a larger budget for all-port scans.
                </span>
              </label>
              <input
                id="timeout"
                type="number"
                min={30}
                max={900}
                className="field"
                value={config.settings.timeoutSeconds}
                onChange={(e) =>
                  update("timeoutSeconds", Number(e.target.value))
                }
              />
            </div>
            <div className="setting-row">
              <label htmlFor="nmap">
                <strong>Nmap network discovery</strong>
                <span>Discover TCP services alongside web inspection.</span>
              </label>
              <input
                id="nmap"
                type="checkbox"
                className="toggle-check"
                checked={config.settings.nmapEnabled}
                onChange={(e) => update("nmapEnabled", e.target.checked)}
              />
            </div>
            <div className="setting-row">
              <label htmlFor="ai">
                <strong>AI remediation analysis</strong>
                <span>
                  Send a limited evidence summary to OpenRouter for analysis.
                </span>
              </label>
              <input
                id="ai"
                type="checkbox"
                className="toggle-check"
                checked={config.settings.aiEnabled}
                onChange={(e) => update("aiEnabled", e.target.checked)}
              />
            </div>
          </section>
          <div className="space-y-5">
            <section className="glass-card panel">
              <div className="section-heading">
                <h2>
                  <Bot size={18} /> OpenRouter
                </h2>
                <StatusBadge
                  status={
                    config.integrations.openRouterConfigured
                      ? "configured"
                      : "not configured"
                  }
                />
              </div>
              <p className="muted text-sm leading-6">
                Add your key to the project-root <code>.env</code> file, then
                restart the server. Keys stay on the server.
              </p>
              <pre className="config-code">
                OPENROUTER_API_KEY=your_key_here{"\n"}OPENROUTER_MODEL=
                {config.integrations.model}
              </pre>
              <p className="chart-note">
                The default auto router selects a model. You can set a specific
                OpenRouter model ID. Provider usage may incur charges.
              </p>
            </section>
            <section className="glass-card panel">
              <div className="section-heading">
                <h2>
                  <Terminal size={18} /> Nmap runtime
                </h2>
                <StatusBadge
                  status={health?.nmap.available ? "ready" : "unavailable"}
                />
              </div>
              <p className="muted text-sm">
                {health?.nmap.version || "Checking…"}
              </p>
              <p className="chart-note">
                Set NMAP_PATH if Nmap is not available on the server PATH.
                Network scans run on this machine.
              </p>
            </section>
            <section className="glass-card panel">
              <h2>
                <KeyRound size={18} /> Database & workspace scope
              </h2>
              <div className="framework-row">
                <span>MongoDB</span>
                <strong>
                  {health?.database?.connected
                    ? `Connected ? ${health.database.name}`
                    : "Unavailable"}
                </strong>
              </div>
              <div className="framework-row">
                <span>Access token</span>
                <strong>
                  {config.integrations.accessProtected
                    ? "Enabled"
                    : "Not configured"}
                </strong>
              </div>
              <div className="framework-row">
                <span>Private targets</span>
                <strong>
                  {config.integrations.privateTargets ? "Enabled" : "Disabled"}
                </strong>
              </div>
              <div className="framework-row">
                <span>Allowed hosts</span>
                <strong>
                  {config.integrations.allowedHosts.join(", ") ||
                    "Public hosts"}
                </strong>
              </div>
              <p className="chart-note">
                Configure APP_ACCESS_TOKEN, SCAN_ALLOWED_HOSTS, and
                SCAN_ALLOW_PRIVATE in .env. Scan only systems you own or have
                permission to assess.
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
