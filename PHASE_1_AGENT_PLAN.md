# Phase 1 — Business Logic Implementation Plan (for Antigravity Agent)

> **Context for the agent:** Phase 0 (folder scaffolding, infra, stub health/metrics) is complete and verified. This phase implements REAL business logic in all 4 services so they work end-to-end with the existing `frontend/` Next.js app. Read this fully before writing code — several contract updates are required before implementation, listed first.

---

## 0. Setup Fix — Port Conflict (do this first)

Grafana currently runs on `3000` in `docker-compose.yml`, which collides with the frontend's default Next.js dev port. Fix by remapping Grafana:

```yaml
# docker-compose.yml
grafana:
  ports:
    - "3010:3000"   # was "3000:3000"
```

Update `monitoring/grafana` references and any docs mentioning `localhost:3000` for Grafana to `localhost:3010`. The frontend keeps `3000` for itself.

---

## 1. Contract Updates Required (update `backend/CONTRACTS.md` first, then implement)

The current contract was written before the frontend existed. It needs to change to match the frontend's actual data shape and pages. Make these changes to `CONTRACTS.md`, then build against the updated version — do not build against the old version.

**Routing decision: id-based, not slug-based.** No `slug` field exists anywhere in this system — products and users are both looked up by their internal `id`. This means the frontend's existing route folder `frontend/app/[slug]/` must be renamed to `frontend/app/[id]/`, and any internal links (`<Link href={\`/${product.slug}\`}>` etc.) must be updated to use `product.id` instead. This is a frontend-side change, not part of this backend plan, but flag it to whoever handles the frontend so routing doesn't break.

### 1.1 Catalog — Product schema (replaces the current minimal one)

```ts
Product {
  id: string            // used for both routing (/[id]) and Order service reservations — no slug
  title: string
  description: string
  category: string
  skinTypes: string[]
  rating: number
  reviewCount: number
  price: number
  originalPrice: number | null
  discountPercent: number | null
  imageUrl: string
  stock: number           // replaces boolean inStock — frontend derives inStock = stock > 0
  isBestSeller: boolean
  isNewArrival: boolean
  isOnSale: boolean
  createdAt: string
  updatedAt: string
}
```

### 1.2 Catalog — Endpoint changes
- `GET /api/v1/products` — add query params: `?category=&skinType=&isBestSeller=&isNewArrival=&isOnSale=&page=&limit=`
- `GET /api/v1/products/:id` — unchanged path, stays id-based (no slug). This same `id` is what Order uses for reservations, so there's no translation needed anywhere in the system.
- `POST /api/v1/products/reserve` — unchanged, keyed by internal `id` in the request body.

### 1.3 User — New endpoints (forgot-password flow)
```
POST /api/v1/auth/forgot-password
  body: { email }
  → always 200 (never reveal whether the email exists)
  → generates a reset token, stores its hash + expiry, and (since there's no email
    service in scope) logs the reset link to the console for manual testing:
    console.log(`Reset link: http://localhost:3000/reset-password?token=${rawToken}`)

POST /api/v1/auth/reset-password
  body: { token, newPassword }
  → 200 on success, 400/410 if token invalid or expired
```

### 1.4 User — Profile endpoint
```
GET /api/v1/users/:id
  headers: Authorization: Bearer <token>
  → 200 with profile if :id matches the authenticated user's own id
  → 403 otherwise (no public profiles in scope)
```

### 1.5 Order — New list endpoint (for the `/order` page)
```
GET /api/v1/orders
  headers: Authorization: Bearer <token>
  query: ?page=&limit=
  → 200, paginated list of the authenticated user's own orders, newest first
