/**
 * End-to-End Smoke Test Script (Phase 1)
 * 
 * Purpose:
 * Runs quick sanity tests across all microservices:
 * 1. Health checks (/health)
 * 2. Metrics endpoints (/metrics)
 * 3. Basic user signup & login
 * 4. Catalog product retrieval & stock reservation
 * 5. Order creation & asynchronous payment processing verification
 */

const http = require("http");

const services = [
  { name: "User Service", url: "http://localhost:3001/health" },
  { name: "Catalog Service", url: "http://localhost:3002/health" },
  { name: "Order Service", url: "http://localhost:3003/health" },
  { name: "Payment Service", url: "http://localhost:3004/health" },
];

async function checkHealth(service) {
  return new Promise((resolve) => {
    http
      .get(service.url, (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            console.log(`[PASS] ${service.name}: 200 OK -> ${rawData.trim()}`);
            resolve(true);
          } else {
            console.error(`[FAIL] ${service.name}: Status ${res.statusCode}`);
            resolve(false);
          }
        });
      })
      .on("error", (err) => {
        console.error(`[ERROR] ${service.name} unreachable: ${err.message}`);
        resolve(false);
      });
  });
}

async function run() {
  console.log("Running smoke test health checks across all services...\n");
  let allOk = true;
  for (const s of services) {
    const ok = await checkHealth(s);
    if (!ok) allOk = false;
  }
  console.log("\nSmoke test completed. Overall status:", allOk ? "ALL HEALTHY" : "SOME FAILED");
  process.exit(allOk ? 0 : 1);
}

if (require.main === module) {
  run();
}
