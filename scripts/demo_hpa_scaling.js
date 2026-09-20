/**
 * Person D — HPA CPU Scaling Demonstration Script
 * 
 * Purpose:
 * Generates high-concurrency requests against target service to elevate CPU utilization,
 * triggering Kubernetes Horizontal Pod Autoscaler (HPA) to scale pods from 1 -> 5+ replicas.
 * 
 * Usage:
 * node scripts/demo_hpa_scaling.js [TARGET_URL] [CONCURRENCY] [DURATION_SECONDS]
 * e.g.:
 * node scripts/demo_hpa_scaling.js http://localhost:30001/health 50 60
 */

const http = require("http");

const targetUrl = process.argv[2] || "http://localhost:30001/health";
const concurrency = parseInt(process.argv[3] || "40", 10);
const durationSeconds = parseInt(process.argv[4] || "60", 10);

console.log("==========================================================");
console.log("🚀 Person D: HPA CPU Autoscaling Load Loop");
console.log(`Target:      ${targetUrl}`);
console.log(`Concurrency: ${concurrency} parallel workers`);
console.log(`Duration:    ${durationSeconds} seconds`);
console.log("==========================================================");
console.log("Tip: Run 'kubectl get hpa,pods -n ecom -w' in another terminal to observe scaling!\n");

let completedRequests = 0;
let failedRequests = 0;
let isRunning = true;

function sendRequest() {
  if (!isRunning) return;

  const req = http.get(targetUrl, (res) => {
    res.on("data", () => {});
    res.on("end", () => {
      completedRequests++;
      if (isRunning) setImmediate(sendRequest);
    });
  });

  req.on("error", () => {
    failedRequests++;
    if (isRunning) setTimeout(sendRequest, 100);
  });
}

// Start concurrent request workers
for (let i = 0; i < concurrency; i++) {
  sendRequest();
}

// Interval stats reporter
const statsInterval = setInterval(() => {
  console.log(`[Load Generator] Requests: ${completedRequests} completed | ${failedRequests} failed`);
}, 5000);

// Timer to stop load
setTimeout(() => {
  isRunning = false;
  clearInterval(statsInterval);
  console.log("\n==========================================================");
  console.log("✅ Load test completed.");
  console.log(`Total Requests Processed: ${completedRequests}`);
  console.log(`Total Failed Requests:   ${failedRequests}`);
  console.log("Check 'kubectl get hpa -n ecom' to verify replica expansion and cool-down.");
  console.log("==========================================================");
  process.exit(0);
}, durationSeconds * 1000);
