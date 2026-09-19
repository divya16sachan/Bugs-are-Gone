const http = require("http");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  const url = req.url;

  if (url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok", service: "hello-world", uptime: process.uptime() }));
  }

  if (url === "/load") {
    // Artificial CPU spin loop to trigger HPA scaling during tests
    const start = Date.now();
    while (Date.now() - start < 50) {
      Math.sqrt(Math.random() * 1000000);
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "computed_load", durationMs: Date.now() - start }));
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Hello from E-Commerce Platform!", timestamp: new Date().toISOString() }));
});

server.listen(PORT, () => {
  console.log(`hello-world service listening on port ${PORT}`);
});
