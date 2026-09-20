#!/usr/bin/env node
/**
 * Person B: Multi-Service End-to-End User Journey Load Runner
 * Simulates concurrent shoppers executing full user journeys across all 4 microservices:
 * 1. User Service: Auth Signup & Login (JWT)
 * 2. User Service: Profile Verification (GET /users/me)
 * 3. Catalog Service: Catalog Listing (GET /products)
 * 4. Catalog Service: Single Product Cache-Aside Hit (GET /products/:id)
 * 5. Order Service: Transactional Order Creation (POST /orders)
 * 6. Payment Service: Async RabbitMQ Settlement -> Polling Order to COMPLETED
 */

import http from "http";
import fs from "fs";
import path from "path";
import { URL } from "url";

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    concurrency: 10,
    duration: 10, // seconds
    gatewayUrl: process.env.GATEWAY_URL || "http://127.0.0.1:8080",
    outputDir: "experiments/results",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--concurrency" && args[i + 1]) options.concurrency = parseInt(args[++i], 10);
    else if (arg === "--duration" && args[i + 1]) options.duration = parseInt(args[++i], 10);
    else if (arg === "--gateway" && args[i + 1]) options.gatewayUrl = args[++i];
    else if (arg === "--output" && args[i + 1]) options.outputDir = args[++i];
  }
  return options;
}

function calculatePercentile(latencies, percentile) {
  if (!latencies.length) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.min(
    Math.floor((percentile / 100) * sorted.length),
    sorted.length - 1
  );
  return Number(sorted[index].toFixed(2));
}

