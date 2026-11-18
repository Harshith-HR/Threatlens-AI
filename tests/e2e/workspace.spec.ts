import { test, expect } from "@playwright/test";
const target = "http://127.0.0.1:45123";
test("workspace authentication, live scan, evidence, triage, report, and responsive UI", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  expect((await request.get("/api/scan")).status()).toBe(401);
  await page.goto("/");
  await page.getByLabel("Access token").fill("test-workspace-token");
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(
    page.getByRole("heading", { name: /See the exposure/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByLabel("Nmap network discovery").uncheck();
  await page.getByLabel("AI remediation analysis").uncheck();
  await page.getByLabel("Maximum linked pages").fill("3");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Settings saved");
  await page
    .getByRole("link", { name: "Offensive Recon", exact: true })
    .click();
  await page.getByLabel("Target website URL").fill(target);
  await page.getByRole("button", { name: "Launch Scan", exact: true }).click();
  await expect(
    page.getByText("Assessment finished", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByText("Page served over unencrypted HTTP").first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Page served over unencrypted HTTP/ })
    .first()
    .click();
  await expect(page.getByText("OBSERVED EVIDENCE / WEB")).toBeVisible();
  await page
    .getByLabel("Status for Page served over unencrypted HTTP")
    .first()
    .selectOption("reviewed");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("threatlens-scan-");
  const id = new URL(page.url()).searchParams.get("scan");
  expect(id).toBeTruthy();
  const result = await page.request.get(`/api/scan/${id}/results`);
  const scan = await result.json();
  expect(scan.status).toBe("complete");
  expect(scan.pages.length).toBe(3);
  expect(
    scan.findings.some(
      (f: { title: string }) => f.title === "Directory listing detected",
    ),
  ).toBeTruthy();
  expect(JSON.stringify(scan)).not.toContain("fixture-value-never-export");
  expect(
    scan.findings.some((f: { status: string }) => f.status === "reviewed"),
  ).toBeTruthy();
  await page.reload();
  await expect(
    page.getByText("Assessment finished", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/assessment-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Defensive Telemetry", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Turn findings into action." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Governance Logs", exact: true })
    .click();
  await expect(
    page.getByText("finding.update", { exact: true }).first(),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /See the exposure/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("API rejects invalid inputs, preserves running status, streams updates, and cancels", async ({
  request,
}) => {
  await request.post("/api/session", {
    data: { token: "test-workspace-token" },
  });
  expect(
    (
      await request.post("/api/scan", {
        data: { target: "file:///etc/passwd", profileId: "quick" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/scan", {
        data: { target, profileId: "invalid" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.put("/api/settings", {
        data: {
          defaultProfile: "vuln",
          maxPages: 1000,
          timeoutSeconds: 180,
          nmapEnabled: false,
          aiEnabled: false,
        },
      })
    ).status(),
  ).toBe(400);
  await request.put("/api/settings", {
    data: {
      defaultProfile: "vuln",
      maxPages: 3,
      timeoutSeconds: 30,
      nmapEnabled: false,
      aiEnabled: false,
    },
  });
  const scan = await (
    await request.post("/api/scan", {
      data: { target: `${target}/slow`, profileId: "quick" },
    })
  ).json();
  const running = await (
    await request.get(`/api/scan/${scan.id}/results`)
  ).json();
  expect(running.status).toBe("running");
  expect((await request.post(`/api/scan/${scan.id}/cancel`)).ok()).toBeTruthy();
  await expect
    .poll(
      async () =>
        (await (await request.get(`/api/scan/${scan.id}/results`)).json())
          .status,
    )
    .toBe("cancelled");
  const stream = await request.get(`/api/scan/${scan.id}/stream`);
  expect(stream.headers()["content-type"]).toContain("text/event-stream");
  expect(await stream.text()).toContain('"status":"cancelled"');
  expect((await request.get("/api/scan/not-found/results")).status()).toBe(404);
});
test("installed Nmap produces real localhost service evidence", async ({
  request,
}) => {
  await request.post("/api/session", {
    data: { token: "test-workspace-token" },
  });
  await request.put("/api/settings", {
    data: {
      defaultProfile: "quick",
      maxPages: 1,
      timeoutSeconds: 75,
      nmapEnabled: true,
      aiEnabled: false,
    },
  });
  const scan = await (
    await request.post("/api/scan", { data: { target, profileId: "quick" } })
  ).json();
  await expect
    .poll(
      async () =>
        (await (await request.get(`/api/scan/${scan.id}/results`)).json())
          .status,
      { timeout: 85000, intervals: [1000, 2000] },
    )
    .not.toBe("running");
  const result = await (
    await request.get(`/api/scan/${scan.id}/results`)
  ).json();
  expect(result.coverage[1].status, result.coverage[1].detail).toBe("complete");
  expect(
    result.result.ports.some(
      (p: { port: number; state: string }) =>
        p.port === 45123 && p.state === "open",
    ),
  ).toBeTruthy();
  expect(
    result.terminalStream.some((m: { content: string }) =>
      m.content.includes("synthetic"),
    ),
  ).toBeFalsy();
});
