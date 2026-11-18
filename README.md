# ThreatLens AI

A local security assessment workspace with real HTTP/Nmap scanning, optional OpenRouter analysis, persistent history, and evidence-based remediation. Existing dashboard, offensive, defensive, governance, and settings sections are retained.

## Start

Requirements: Node.js 22+ (tested on 24), npm, and Nmap on PATH for network scanning.

```powershell
npm install
# Only if .env does not already exist:
Copy-Item .env.example .env
npm run dev
```

Open http://localhost:3000. Start scripts bind to loopback by default. Production: `npm run build`, then `npm start`. Google fonts require network access during the build.

Use a persistent **single-process Node server** with MongoDB and an installed Nmap binary. Scan orchestration still requires one persistent app process. Stateless serverless hosting and multiple app instances are not supported.

## AI configuration

Edit the project-root `.env` and restart:

```dotenv
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openrouter/auto
```

The default router selects a model; set another current OpenRouter model ID if desired. Provider usage can incur charges. Scanning works without AI. The analyst summarizes collected evidence and recommends fixes; it cannot execute actions. At most 60 findings are sent, without raw page bodies or cookie values. Live AI-provider verification requires your key and credits; the configured key was successfully verified with HTTP 200.

## Environment

| Variable | Purpose |
| --- | --- |
| `NMAP_PATH` | Optional full path to Nmap, e.g. `C:\Program Files (x86)\Nmap\nmap.exe` |
| `SCAN_ALLOWED_HOSTS` | Optional exact comma-separated hostname/IP scope |
| `SCAN_ALLOW_PRIVATE` | `true` enables local/private lab targets; default false |
| `APP_ACCESS_TOKEN` | Long random workspace token protecting scan/settings/history/audit APIs |
| `MONGODB_URI` | MongoDB URI; default `mongodb://127.0.0.1:27017` |
| `MONGODB_DB` | Database name; default `threatlens` |
| `THREATLENS_DATA_DIR` | Legacy JSON directory used only for migration |

Set an access token before exposing the server beyond localhost; use HTTPS through a reverse proxy. Scan only systems you own or have permission to assess. Credentials, non-HTTP schemes, shell arguments, and CIDR ranges are rejected. DNS addresses are validated and pinned for HTTP requests. Cross-host redirects require scanning the destination explicitly.

## Features

- Live SSE with polling fallback; cancellation, timeout, two concurrent scans, partial results, restart recovery.
- Same-origin bounded crawling; HTTP/TLS, certificate expiry, security headers, cookies, mixed content, directory listing, CORS observations, and version disclosures.
- Web/full profiles check `.git/HEAD` and `.env` exposure using content signatures. Sensitive file contents are not stored.
- Real Nmap TCP service discovery, HTTP security-header scripts, certificate checks, TLS cipher enumeration, and SSH algorithm enumeration. TLS enumeration makes multiple connections.
- Evidence, affected URL, severity, confidence, CWE/OWASP mapping, impact, and remediation for each finding.
- Live dashboard metrics, history, JSON export, printing the current report view, manual triage, and persistent audit events.

| Profile | Coverage |
| --- | --- |
| Quick | One page; common TCP ports plus the URL's explicit port |
| Web Assessment | Configured page budget; two exposure probes; top 1,000 TCP ports and scripts |
| Full Port Scan | Configured pages and probes; all 65,535 TCP ports and scripts |
| Low-impact Recon | Up to three pages; top 100 TCP ports at slower timing |

Time budgets apply to the whole assessment, including AI. Full scans may require up to 900 seconds and can return partial coverage. Network discovery assesses the resolved host, possibly shared CDN infrastructure. Nmap HTTP/TLS scripts receive Host/SNI arguments.

## Coverage limits

No synthetic findings replace failures. Open ports are exposure observations, not proof of exploitation. Missing headers do not establish XSS; versions do not automatically imply CVEs.

SQL injection/XSS exploit validation, authenticated/business-logic testing, automatic source patches, remote firewall changes, continuous SIEM ingestion, and self-healing are not implemented. The original project vision in `docs/PROJECT_OBJECTIVES_AND_PLAN.md` remains a roadmap. Multi-user RBAC, immutable audit logs, and a learning knowledge graph are also outside the current implementation. Manual resolved status does not verify a fix; re-scan the target.

Storage uses MongoDB collections `scans`, `settings`, and `audit`, with indexed IDs and timestamps. Per-scan writes are serialized. The UI shows the latest 2,000 audit events; stored events are retained. Run `npm run db:migrate` to import legacy JSON without replacing existing MongoDB records or deleting files. Run `npm run check:integrations` to check MongoDB and make a tiny live OpenRouter request without printing secrets. Original unused demo components remain in source for reference; active routes use actual scan data.

## Verify

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Browser tests use Microsoft Edge and isolated localhost servers on ports 3100/45123. Screenshots go to ignored `test-results/`; tests use a separate timestamped MongoDB database. Build before running browser tests, which use a separate production server. Tests exercise authentication, settings, live results, redaction, triage, export, mobile layout, cancellation, SSE, and real Nmap discovery against the included fixture. Unit tests cover validation, scope, HTTP findings, exposure signatures, and XML handling.

Dependency updates address production advisories identified during implementation. Five remaining development-only advisories originate in `braces` through Next.js ESLint tooling; the suggested forced downgrade to Next 14 tooling was not applied.

## Source map

- `src/lib/scan-store.ts`: lifecycle, concurrency, live sessions
- `src/lib/web-scanner.ts`: HTTP transport and evidence checks
- `src/lib/nmap-scanner.ts`: fixed arguments, process lifecycle, XML parsing
- `src/lib/ai-analysis.ts`: server-side AI SDK/OpenRouter integration
- `src/lib/persistence.ts`: MongoDB persistence
- `src/app/api`: workspace APIs
- `src/components/dashboard/LiveDashboard.tsx`: actual scan overview
- `public/threat-network.png`: built-in imagegen background; full prompt in `public/threat-network.prompt.txt`

References: [OpenRouter Auto Router](https://openrouter.ai/openrouter/auto/overview), [Nmap timing](https://nmap.org/book/man-performance.html), [Nmap TLS enumeration](https://nmap.org/nsedoc/scripts/ssl-enum-ciphers.html).
