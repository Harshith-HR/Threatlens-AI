import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";
import "./workspace.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ThreatLens AI — Security Assessment Workspace",
  description:
    "Real-time website and network assessment with evidence-backed findings, AI-assisted remediation, persistent scan history, and an auditable response workflow.",
  keywords: [
    "cybersecurity",
    "threat intelligence",
    "MITRE ATT&CK",
    "penetration testing",
    "incident response",
    "SIEM",
    "AI agents",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full bg-bg-primary text-text-primary font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
