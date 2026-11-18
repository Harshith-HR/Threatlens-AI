export interface ScanProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedDuration: string;
  intensity: "low" | "medium" | "high" | "stealth";
  techniques: string[];
}
export const scanProfiles: ScanProfile[] = [
  {
    id: "quick",
    name: "Quick Scan",
    description: "One page + common TCP ports and service detection",
    icon: "Zap",
    estimatedDuration: "30–90s",
    intensity: "low",
    techniques: ["HTTP/TLS", "Headers", "Common ports"],
  },
  {
    id: "vuln",
    name: "Web Assessment",
    description: "Linked pages + top 1,000 TCP ports and HTTP/TLS scripts",
    icon: "Bug",
    estimatedDuration: "1–3 min",
    intensity: "medium",
    techniques: ["Web hardening", "Cookies", "Service versions"],
  },
  {
    id: "full",
    name: "Full Port Scan",
    description: "Linked pages + all 65,535 TCP ports within the time budget",
    icon: "ScanLine",
    estimatedDuration: "3–15 min",
    intensity: "high",
    techniques: ["All TCP ports", "HTTP/TLS scripts", "Service discovery"],
  },
  {
    id: "stealth",
    name: "Low-impact Recon",
    description: "Up to 3 pages + top 100 TCP ports at slower timing",
    icon: "Eye",
    estimatedDuration: "1–5 min",
    intensity: "stealth",
    techniques: ["Limited crawl", "TCP connect", "Polite timing"],
  },
];
