"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ScanSession } from "@/lib/scan-types";
type Health = {
  database: { provider: string; connected: boolean; name: string };
  nmap: { available: boolean; version: string };
  ai: { configured: boolean; model: string };
  time: string;
};
type Workspace = {
  scans: ScanSession[];
  health: Health | null;
  error: string;
  loading: boolean;
  refresh: () => Promise<void>;
};
const Context = createContext<Workspace>({
  scans: [],
  health: null,
  error: "",
  loading: true,
  refresh: async () => {},
});
export const useWorkspace = () => useContext(Context);
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
export default function WorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scans, setScans] = useState<ScanSession[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const [data, status] = await Promise.all([
        api<{ scans: ScanSession[] }>("/api/scan"),
        api<Health>("/api/health"),
      ]);
      setScans(data.scans);
      setHealth(status);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load workspace");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 5000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [refresh]);
  return (
    <Context.Provider value={{ scans, health, error, loading, refresh }}>
      {children}
    </Context.Provider>
  );
}
