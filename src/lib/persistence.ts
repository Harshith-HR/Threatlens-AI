import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { database } from "./mongodb";
import type { ScanSession, Settings, AuditEvent } from "./scan-types";

export const defaults: Settings = {
  defaultProfile: "vuln",
  maxPages: 8,
  timeoutSeconds: 180,
  nmapEnabled: true,
  aiEnabled: true,
};

// ---------------------------------------------------------------------------
// File-based fallback storage (used when MongoDB is unavailable)
// ---------------------------------------------------------------------------
const dataDir = () =>
  path.resolve(process.env.THREATLENS_DATA_DIR || ".data");

async function ensureDir() {
  await fs.mkdir(dataDir(), { recursive: true });
}

async function fileRead<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(dataDir(), file), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function fileWrite(file: string, data: unknown) {
  await ensureDir();
  await fs.writeFile(
    path.join(dataDir(), file),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export async function readSettings(): Promise<Settings> {
  const db = await database();
  if (db) {
    const record = await db
      .collection<{ id: string; value: Settings }>("settings")
      .findOne({ id: "workspace" });
    return { ...defaults, ...record?.value };
  }
  // File fallback
  const saved = await fileRead<Partial<Settings>>("settings.json", {});
  return { ...defaults, ...saved };
}

export async function saveSettings(settings: Settings) {
  const db = await database();
  if (db) {
    await db
      .collection("settings")
      .updateOne(
        { id: "workspace" },
        { $set: { value: settings } },
        { upsert: true },
      );
    return;
  }
  await fileWrite("settings.json", settings);
}

// ---------------------------------------------------------------------------
// Scans — serialize writes per scan ID to prevent concurrent overwrites
// ---------------------------------------------------------------------------
const queues = new Map<string, Promise<unknown>>();

export function saveScan(scan: ScanSession): Promise<void> {
  const snapshot = structuredClone(scan);
  const write = (queues.get(scan.id) || Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const db = await database();
      if (db) {
        await db
          .collection<ScanSession>("scans")
          .replaceOne({ id: snapshot.id }, snapshot, { upsert: true });
        return;
      }
      // File fallback: load full list, replace/insert, write back
      const all = await fileRead<ScanSession[]>("scans.json", []);
      const idx = all.findIndex((s) => s.id === snapshot.id);
      if (idx >= 0) all[idx] = snapshot;
      else all.unshift(snapshot);
      await fileWrite("scans.json", all);
    });
  queues.set(scan.id, write);
  void write
    .finally(() => {
      if (queues.get(scan.id) === write) queues.delete(scan.id);
    })
    .catch(() => {});
  return write;
}

export async function loadScans(): Promise<ScanSession[]> {
  const db = await database();
  if (db) {
    return db
      .collection<ScanSession>("scans")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  }
  return fileRead<ScanSession[]>("scans.json", []);
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------
export async function audit(action: string, detail: string, scanId?: string) {
  const event: AuditEvent = {
    id: randomUUID(),
    time: new Date().toISOString(),
    action,
    detail,
    scanId,
  };
  const db = await database();
  if (db) {
    await db.collection<AuditEvent>("audit").insertOne(event);
    return;
  }
  // File fallback
  const all = await fileRead<AuditEvent[]>("audit.json", []);
  all.unshift(event);
  if (all.length > 2000) all.splice(2000);
  await fileWrite("audit.json", all);
}

export async function readAudit(): Promise<AuditEvent[]> {
  const db = await database();
  if (db) {
    return db
      .collection<AuditEvent>("audit")
      .find({}, { projection: { _id: 0 } })
      .sort({ time: -1 })
      .limit(2000)
      .toArray();
  }
  return fileRead<AuditEvent[]>("audit.json", []);
}
