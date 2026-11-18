import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { MongoClient } from "mongodb";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
loadEnvConfig(process.cwd());
const client = new MongoClient(
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  { serverSelectionTimeoutMS: 5000 },
);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "threatlens");
  const directory = path.resolve(process.env.THREATLENS_DATA_DIR || ".data");
  const files = await readdir(directory).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  let imported = 0;
  for (const file of files) {
    if (
      !/^scan-[a-f0-9-]+\.json$/.test(file) &&
      !["settings.json", "audit.json"].includes(file)
    )
      continue;
    const value = JSON.parse(
      await readFile(path.join(directory, file), "utf8"),
    );
    if (file === "settings.json")
      await db
        .collection("settings")
        .updateOne(
          { id: "workspace" },
          { $setOnInsert: { value } },
          { upsert: true },
        );
    else if (file === "audit.json") {
      for (const event of value)
        await db
          .collection("audit")
          .updateOne(
            { id: event.id },
            { $setOnInsert: event },
            { upsert: true },
          );
    } else {
      await db
        .collection("scans")
        .updateOne({ id: value.id }, { $setOnInsert: value }, { upsert: true });
      imported++;
    }
  }
  console.log(
    JSON.stringify({
      mongodb: "connected",
      database: db.databaseName,
      legacyScanFilesProcessed: imported,
      legacyFilesPreserved: true,
    }),
  );
} catch {
  console.error(
    "MongoDB migration failed. Check database configuration. No legacy files were deleted.",
  );
  process.exitCode = 1;
} finally {
  await client.close();
}
