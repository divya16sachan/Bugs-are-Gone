/**
 * Comprehensive Gateway & Frontend API E2E Verification
 */

const BASE_URL = "http://localhost:8000";

async function post(path, body, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function get(path, token = null) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const data = await res.json();
  return { status: res.status, data };
}

async function testWebsite() {
  console.log("=== VERIFYING WEBSITE & MICROSERVICES THROUGH GATEWAY ===");

  // 1. Gateway Health
  console.log("1. Checking Gateway Health...");
  const gwHealth = await get("/health");
  console.log("   Gateway Health:", gwHealth.status, gwHealth.data);
  if (gwHealth.status !== 200) throw new Error("Gateway unhealthy");

  // 2. Auth: Signup
  const email = `webuser_${Date.now()}@example.com`;
  const password = "StrongPassword123!";
  const name = "Website Test User";
  console.log(`2. Testing User Signup (${email})...`);
  const signup = await post("/api/v1/auth/signup", { email, password, name });
  console.log("   Signup Status:", signup.status, "User ID:", signup.data?.user?.id);
  const token = signup.data?.token;
  if (!token) throw new Error("No token returned on signup");

  // 3. Auth: Login
  console.log("3. Testing User Login...");
  const login = await post("/api/v1/auth/login", { email, password });
  console.log("   Login Status:", login.status);
  if (login.status !== 200) throw new Error("Login failed");

  // 4. User Profile
  console.log("4. Testing User Profile (/api/v1/users/me)...");
  const profile = await get("/api/v1/users/me", token);
  console.log("   Profile Status:", profile.status, "Email:", profile.data?.email);
  if (profile.status !== 200) throw new Error("Profile fetch failed");

  // 5. Products Catalog
  console.log("5. Testing Product Catalog (/api/v1/products)...");
  const catalog = await get("/api/v1/products?limit=6");
  console.log("   Catalog Status:", catalog.status, "Total Count:", catalog.data?.totalCount, "Items:", catalog.data?.products?.length);
  if (catalog.status !== 200 || !catalog.data?.products?.length) throw new Error("Catalog fetch failed");

  // 6. Product Search & Filter
  console.log("6. Testing Search & Filtering (search=Serum)...");
  const search = await get("/api/v1/products?search=Serum");
  console.log("   Search Status:", search.status, "Matches:", search.data?.totalCount, "First match:", search.data?.products?.[0]?.title);
  if (search.status !== 200) throw new Error("Search failed");

  // 7. Single Product Detail
  const firstProdId = catalog.data.products[0].id;
  console.log(`7. Testing Single Product Detail (/api/v1/products/${firstProdId})...`);
  const detail = await get(`/api/v1/products/${firstProdId}`);
  console.log("   Detail Status:", detail.status, "Title:", detail.data?.title, "Price: $" + detail.data?.price);
  if (detail.status !== 200) throw new Error("Product detail fetch failed");

  // 8. Place Order
  console.log("8. Testing Checkout / Order Placement...");
  const order = await post(
    "/api/v1/orders",
    {
      items: [{ productId: firstProdId, quantity: 1 }],
      shippingAddress: "123 E-Commerce Way, SRE Suite 404",
    },
    token
  );
  console.log("   Order Creation Status:", order.status, "Order ID:", order.data?.id, "Initial Status:", order.data?.status);
  const orderId = order.data?.id;
  if (!orderId) throw new Error("Order creation failed");

  // 9. RabbitMQ Async Payment Processing Poll
  console.log("9. Waiting for asynchronous payment processing via RabbitMQ...");
  let orderStatus = order.data?.status;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const check = await get(`/api/v1/orders/${orderId}`, token);
    orderStatus = check.data?.status;
    console.log(`   [Wait ${i + 1}s] Current Order Status:`, orderStatus);
    if (orderStatus === "COMPLETED" || orderStatus === "FAILED") break;
  }

  if (orderStatus !== "COMPLETED") {
    throw new Error(`Order did not complete. Final status: ${orderStatus}`);
  }
  console.log("   Order successfully processed to COMPLETED! ✅");

  // 10. Frontend SSR Pages check
  console.log("10. Testing Next.js Frontend Server Pages...");
  const pages = ["/", `/${firstProdId}`, "/login", "/register", "/docs"];
  for (const page of pages) {
    const res = await fetch(`http://localhost:3000${page}`);
    console.log(`   http://localhost:3000${page} -> Status ${res.status}`);
    if (res.status !== 200) throw new Error(`Page ${page} returned status ${res.status}`);
  }

  console.log("\n=========================================================");
  console.log("  ALL WEBSITE, GATEWAY & MICROSERVICES CHECKS PASSED!   ");
  console.log("=========================================================\n");
}

testWebsite().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