```
(`GET /api/v1/orders/:id` stays as-is for order detail.)

---

## 2. Per-Service Implementation

Work through services in this order: **Catalog → User → Order → Payment** (Catalog first since Order/Payment logically depend on product data existing, even though they're mocked during isolated dev).

### 2.1 Catalog Service

**Prisma schema** (`backend/services/catalog/prisma/schema.prisma`):
- `Product` model matching the schema in 1.1 exactly (use `String[]` for `skinTypes` — Postgres native array type via Prisma)

**Seed script:**
- Convert the frontend's `mock-products.ts` data into `backend/services/catalog/prisma/seed.ts` — reuse the same 15 products so frontend and backend show identical data during development. Drop the mock file's `slug` field entirely; let Prisma generate the `id` (uuid/cuid) for each seeded product, and update the frontend's product-rendering code to link/fetch by `product.id` instead of `product.slug`.
- Wire the seed script into `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`

**Endpoints:**
- `GET /api/v1/products` — list with filtering (category, skinType, isBestSeller, isNewArrival, isOnSale) + pagination. Cache the **unfiltered first page** in Redis (cache-aside); for filtered/paginated queries beyond page 1, hit Postgres directly for now (keep caching simple in Phase 1 — this is fine for a demo-scale catalog).
- `GET /api/v1/products/:id` — cache-aside per id (`product:<id>` key). Cache the full product object.
- `POST /api/v1/products/reserve` — accepts `{ orderId, items: [{ productId, quantity }] }`. In a transaction: check `stock >= quantity` for every item, decrement stock, return `409` (or the contract's `400`) with `{ error: "insufficient_stock" }` if any item fails. **Invalidate the relevant product's cache entry on every successful reserve.**

**Metrics:** wire real values into `catalog_cache_hits_total`, `catalog_cache_misses_total`, `catalog_stock_reservations_total{status}` (currently these exist as metric names from Phase 0 stubs — now emit them for real from the code paths above).

---

### 2.2 User Service

**Prisma schema:**
- `User { id, email (unique), passwordHash, name, createdAt, updatedAt }`
- `PasswordResetToken { id, userId, tokenHash, expiresAt, usedAt (nullable) }`

**Endpoints:**
- `POST /api/v1/auth/signup` — hash password with `bcrypt` (cost factor 10-12), create user, issue JWT (payload: `sub`, `email`, `iat`, `exp` per contract section 2), return `201`.
- `POST /api/v1/auth/login` — verify password with bcrypt compare, issue JWT, `401` on mismatch. Don't reveal whether the email exists vs. password is wrong — same generic `401` for both.
- `GET /api/v1/users/me` — decode JWT from `Authorization` header, return the user's own profile.
- `GET /api/v1/users/:id` — same as `/me` but validates `:id === decoded.sub`, else `403`.
- `POST /api/v1/auth/forgot-password` / `POST /api/v1/auth/reset-password` — per section 1.3. Generate the raw token with `crypto.randomBytes(32).toString('hex')`, store only its SHA-256 hash, set expiry to 1 hour.

**Metrics:** wire `user_signups_total`, `user_logins_total{status}` into the actual signup/login handlers.

---

### 2.3 Order Service

**Prisma schema:**
- `Order { id, userId, status, totalAmount, shippingAddress, createdAt, updatedAt }` — `status` as a Postgres enum: `PENDING_PAYMENT | PAID | FAILED | COMPLETED`
- `OrderItem { id, orderId, productId, quantity, unitPrice }`

**JWT validation:** verify tokens locally using the shared `JWT_SECRET` (no call to User service — this is the whole point of the shared-secret pattern from the contract).

**Mock Catalog dependency (Phase 1, until integration):**
- `src/mocks/catalog.mock.ts` — a `reserveStock(items)` function that always returns success. Toggle real vs. mock via `USE_MOCKS=true` in `.env`.

**Endpoints:**
- `POST /api/v1/orders` — validate JWT → call `reserveStock()` (mock or real, per env flag) → create `Order` (status `PENDING_PAYMENT`) + `OrderItem`s in a transaction → publish `order.created` event (section 4.3 of contract) → return `201`.
- `GET /api/v1/orders` — list current user's orders, paginated, newest first.
- `GET /api/v1/orders/:id` — single order detail, `404` if not found or not owned by the requesting user.

**Event consumer:**
- Consume `payment.processed` → set order status `PAID` (or `COMPLETED` if that's the intended final state — confirm which; the contract implies `PAID` then a later `COMPLETED` isn't otherwise triggered, so for Phase 1 simplify: `payment.processed` → `COMPLETED` directly).
- Consume `payment.failed` → set order status `FAILED`.

**Metrics:** wire `orders_created_total`, `order_processing_duration_seconds`.

---

### 2.4 Payment Service

**Prisma schema:**
- `Payment { id, orderId, userId, amount, status, transactionReference, createdAt }`

**Event consumer (the core async flow):**
- Consume `order.created` from `payment.order_created.queue`
- Simulate processing delay: `await sleep(randomBetween(1000, 5000))`
- Simulate ~10% random failure rate
- On success: create `Payment` record (`status: SUCCESS`), publish `payment.processed`
- On failure: create `Payment` record (`status: FAILED`), publish `payment.failed`

**Endpoint:**
- `POST /api/v1/payments/process` — synchronous fallback per contract section 3.5, same logic as the consumer but returns the result directly instead of publishing an event. Useful for manual testing without waiting on the queue.

**Metrics:** wire `payment_transactions_total{status}`, `payment_queue_consumer_lag_seconds`.

---

## 3. Cross-Cutting Concerns (apply to all 4 services)

### 3.1 Request validation
Use Fastify's built-in JSON schema validation on every route (this is real business logic, not a Phase 4 resilience concern — do this now). Reject malformed bodies with `400` before touching the database.

### 3.2 CORS
All 4 services need CORS enabled for the frontend origin (`http://localhost:3000`) — install `@fastify/cors` and register it in each `app.ts`, allowing credentials and the `Authorization` header.

