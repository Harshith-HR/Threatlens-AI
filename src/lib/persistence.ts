import { randomUUID } from "node:crypto";
import { database } from "./mongodb";
import type { ScanSession, Settings, AuditEvent } from "./scan-types";
export const defaults: Settings = {
  defaultProfile: "vuln",
  maxPages: 8,
  timeoutSeconds: 180,
  nmapEnabled: true,
  aiEnabled: true,
};
export async function readSettings(): Promise<Settings> {
  const record = await (
    await database()
  )
    .collection<{ id: string; value: Settings }>("settings")
    .findOne({ id: "workspace" });
  return { ...defaults, ...record?.value };
}
export async function saveSettings(settings: Settings) {
  await (
    await database()
  )
    .collection("settings")
    .updateOne(
      { id: "workspace" },
      { $set: { value: settings } },
      { upsert: true },
    );
}
// Serialize snapshots per scan so concurrent web/network updates cannot overwrite newer data.
const queues = new Map<string, Promise<unknown>>();
export function saveScan(scan: ScanSession): Promise<void> {
  const snapshot = structuredClone(scan);
  const write = (queues.get(scan.id) || Promise.resolve())
    .catch(() => {})
    .then(async () => {
      await (
        await database()
      )
        .collection<ScanSession>("scans")
        .replaceOne({ id: snapshot.id }, snapshot, { upsert: true });
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
  return (await database())
    .collection<ScanSession>("scans")
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
}
export async function audit(action: string, detail: string, scanId?: string) {
  await (
    await database()
  )
    .collection<AuditEvent>("audit")
    .insertOne({
      id: randomUUID(),
      time: new Date().toISOString(),
      action,
      detail,
      scanId,
    });
}
export async function readAudit(): Promise<AuditEvent[]> {
  return (await database())
    .collection<AuditEvent>("audit")
    .find({}, { projection: { _id: 0 } })
    .sort({ time: -1 })
    .limit(2000)
    .toArray();
}
