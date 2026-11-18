import { MongoClient, type Db } from "mongodb";

const cache = globalThis as unknown as { threatlensMongo?: Promise<Db> };
export async function database(): Promise<Db> {
  if (!cache.threatlensMongo) {
    const client = new MongoClient(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
      { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 },
    );
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
        throw new Error(
          "MongoDB unavailable. Check MONGODB_URI and ensure the database server is running.",
        );
      });
  }
  return cache.threatlensMongo;
}
