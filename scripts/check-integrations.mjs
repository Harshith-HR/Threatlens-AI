import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { MongoClient } from "mongodb";
loadEnvConfig(process.cwd());
const client = new MongoClient(
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  { serverSelectionTimeoutMS: 5000 },
);
try {
  await client.connect();
  await client.db(process.env.MONGODB_DB || "threatlens").command({ ping: 1 });
  console.log("MongoDB: connected");
} catch {
  console.log("MongoDB: connection failed");
  process.exitCode = 1;
} finally {
  await client.close();
}
if (!process.env.OPENROUTER_API_KEY) {
  console.log("OpenRouter: key missing");
  process.exitCode = 1;
} else
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "openrouter/auto",
          messages: [{ role: "user", content: "Reply with exactly OK." }],
          max_tokens: 32,
        }),
        signal: AbortSignal.timeout(45000),
      },
    );
    const data = await response.json();
    console.log(
      JSON.stringify({
        integration: "OpenRouter",
        httpStatus: response.status,
        success: response.ok && Boolean(data.choices?.[0]?.message?.content),
        model: data.model || process.env.OPENROUTER_MODEL,
        errorCode: data.error?.code,
      }),
    );
    if (!response.ok) process.exitCode = 1;
  } catch {
    console.log("OpenRouter: network request failed or timed out");
    process.exitCode = 1;
  }
