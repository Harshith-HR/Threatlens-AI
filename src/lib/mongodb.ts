import { MongoClient, type Db } from "mongodb";

const cache = globalThis as unknown as {
  threatlensMongo?: Promise<Db | null>;
};

/**
 * Returns the MongoDB Db handle, or null when MongoDB is not available.
 * Callers must handle the null case and fall back to file-based storage.
 */
export async function database(): Promise<Db | null> {
  if (!cache.threatlensMongo) {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 3000,
      maxPoolSize: 10,
    });
    cache.threatlensMongo = client
      .connect()
      .then(async () => {
        const db = client.db(process.env.MONGODB_DB || "threatlens");
        await Promise.all([
          db.collection("scans").createIndex({ id: 1 }, { unique: true }),
          db.collection("scans").createIndex({ createdAt: -1 }),
          db.collection("audit").createIndex({ id: 1 }, { unique: true }),
          db.collection("audit").createIndex({ time: -1 }),
        ]);
        return db;
      })
      .catch(async () => {
        cache.threatlensMongo = undefined;
        await client.close().catch(() => {});
        // Return null instead of throwing — callers use file-based fallback.
        return null;
      });
  }
  return cache.threatlensMongo;
}
