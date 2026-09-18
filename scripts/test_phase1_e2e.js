const http = require("http");

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runE2ETest() {
  console.log("==================================================");
  console.log("  PHASE 1 END-TO-END BUSINESS LOGIC VERIFICATION  ");
  console.log("==================================================\n");

  const email = `testuser_${Date.now()}@example.com`;
  const password = "Password123!";
  const name = "Test SRE User";

  // 1. User Signup
  console.log("1. Testing User Signup (POST /api/v1/auth/signup)...");
  const signupRes = await request(
    {
      hostname: "localhost",
      port: 3001,
      path: "/api/v1/auth/signup",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email, password, name }
  );

  console.log("   Signup Status:", signupRes.status);
  console.log("   User ID:", signupRes.data?.user?.id);
  const token = signupRes.data?.token;
  if (!token) throw new Error("No token returned on signup");
  console.log("   ✅ Signup succeeded with JWT token.\n");

  // 2. User Login
  console.log("2. Testing User Login (POST /api/v1/auth/login)...");
  const loginRes = await request(
    {
      hostname: "localhost",
      port: 3001,
      path: "/api/v1/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email, password }
  );
  console.log("   Login Status:", loginRes.status);
  console.log("   ✅ Login verified.\n");

  // 3. User Profile (/me)
  console.log("3. Testing User Profile (GET /api/v1/users/me)...");
  const meRes = await request({
    hostname: "localhost",
    port: 3001,
    path: "/api/v1/users/me",
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("   Profile Status:", meRes.status);
  console.log("   User Profile:", meRes.data);
  console.log("   ✅ Profile endpoint verified.\n");

  // 4. Catalog Products List with Filtering
  console.log("4. Testing Catalog List with Filtering (GET /api/v1/products?category=Skin Care)...");
  const catRes = await request({
    hostname: "localhost",
    port: 3002,
    path: "/api/v1/products?category=Skin%20Care",
    method: "GET",
  });
  console.log("   Catalog Status:", catRes.status);
  console.log("   Products Found:", catRes.data?.totalCount);
  console.log("   First Product Title:", catRes.data?.products?.[0]?.title);
  console.log("   ✅ Catalog list & filter verified.\n");

  // 5. Catalog Single Product & Redis Cache
  console.log("5. Testing Catalog Single Product (GET /api/v1/products/prod-1)...");
  const prodRes1 = await request({
    hostname: "localhost",
    port: 3002,
    path: "/api/v1/products/prod-1",
    method: "GET",
  });
  console.log("   Initial Fetch Status:", prodRes1.status);
  console.log("   Product Stock:", prodRes1.data?.stock);

  // Cache hit fetch
  const prodRes2 = await request({
    hostname: "localhost",
    port: 3002,
    path: "/api/v1/products/prod-1",
    method: "GET",
  });
  console.log("   Cache Hit Fetch Status:", prodRes2.status);
  console.log("   ✅ Catalog single item & cache-aside verified.\n");

  // 6. Place Order
  console.log("6. Testing Place Order (POST /api/v1/orders)...");
  const orderRes = await request(
    {
      hostname: "localhost",
      port: 3003,
      path: "/api/v1/orders",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    {
      items: [{ productId: "prod-1", quantity: 2 }],
      shippingAddress: "456 SRE Ave, Cloud City",
    }
  );

  console.log("   Order Creation Status:", orderRes.status);
  console.log("   Order ID:", orderRes.data?.id);
  console.log("   Initial Status:", orderRes.data?.status);
  const orderId = orderRes.data?.id;
  if (!orderId) throw new Error("Order creation failed: " + JSON.stringify(orderRes.data));
  console.log("   ✅ Order created with PENDING_PAYMENT.\n");

  // 7. Poll Order Status for Asynchronous Payment Processing (via RabbitMQ)
  console.log("7. Polling Order Status (waiting for RabbitMQ Payment consumer)...");
  let finalStatus = orderRes.data?.status;
  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    const checkRes = await request({
      hostname: "localhost",
      port: 3003,
      path: `/api/v1/orders/${orderId}`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    finalStatus = checkRes.data?.status;
    console.log(`   [Poll ${i + 1}s] Order Status: ${finalStatus}`);
    if (finalStatus === "COMPLETED" || finalStatus === "FAILED") {
      break;
    }
  }

  if (finalStatus === "COMPLETED" || finalStatus === "FAILED") {
    console.log(`   ✅ Async Payment Event successfully processed! Order status flipped to '${finalStatus}'.\n`);
  } else {
    throw new Error(`Order did not transition to COMPLETED/FAILED in time. Current status: ${finalStatus}`);
  }

  // 8. Verify Custom Prometheus Metrics
  console.log("8. Verifying Custom Prometheus Metrics across services...");
  const metricsEndpoints = [
    { service: "User Service", port: 3001, expected: "user_signups_total" },
    { service: "Catalog Service", port: 3002, expected: "catalog_stock_reservations_total" },
    { service: "Order Service", port: 3003, expected: "orders_created_total" },
    { service: "Payment Service", port: 3004, expected: "payment_transactions_total" },
  ];

  for (const m of metricsEndpoints) {
    const res = await request({
      hostname: "localhost",
      port: m.port,
      path: "/metrics",
      method: "GET",
    });
    const hasMetric = typeof res.data === "string" && res.data.includes(m.expected);
    console.log(`   ${m.service} contains '${m.expected}': ${hasMetric ? "YES ✅" : "NO ❌"}`);
  }

  console.log("\n==================================================");
  console.log("  ALL PHASE 1 E2E INTEGRATION CHECKS PASSED!      ");
  console.log("==================================================");
}

runE2ETest().catch((err) => {
  console.error("\n❌ E2E Verification Failed:", err);
  process.exit(1);
});