function makeRequest(parsedUrl, method, path, headers = {}, body = null, agent) {
  return new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    const reqHeaders = {
      Host: parsedUrl.host,
      Connection: "keep-alive",
      ...headers,
    };

    let bodyBuffer = null;
    if (body) {
      bodyBuffer = Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = bodyBuffer.length;
    }

    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path,
        method,
        headers: reqHeaders,
        agent,
        timeout: 10000,
      },
      (res) => {
        let responseData = "";
        res.on("data", (chunk) => (responseData += chunk));
        res.on("end", () => {
          const endTime = process.hrtime.bigint();
          const latencyMs = Number(endTime - startTime) / 1_000_000;
          let parsedJson = null;
          try {
            parsedJson = JSON.parse(responseData);
          } catch {
            parsedJson = responseData;
          }
          resolve({
            statusCode: res.statusCode,
            latencyMs,
            data: parsedJson,
            error: null,
          });
        });
      }
    );

    req.on("error", (err) => {
      const endTime = process.hrtime.bigint();
      resolve({
        statusCode: 0,
        latencyMs: Number(endTime - startTime) / 1_000_000,
        data: null,
        error: err.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      const endTime = process.hrtime.bigint();
      resolve({
        statusCode: 504,
        latencyMs: Number(endTime - startTime) / 1_000_000,
        data: null,
        error: "Timeout",
      });
    });

    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runWorker(workerId, options, agent, stats, stopSignal) {
  const parsedUrl = new URL(options.gatewayUrl);

  while (!stopSignal.stopped) {
    const journeyStart = process.hrtime.bigint();
    let journeySuccess = true;

    try {
      // 1. Auth Signup & Token
      const uniqueUser = `journey_${Date.now()}_${workerId}_${Math.floor(Math.random() * 100000)}@loadtest.local`;
      const signupRes = await makeRequest(
        parsedUrl,
        "POST",
        "/api/v1/auth/signup",
        {},
        { email: uniqueUser, password: "Password123!", name: `Worker ${workerId}` },
        agent
      );

      stats.userAuthLatencies.push(signupRes.latencyMs);
      if (signupRes.statusCode !== 201 || !signupRes.data?.accessToken) {
        stats.userErrors++;
        journeySuccess = false;
        continue;
      }
      stats.userSuccess++;
      const token = signupRes.data.accessToken;
      const authHeader = { Authorization: `Bearer ${token}` };

      // 2. Profile Verification
      const profileRes = await makeRequest(
        parsedUrl,
        "GET",
        "/api/v1/users/me",
        authHeader,
        null,
        agent
      );
      if (profileRes.statusCode === 200) stats.userSuccess++;
      else stats.userErrors++;

      // 3. Catalog Listing
      const catalogRes = await makeRequest(
        parsedUrl,
        "GET",
        "/api/v1/products",
        {},
        null,
        agent
      );
      stats.catalogLatencies.push(catalogRes.latencyMs);
      if (catalogRes.statusCode !== 200) {
        stats.catalogErrors++;
        journeySuccess = false;
        continue;
      }
      stats.catalogSuccess++;

      // 4. Catalog Single Product (Redis Cache-aside)
      const productRes = await makeRequest(
        parsedUrl,
        "GET",
        "/api/v1/products/prod-1",
        {},
        null,
        agent
      );
      stats.catalogLatencies.push(productRes.latencyMs);
      if (productRes.statusCode === 200) stats.catalogSuccess++;
      else stats.catalogErrors++;

      // 5. Order Creation (Transactional)
      const orderRes = await makeRequest(
        parsedUrl,
        "POST",
        "/api/v1/orders",
        authHeader,
        {
          items: [{ productId: "prod-1", quantity: 1 }],
          shippingAddress: "456 Load Test Ave, SRE City, CA",
        },
        agent
      );

      stats.orderLatencies.push(orderRes.latencyMs);
      if (orderRes.statusCode !== 201 || !orderRes.data?.id) {
        stats.orderErrors++;
        journeySuccess = false;
        continue;
      }
      stats.orderSuccess++;
      const orderId = orderRes.data.id;

      // 6. Payment Settlement Polling (Async RabbitMQ)
      let settled = false;
      const pollStart = Date.now();
      for (let poll = 0; poll < 25; poll++) {
        await sleep(200);
        const checkOrder = await makeRequest(
          parsedUrl,
          "GET",
          `/api/v1/orders/${orderId}`,
          authHeader,
          null,
          agent
        );
        if (checkOrder.statusCode === 200 && checkOrder.data?.status === "COMPLETED") {
          settled = true;
          stats.paymentSettlementTimes.push(Date.now() - pollStart);
          stats.paymentSuccess++;
          break;
        }
      }

      if (!settled) {
        stats.paymentErrors++;
        journeySuccess = false;
      }

      if (journeySuccess) {
        stats.completedJourneys++;
        const journeyEnd = process.hrtime.bigint();
        stats.journeyDurations.push(Number(journeyEnd - journeyStart) / 1_000_000);
      } else {
        stats.failedJourneys++;
      }
    } catch (err) {
      stats.failedJourneys++;
    }

    // Small inter-journey think time
    await sleep(50);
  }
}

async function main() {
  const options = parseArgs();

  console.log("\n" + "=".repeat(78));
  console.log(" 🌐 Person B: Multi-Service End-to-End User Journey Load Test");
  console.log("=".repeat(78));
  console.log(` Target Gateway  : ${options.gatewayUrl}`);
  console.log(` Concurrency     : ${options.concurrency} concurrent shopper journeys`);
  console.log(` Test Duration   : ${options.duration}s`);
  console.log(" Microservices   : User (3001), Catalog (3002), Order (3003), Payment (3004)");
  console.log(" Middleware      : Nginx (8080), PostgreSQL (5432), Redis (6379), RabbitMQ (5672)");
  console.log("=".repeat(78) + "\n");

  const agent = new http.Agent({
    keepAlive: true,
    maxSockets: options.concurrency * 4,
    timeout: 10000,
  });

  const stats = {
    userSuccess: 0,
    userErrors: 0,
    catalogSuccess: 0,
    catalogErrors: 0,
    orderSuccess: 0,
    orderErrors: 0,
    paymentSuccess: 0,
    paymentErrors: 0,
    completedJourneys: 0,
    failedJourneys: 0,
    userAuthLatencies: [],
    catalogLatencies: [],
    orderLatencies: [],
    paymentSettlementTimes: [],
    journeyDurations: [],
  };

  const stopSignal = { stopped: false };
  const workers = [];

  const startTime = Date.now();

  for (let i = 1; i <= options.concurrency; i++) {
    workers.push(runWorker(i, options, agent, stats, stopSignal));
  }

  // Timer for duration
  await sleep(options.duration * 1000);
  stopSignal.stopped = true;

  console.log("⏳ Test duration elapsed. Waiting for active journeys to drain...\n");
  await Promise.all(workers);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  const journeysPerSec = (stats.completedJourneys / totalTimeSec).toFixed(1);
  const totalApiCalls =
    stats.userSuccess +
    stats.userErrors +
    stats.catalogSuccess +
    stats.catalogErrors +
    stats.orderSuccess +
    stats.orderErrors;
  const totalRps = (totalApiCalls / totalTimeSec).toFixed(1);

  console.log("=".repeat(78));
  console.log(" 📊 MULTI-SERVICE JOURNEY BENCHMARK RESULTS");
  console.log("=".repeat(78));
  console.log(` Completed Journeys     : ${stats.completedJourneys} (${journeysPerSec} journeys/sec)`);
  console.log(` Failed Journeys        : ${stats.failedJourneys}`);
  console.log(` Total HTTP API Calls   : ${totalApiCalls} (${totalRps} req/sec aggregate)`);
  console.log("-".repeat(78));
  console.log(" SERVICE-BY-SERVICE BREAKDOWN:");
  console.log(`  👤 User Service       : ${stats.userSuccess} OK | ${stats.userErrors} Errors | Auth p50: ${calculatePercentile(stats.userAuthLatencies, 50)}ms | p95: ${calculatePercentile(stats.userAuthLatencies, 95)}ms | p99: ${calculatePercentile(stats.userAuthLatencies, 99)}ms`);
  console.log(`  📦 Catalog Service    : ${stats.catalogSuccess} OK | ${stats.catalogErrors} Errors | Read p50: ${calculatePercentile(stats.catalogLatencies, 50)}ms | p95: ${calculatePercentile(stats.catalogLatencies, 95)}ms | p99: ${calculatePercentile(stats.catalogLatencies, 99)}ms`);
  console.log(`  🛒 Order Service      : ${stats.orderSuccess} OK | ${stats.orderErrors} Errors | Write p50: ${calculatePercentile(stats.orderLatencies, 50)}ms | p95: ${calculatePercentile(stats.orderLatencies, 95)}ms | p99: ${calculatePercentile(stats.orderLatencies, 99)}ms`);
  console.log(`  💳 Payment / RabbitMQ : ${stats.paymentSuccess} Settled | ${stats.paymentErrors} Timeouts | Settle p50: ${calculatePercentile(stats.paymentSettlementTimes, 50)}ms | p95: ${calculatePercentile(stats.paymentSettlementTimes, 95)}ms`);
  console.log(`  ⏱️ Total Journey Time : p50: ${calculatePercentile(stats.journeyDurations, 50)}ms | p95: ${calculatePercentile(stats.journeyDurations, 95)}ms | p99: ${calculatePercentile(stats.journeyDurations, 99)}ms`);
  console.log("=".repeat(78));

  // Save report
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportDir = path.resolve(options.outputDir);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const reportPath = path.join(reportDir, `user_journey_${timestamp}.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        options,
        summary: {
          totalTimeSec,
          completedJourneys: stats.completedJourneys,
          failedJourneys: stats.failedJourneys,
          journeysPerSec: Number(journeysPerSec),
          totalApiCalls,
          totalRps: Number(totalRps),
        },
        services: {
          userService: {
            success: stats.userSuccess,
            errors: stats.userErrors,
            authLatency: {
              p50: calculatePercentile(stats.userAuthLatencies, 50),
              p95: calculatePercentile(stats.userAuthLatencies, 95),
              p99: calculatePercentile(stats.userAuthLatencies, 99),
            },
          },
          catalogService: {
            success: stats.catalogSuccess,
            errors: stats.catalogErrors,
            readLatency: {
              p50: calculatePercentile(stats.catalogLatencies, 50),
              p95: calculatePercentile(stats.catalogLatencies, 95),
              p99: calculatePercentile(stats.catalogLatencies, 99),
            },
          },
          orderService: {
            success: stats.orderSuccess,
            errors: stats.orderErrors,
            writeLatency: {
              p50: calculatePercentile(stats.orderLatencies, 50),
              p95: calculatePercentile(stats.orderLatencies, 95),
              p99: calculatePercentile(stats.orderLatencies, 99),
            },
          },
          paymentService: {
            settled: stats.paymentSuccess,
            timeouts: stats.paymentErrors,
            settlementTimeMs: {
              p50: calculatePercentile(stats.paymentSettlementTimes, 50),
              p95: calculatePercentile(stats.paymentSettlementTimes, 95),
              p99: calculatePercentile(stats.paymentSettlementTimes, 99),
            },
          },
        },
      },
      null,
      2
    )
  );

  console.log(`\n📁 Report Saved: ${reportPath}\n`);
}

main().catch(console.error);
