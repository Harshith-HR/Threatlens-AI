import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export function normalizeTarget(input: unknown): URL {
  if (
    typeof input !== "string" ||
    input.length > 2048 ||
    !input.trim() ||
    /[\s\\]/.test(input.trim())
  )
    throw new Error("Enter a valid HTTP(S) URL or hostname.");
  const url = new URL(
    input.includes("://") ? input.trim() : `https://${input.trim()}`,
  );
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !url.hostname ||
    url.hostname.startsWith("-")
  )
    throw new Error(
      "Only HTTP(S) targets without embedded credentials are supported.",
    );
  url.hash = "";
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (!isIP(hostname) && !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(hostname))
    throw new Error("Invalid hostname.");
  return url;
}
export function privateAddress(address: string): boolean {
  const ip = address.toLowerCase();
  if (ip.includes(":")) {
    if (ip.startsWith("::ffff:")) {
      const tail = ip.slice(7);
      if (tail.includes(".")) return privateAddress(tail);
      return true;
    }
    return !/^[23][0-9a-f]{3}:/.test(ip) || ip.startsWith("2001:db8:");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0)) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19))
  );
}
export async function resolveTarget(url: URL) {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const approved = (process.env.SCAN_ALLOWED_HOSTS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (approved.length && !approved.includes(hostname.toLowerCase()))
    throw new Error("Host is outside SCAN_ALLOWED_HOSTS.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await Promise.race([
        lookup(hostname, { all: true }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("DNS lookup timed out.")),
            5000,
          );
        }),
      ]).finally(() => {
        if (timer) clearTimeout(timer);
      });
  if (!addresses.length) throw new Error("Target DNS returned no addresses.");
  if (
    process.env.SCAN_ALLOW_PRIVATE !== "true" &&
    addresses.some((a) => privateAddress(a.address))
  )
    throw new Error(
      "Private targets are disabled. Enable SCAN_ALLOW_PRIVATE in .env for your local lab.",
    );
  return addresses.find((a) => a.family === 4) || addresses[0];
}
