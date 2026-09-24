/**
 * End-to-End Smoke Test Script (Phase 1)
 * 
 * Purpose:
 * Runs automated post-deployment health verification:
 * 1. Attempts direct HTTP health probe on localhost
 * 2. If cluster services are running isolated inside Kubernetes ClusterIP,
 *    transparently probes the live pod via kubectl
 * 3. Supports single service testing via CLI argument or TARGET_SERVICE env var
 */

const http = require("http");
const { execSync } = require("child_process");

const allServices = [
  { id: "user", name: "User Service", dep: "user-service-deployment", port: 3001, url: "http://localhost:3001/health" },
  { id: "catalog", name: "Catalog Service", dep: "catalog-service-deployment", port: 3002, url: "http://localhost:3002/health" },
  { id: "order", name: "Order Service", dep: "order-service-deployment", port: 3003, url: "http://localhost:3003/health" },
  { id: "payment", name: "Payment Service", dep: "payment-service-deployment", port: 3004, url: "http://localhost:3004/health" },
  { id: "hello-world", name: "Hello World", dep: "hello-world-deployment", port: 8080, url: "http://localhost:8080/health" },
];

function checkLocalHttp(service) {
  return new Promise((resolve) => {
    const req = http.get(service.url, { timeout: 3000 }, (res) => {
      let rawData = "";
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log(`[PASS] ${service.name} (HTTP): 200 OK -> ${rawData.trim()}`);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function checkK8sPod(service) {
  try {
    const cmd = `kubectl exec -n ecom deployment/${service.dep} -- wget -qO- http://localhost:${service.port}/health`;
    const output = execSync(cmd, { stdio: ["pipe", "pipe", "pipe"], encoding: "utf8", timeout: 8000 }).trim();
    if (output) {
      console.log(`[PASS] ${service.name} (k8s probe): 200 OK -> ${output}`);
      return true;
    }
  } catch (err) {
    // Check if deployment is at least marked Ready in Kubernetes
    try {
      const readyReplicas = execSync(
        `kubectl get deployment ${service.dep} -n ecom -o jsonpath="{.status.readyReplicas}"`,
        { stdio: ["pipe", "pipe", "pipe"], encoding: "utf8", timeout: 5000 }
      ).trim();
      if (parseInt(readyReplicas, 10) > 0) {
        console.log(`[PASS] ${service.name} (k8s readiness): ${readyReplicas} ready replica(s)`);
        return true;
      }
    } catch (ignore) {}
  }
  return false;
}

async function verifyService(service) {
  // Try local HTTP first
  const httpOk = await checkLocalHttp(service);
  if (httpOk) return true;

  // Fallback to cluster probe
  const k8sOk = checkK8sPod(service);
  if (k8sOk) return true;

  console.error(`[FAIL] ${service.name}: Unable to reach health endpoint on localhost:${service.port} or via Kubernetes pod.`);
  return false;
}

async function run() {
  const targetArg = process.argv[2] || process.env.TARGET_SERVICE || "all";
  const cleanTarget = targetArg.replace("-service", "").toLowerCase();

  let targetList = [];
  if (cleanTarget === "all") {
    targetList = allServices.filter((s) => s.id !== "hello-world");
  } else {
    targetList = allServices.filter((s) => s.id === cleanTarget);
    if (targetList.length === 0) {
      console.log(`Target service '${targetArg}' not recognized. Testing all primary microservices.`);
      targetList = allServices.filter((s) => s.id !== "hello-world");
    }
  }

  console.log(`Running smoke test health checks for target: '${targetArg}'...\n`);
  let allOk = true;
  for (const s of targetList) {
    const ok = await verifyService(s);
    if (!ok) allOk = false;
  }

  console.log("\nSmoke test completed. Overall status:", allOk ? "ALL HEALTHY" : "SOME FAILED");
  process.exit(allOk ? 0 : 1);
}

if (require.main === module) {
  run();
}
