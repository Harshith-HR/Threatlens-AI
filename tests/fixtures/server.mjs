import http from "node:http";
const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (req.url === "/slow") {
    setTimeout(() => {
      if (!res.destroyed) res.end("<title>Delayed page</title>");
    }, 20000);
    return;
  }
  if (req.url === "/redirect") {
    res.writeHead(302, { Location: "http://example.invalid/" });
    res.end();
    return;
  }
  if (req.url === "/directory") {
    res.end(
      "<html><title>Index of /files</title><body>Directory index</body></html>",
    );
    return;
  }
  if (req.url === "/secure") {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; frame-ancestors 'none'",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.end("<title>Hardened page</title>");
    return;
  }
  res.setHeader("Set-Cookie", "session=fixture-value-never-export; Path=/");
  res.setHeader("Server", "FixtureServer/1.2");
  res.end(
    '<html><title>ThreatLens test target</title><body><h1>Local scanner fixture</h1><a href="/secure">Secure page</a><a href="/directory">Files</a><a href="https://outside.invalid">External</a></body></html>',
  );
});
server.listen(45123, "127.0.0.1", () =>
  console.log("Fixture ready: http://127.0.0.1:45123"),
);
