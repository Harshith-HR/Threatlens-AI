"use client";
import { useEffect, useState } from "react";
import { Shield, ArrowRight } from "lucide-react";
import { api } from "@/components/WorkspaceProvider";
export default function AccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ authorized: boolean }>("/api/session")
      .then((data) => setAllowed(data.authorized))
      .catch(() => setError("Unable to connect. Reload to retry."));
  }, []);
  if (allowed) return children;
  return (
    <div className="access-screen">
      <form
        className="glass-card access-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/api/session", {
              method: "POST",
              body: JSON.stringify({ token }),
            });
            setAllowed(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Sign-in failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Shield size={40} className="text-threat-green" />
        <p className="eyebrow">THREATLENS WORKSPACE</p>
        <h1>Security starts here.</h1>
        <p className="muted">
          {allowed === null
            ? "Connecting to your workspace…"
            : "Enter your workspace access token to continue."}
        </p>
        {allowed === false && (
          <>
            <label htmlFor="access-token">Access token</label>
            <input
              id="access-token"
              className="field"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button className="button primary" disabled={busy}>
              {busy ? "Signing in…" : "Open workspace"}
              <ArrowRight size={16} />
            </button>
          </>
        )}
        {error && (
          <p role="alert" className="error-banner">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