### 3.3 Error handling
Use the existing `middleware/errorHandler.ts` stub from Phase 0 — now give it real logic: catch thrown errors, map known error types (validation, not-found, unauthorized) to correct HTTP status codes, log unexpected errors, never leak stack traces in the response body.

### 3.4 Resilience folders stay untouched
Do **not** implement real logic in `resilience/circuitBreaker.ts`, `retry.ts`, `timeout.ts`, or `chaos/inject.ts` yet — those are Phase 4. It's fine (and expected) for Order to call the mocked Catalog directly without a circuit breaker for now.

---

## 4. Frontend Integration Notes

- Frontend's `lib/api-client.ts` should point to each service's base URL via env vars, e.g.:
  ```
  NEXT_PUBLIC_USER_API_URL=http://localhost:3001/api/v1
  NEXT_PUBLIC_CATALOG_API_URL=http://localhost:3002/api/v1
  NEXT_PUBLIC_ORDER_API_URL=http://localhost:3003/api/v1
  ```
  (Payment is never called directly by the frontend — it's an internal/async service.)
- `frontend/app/_components/mock-products.ts` becomes unnecessary once Catalog is seeded with the same data — swap the frontend's data fetching from the mock file to real `fetch` calls against `NEXT_PUBLIC_CATALOG_API_URL`, but this swap is a frontend-side task, not part of this backend plan.

---

## 5. Build & Verify Order

1. Update `CONTRACTS.md` with section 1's changes
2. Catalog: Prisma schema → migration → seed script (from frontend mock data) → endpoints → Redis caching → metrics
3. User: Prisma schema → migration → signup/login → forgot/reset password → profile endpoints → metrics
4. Order: Prisma schema → migration → mock Catalog wired → POST/GET orders → RabbitMQ publish → metrics
5. Payment: Prisma schema → migration → RabbitMQ consumer → simulated processing → publish results → metrics
6. Manual end-to-end test via curl: signup → login → list products → place order → poll order status until it flips to `COMPLETED` or `FAILED` (via the async Payment flow)
7. Confirm all 4 services' `/metrics` now show non-zero values for their custom metrics (not just the RED metrics from Phase 0) after running the flow above a few times

## 6. Exit Criteria
- [ ] `CONTRACTS.md` updated and matches what's actually implemented
- [ ] All 4 Prisma schemas migrated successfully against their own Postgres databases
- [ ] Catalog seeded with the 15 products from the frontend's mock data, slugs matching exactly
- [ ] Full signup → login → order → async payment flow works end-to-end via curl/Postman
- [ ] CORS confirmed working from an actual frontend `fetch` call, not just curl
- [ ] Custom Prometheus metrics (not just RED metrics) show real, non-zero data after test traffic
- [ ] Order status correctly flips from `PENDING_PAYMENT` to `COMPLETED`/`FAILED` asynchronously, driven by the Payment service's RabbitMQ events — this is the core proof that the event-driven architecture actually works, not just the individual HTTP endpoints

Do not proceed to Phase 2 (Monitoring dashboards/alerts) until this checklist passes.
