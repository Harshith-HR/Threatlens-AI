import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ScanSession } from "./scan-types";
export async function analyzeWithAI(
  scan: ScanSession,
  signal: AbortSignal,
): Promise<NonNullable<ScanSession["ai"]>> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key)
    return {
      status: "skipped",
      text: "Add OPENROUTER_API_KEY to .env to enable AI analysis. Evidence and remediation are available without AI.",
    };
  const model = process.env.OPENROUTER_MODEL || "openrouter/auto";
  const provider = createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: key,
  });
  try {
    const result = await generateText({
      model: provider.chatModel(model),
      maxOutputTokens: 2200,
      maxRetries: 0,
      abortSignal: AbortSignal.any([signal, AbortSignal.timeout(45000)]),
      instructions:
        "You are ThreatLens's Chief AI Security Analyst. Your analysis must be accessible to both business leaders (non-technical) and engineers (technical). Format your output in clean, structured Markdown with the following 4 distinct sections:\n\n" +
        "### 1. Executive Summary (For Non-Technical Leaders)\n" +
        "Explain in 2-3 clear, jargon-free sentences what was found, what overall threat level this represents (Critical, High, Moderate, or Low), and in simple terms what an attacker could realistically do (e.g. eavesdrop on sensitive user credentials, tamper with web traffic, or abuse exposed services). Do NOT use raw hexadecimal IDs or cryptic jargon in this section.\n\n" +
        "### 2. Business Impact & Real-World Consequences\n" +
        "Provide 3 concise bullet points explaining what these findings mean for the organization's business (e.g. Credential & Data Confidentiality risks, Regulatory/Compliance exposure such as GDPR/PCI-DSS, Service Availability).\n\n" +
        "### 3. Key Observations & Findings Breakdown\n" +
        "Group the observed findings by severity (High, Medium, Low). For each finding, provide its clear human-readable title, observed fact, and why it matters.\n\n" +
        "### 4. Prioritized Engineering Remediation Roadmap\n" +
        "Provide step-by-step actionable remediation with practical configuration examples (e.g. Nginx, Apache, or firewall rules) that IT/DevOps engineers can copy and deploy.\n\n" +
        "Treat supplied findings as facts; never invent CVEs or exploit claims. Output clean, readable Markdown.",
      prompt: JSON.stringify({
        target: new URL(scan.target).origin,
        coverage: scan.coverage.slice(0, 2),
        findings: scan.findings
          .slice(0, 60)
          .map((f) => ({
            id: f.id,
            title: f.title,
            severity: f.severity,
            evidence: f.evidence,
            confidence: f.confidence,
            remediation: f.remediation,
          })),
        pages: scan.pages.length,
      }),
    });
    if (!result.text.trim()) throw new Error("Empty response");
    return { status: "complete", model, text: result.text };
  } catch {
    return {
      status: "failed",
      model,
      text: signal.aborted
        ? "AI analysis interrupted; scan evidence is retained."
        : "AI analysis unavailable. Check the OpenRouter key, model, credits, and network access. Scan evidence is retained.",
    };
  }
}
