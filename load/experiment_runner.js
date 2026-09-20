#!/usr/bin/env node
/**
 * Person B: High-Performance Experiment & Load Runner
 * Ramps concurrency from 1 -> 1,000 workers, measuring RED metrics and latency percentiles.
 */

import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { URL } from "url";

// Parse CLI flags
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    stages: "1,10,50,100,250,500,1000",
    duration: 10,
    endpoint: "http://localhost:8080/api/v1/products",
    method: "GET",
    payload: null,
    name: "concurrency_experiment",
    outputDir: "experiments/results",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--stages" && args[i + 1]) options.stages = args[++i];
    else if (arg === "--duration" && args[i + 1]) options.duration = parseInt(args[++i], 10);
    else if (arg === "--concurrency" && args[i + 1]) options.stages = args[++i];
    else if (arg === "--endpoint" && args[i + 1]) options.endpoint = args[++i];
    else if (arg === "--method" && args[i + 1]) options.method = args[++i].toUpperCase();
    else if (arg === "--payload" && args[i + 1]) options.payload = args[++i];
    else if (arg === "--name" && args[i + 1]) options.name = args[++i];
    else if (arg === "--output" && args[i + 1]) options.outputDir = args[++i];
    else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: node load/experiment_runner.js [options]

Options:
  --stages <list>       Comma-separated concurrency stages (default: 1,10,50,100,250,500,1000)
  --concurrency <num>   Single fixed concurrency target
  --duration <sec>      Duration per stage in seconds (default: 10)
  --endpoint <url>      Target API endpoint (default: http://localhost:8080/api/v1/products)
  --method <GET|POST>   HTTP method (default: GET)
  --payload <json>      JSON payload for POST requests
  --name <string>       Experiment name for reports (default: concurrency_experiment)
  --output <dir>        Directory to store JSON/CSV reports (default: experiments/results)
`);
      process.exit(0);
    }
  }

  return options;
}

// Calculate percentiles
function calculatePercentile(latencies, percentile) {
  if (!latencies.length) return 0;
  const index = Math.min(
    Math.floor((percentile / 100) * latencies.length),
    latencies.length - 1
  );
  return latencies[index];
}

async function runWorkerStage(options, targetConcurrency, durationSeconds) {
  const parsedUrl = new URL(options.endpoint);
  const isHttps = parsedUrl.protocol === "https:";
  const agentClass = isHttps ? https.Agent : http.Agent;
  const requestFn = isHttps ? https.request : http.request;

  const agent = new agentClass({
    keepAlive: true,
    maxSockets: targetConcurrency * 2,
    timeout: 10000,
  });

  const latencies = [];
  let successCount = 0;
  let clientErrorCount = 0;
  let serverErrorCount = 0;
  let networkErrorCount = 0;

  const payloadBuffer = options.payload ? Buffer.from(options.payload) : null;
  const reqHeaders = {
    Host: parsedUrl.host,
    Accept: "application/json",
    Connection: "keep-alive",
  };
  if (payloadBuffer) {
    reqHeaders["Content-Type"] = "application/json";
    reqHeaders["Content-Length"] = payloadBuffer.length;
  }

  let stopRequested = false;
  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;

  function doRequest() {
    return new Promise((resolve) => {
      const reqStart = process.hrtime.bigint();
      const req = requestFn(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: options.method,
          headers: reqHeaders,
          agent,
          timeout: 8000,
        },
        (res) => {
          res.on("data", () => {});
          res.on("end", () => {
            const reqEnd = process.hrtime.bigint();
            const latencyMs = Number(reqEnd - reqStart) / 1_000_000;
            latencies.push(latencyMs);

            if (res.statusCode >= 200 && res.statusCode < 300) {
              successCount++;
            } else if (res.statusCode >= 400 && res.statusCode < 500) {
              clientErrorCount++;
            } else {
              serverErrorCount++;
            }
            resolve();
          });
        }
      );

      req.on("error", () => {
        networkErrorCount++;
        resolve();
      });

      req.on("timeout", () => {
        networkErrorCount++;
        req.destroy();
        resolve();
      });

      if (payloadBuffer) {
        req.write(payloadBuffer);
      }
      req.end();
    });
  }

  async function workerLoop() {
    while (!stopRequested && Date.now() < endTime) {
      await doRequest();
    }
  }

  // Launch workers
  const workers = [];
  for (let i = 0; i < targetConcurrency; i++) {
    workers.push(workerLoop());
  }

  await Promise.all(workers);
  agent.destroy();

  const totalTimeSeconds = (Date.now() - startTime) / 1000;
  const totalRequests = successCount + clientErrorCount + serverErrorCount + networkErrorCount;
  const rps = totalTimeSeconds > 0 ? (totalRequests / totalTimeSeconds).toFixed(1) : 0;

  latencies.sort((a, b) => a - b);
  const p50 = calculatePercentile(latencies, 50).toFixed(2);
  const p90 = calculatePercentile(latencies, 90).toFixed(2);
  const p95 = calculatePercentile(latencies, 95).toFixed(2);
  const p99 = calculatePercentile(latencies, 99).toFixed(2);
  const avg = (latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)).toFixed(2);
  const errorRate = totalRequests > 0 ? (((serverErrorCount + networkErrorCount) / totalRequests) * 100).toFixed(2) : "0.00";

  return {
    concurrency: targetConcurrency,
    durationSeconds: totalTimeSeconds.toFixed(1),
    totalRequests,
    successCount,
    errorCount: serverErrorCount + networkErrorCount,
    clientErrorCount,
    rps: parseFloat(rps),
    errorRatePercent: parseFloat(errorRate),
    latency: {
      avg: parseFloat(avg),
      p50: parseFloat(p50),
      p90: parseFloat(p90),
      p95: parseFloat(p95),
      p99: parseFloat(p99),
      min: latencies.length ? latencies[0].toFixed(2) : 0,
      max: latencies.length ? latencies[latencies.length - 1].toFixed(2) : 0,
    },
  };
}

async function main() {
  const options = parseArgs();
  const stages = options.stages.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));

  console.log("\n" + "=".repeat(78));
  console.log(" 🚀 Person B: High-Concurrency Load Experiment Runner");
  console.log("=".repeat(78));
  console.log(` Target Endpoint : ${options.endpoint}`);
  console.log(` HTTP Method     : ${options.method}`);
  console.log(` Stage Duration  : ${options.duration}s per concurrency tier`);
  console.log(` Stages Plan     : ${stages.join(" -> ")} concurrent virtual connections`);
  console.log("=".repeat(78) + "\n");

  const results = [];

  // Table header
  console.log(
    "| Concurrency | Total Req |   RPS   | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Errors (%) |"
  );
  console.log(
    "|-------------|-----------|---------|----------|----------|----------|----------|------------|"
  );

  for (const concurrency of stages) {
    const stageResult = await runWorkerStage(options, concurrency, options.duration);
    results.push(stageResult);

    console.log(
      `| ${String(stageResult.concurrency).padEnd(11)} | ` +
      `${String(stageResult.totalRequests).padEnd(9)} | ` +
      `${String(stageResult.rps).padEnd(7)} | ` +
      `${String(stageResult.latency.p50).padEnd(8)} | ` +
      `${String(stageResult.latency.p90).padEnd(8)} | ` +
      `${String(stageResult.latency.p95).padEnd(8)} | ` +
      `${String(stageResult.latency.p99).padEnd(8)} | ` +
      `${String(stageResult.errorRatePercent + "%").padEnd(10)} |`
    );
  }

  console.log("=".repeat(78));

  // Knee analysis
  let kneeDetected = null;
  for (let i = 1; i < results.length; i++) {
    const prev = results[i - 1];
    const curr = results[i];
    // Knee detected if latency increases by > 150% or error rate jumps above 2%
    if (curr.latency.p95 > prev.latency.p95 * 2.5 || curr.errorRatePercent > 2.0) {
      kneeDetected = {
        from: prev.concurrency,
        to: curr.concurrency,
        latencyIncrease: (curr.latency.p95 / (prev.latency.p95 || 1)).toFixed(1) + "x",
        errorRate: curr.errorRatePercent + "%",
      };
      break;
    }
  }

  if (kneeDetected) {
    console.log(`\n⚠️  [Scaling Knee Detected]: Capacity saturation observed between ${kneeDetected.from} -> ${kneeDetected.to} concurrency.`);
    console.log(`    Latency grew ${kneeDetected.latencyIncrease}, error rate reached ${kneeDetected.errorRate}.`);
    console.log(`    Recommendation: Trigger HPA horizontal pod scaling or adjust CPU/Memory requests.`);
  } else {
    console.log(`\n✅  [Linear Scaling Maintained]: Handled up to ${stages[stages.length - 1]} concurrency without saturation knee.`);
  }

  // Ensure output directory exists
  const absOutputDir = path.resolve(process.cwd(), options.outputDir);
  if (!fs.existsSync(absOutputDir)) {
    fs.mkdirSync(absOutputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(absOutputDir, `${options.name}_${timestamp}.json`);
  const csvPath = path.join(absOutputDir, `${options.name}_${timestamp}.csv`);

  // Write JSON
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        experiment: options.name,
        timestamp: new Date().toISOString(),
        options,
        kneeAnalysis: kneeDetected,
        stages: results,
      },
      null,
      2
    )
  );

  // Write CSV
  const csvRows = [
    "concurrency,durationSeconds,totalRequests,rps,p50_ms,p90_ms,p95_ms,p99_ms,errorRatePercent",
    ...results.map(
      (r) =>
        `${r.concurrency},${r.durationSeconds},${r.totalRequests},${r.rps},${r.latency.p50},${r.latency.p90},${r.latency.p95},${r.latency.p99},${r.errorRatePercent}`
    ),
  ];
  fs.writeFileSync(csvPath, csvRows.join("\n"));

  console.log(`\n📊 Reports Generated:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   CSV : ${csvPath}\n`);
}

main().catch((err) => {
  console.error("Experiment failed:", err);
  process.exit(1);
});
