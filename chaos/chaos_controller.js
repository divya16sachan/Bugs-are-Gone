#!/usr/bin/env node
/**
 * Person B: Unified Chaos Engineering CLI Controller
 * Injects latency, synthetic errors, CPU spikes, pod crashes, and consumer freezes.
 */

import http from "http";

const SERVICE_PORTS = {
  user: 3001,
  catalog: 3002,
  order: 3003,
  payment: 3004,
};

function postJson(port, path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 5000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    req.write(payload);
    req.end();
  });
}

function getJson(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: "localhost",
        port,
        path,
        timeout: 3000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

async function getStatus() {
  console.log("\n================ Chaos & Health Status ================");
  for (const [name, port] of Object.entries(SERVICE_PORTS)) {
    try {
      const res = await getJson(port, "/chaos/config");
      const health = await getJson(port, "/health/liveness").catch(() => ({ status: "DOWN" }));
      console.log(`[${name.toUpperCase().padEnd(7)}] (Port ${port}) - Health: ${health.status === 200 ? "OK" : "DOWN"}`);
      console.log(`  Config: Latency=${res.body?.chaos?.injectLatencyMs || 0}ms | ErrorRate=${(res.body?.chaos?.injectErrorRate || 0) * 100}% | CPU=${res.body?.chaos?.cpuWork || "none"}`);
    } catch {
      console.log(`[${name.toUpperCase().padEnd(7)}] (Port ${port}) - Offline / Unreachable`);
    }
  }
  console.log("=======================================================\n");
}

async function injectLatency(service, ms) {
  const port = SERVICE_PORTS[service];
  if (!port) throw new Error(`Unknown service: ${service}. Available: ${Object.keys(SERVICE_PORTS).join(", ")}`);

  console.log(`Injecting ${ms}ms synthetic latency into ${service} service...`);
  const res = await postJson(port, "/chaos/inject", { injectLatencyMs: parseInt(ms, 10) });
  console.log("Response:", res.body);
}

async function injectError(service, rate) {
  const port = SERVICE_PORTS[service];
  if (!port) throw new Error(`Unknown service: ${service}. Available: ${Object.keys(SERVICE_PORTS).join(", ")}`);

  const errorRate = parseFloat(rate);
  console.log(`Injecting ${(errorRate * 100).toFixed(0)}% synthetic HTTP 500 error rate into ${service} service...`);
  const res = await postJson(port, "/chaos/inject", { injectErrorRate: errorRate });
  console.log("Response:", res.body);
}

async function burnCpu(service, level) {
  const port = SERVICE_PORTS[service];
  if (!port) throw new Error(`Unknown service: ${service}. Available: ${Object.keys(SERVICE_PORTS).join(", ")}`);

  const validLevels = ["none", "low", "medium", "high"];
  if (!validLevels.includes(level)) {
    throw new Error(`Invalid level: ${level}. Must be one of: ${validLevels.join(", ")}`);
  }

  console.log(`Setting CPU burn level to '${level}' in ${service} service...`);
  const res = await postJson(port, "/chaos/inject", { cpuWork: level });
  console.log("Response:", res.body);
}

async function resetAll(targetService) {
  const targets = targetService ? [targetService] : Object.keys(SERVICE_PORTS);
  console.log(`Resetting chaos configurations for: ${targets.join(", ")}...`);

  for (const name of targets) {
    const port = SERVICE_PORTS[name];
    if (!port) {
      console.warn(`Unknown service: ${name}`);
      continue;
    }
    try {
      const res = await postJson(port, "/chaos/reset", {});
      console.log(`  [${name}] Reset to baseline:`, res.body?.chaos);
    } catch (err) {
      console.log(`  [${name}] Failed to reset (service offline)`);
    }
  }
}

async function main() {
  const [command, arg1, arg2] = process.argv.slice(2);

  if (!command || command === "--help" || command === "help") {
    console.log(`
Person B Chaos Controller CLI
Usage: node chaos/chaos_controller.js <command> [arguments]

Commands:
  status                               View current chaos knobs & health for all services
  inject-latency <service> <ms>        Inject latency in milliseconds (e.g. catalog 350)
  inject-error <service> <rate>        Inject synthetic 500s (e.g. catalog 0.3 for 30% errors)
  burn-cpu <service> <level>           Trigger CPU burn: 'none' | 'low' | 'medium' | 'high'
  reset [service]                      Reset chaos injection back to 0 for all or one service

Services: user, catalog, order, payment
`);
    return;
  }

  switch (command) {
    case "status":
      await getStatus();
      break;
    case "inject-latency":
      if (!arg1 || !arg2) {
        console.error("Usage: node chaos/chaos_controller.js inject-latency <service> <ms>");
        process.exit(1);
      }
      await injectLatency(arg1, arg2);
      break;
    case "inject-error":
      if (!arg1 || !arg2) {
        console.error("Usage: node chaos/chaos_controller.js inject-error <service> <rate>");
        process.exit(1);
      }
      await injectError(arg1, arg2);
      break;
    case "burn-cpu":
      if (!arg1 || !arg2) {
        console.error("Usage: node chaos/chaos_controller.js burn-cpu <service> <low|medium|high|none>");
        process.exit(1);
      }
      await burnCpu(arg1, arg2);
      break;
    case "reset":
      await resetAll(arg1);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Chaos command failed:", err.message);
  process.exit(1);
});
