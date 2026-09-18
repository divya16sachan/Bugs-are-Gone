# E-Commerce SRE System — Frozen Contracts

> **CRITICAL NOTICE:** This document defines the frozen architectural contracts across all 4 microservices and supporting infrastructure. Services communicate strictly via these contracts.

---

## 1. Ports Table

| Component | Container / Process Port | Host Port | Protocol | Purpose / URL |
|---|---|---|---|---|
| **Frontend (Next.js)** | `3000` | `3000` | HTTP | Customer Web Storefront (`http://localhost:3000`) |
| **User Service** | `3001` | `3001` | HTTP | Auth & User Management API (`/health`, `/metrics`) |
| **Catalog Service** | `3002` | `3002` | HTTP | Product Catalog & Inventory API (`/health`, `/metrics`) |
| **Order Service** | `3003` | `3003` | HTTP | Order Processing & Checkout API (`/health`, `/metrics`) |
| **Payment Service** | `3004` | `3004` | HTTP | Payment & Webhook API (`/health`, `/metrics`) |
| **PostgreSQL 15** | `5432` | `5432` | TCP | Relational DB (Isolated databases per service) |
| **Redis 7** | `6379` | `6379` | RESP | Product Catalog Cache-aside layer |
| **RabbitMQ 3 (AMQP)** | `5672` | `5672` | AMQP 0-9-1 | Cross-service asynchronous message broker |
| **RabbitMQ Management** | `15672` | `15672` | HTTP | Broker Management UI (`http://localhost:15672`) |
| **RabbitMQ Prometheus** | `15692` | `15692` | HTTP | Native Prometheus metrics endpoint (`/metrics`) |
| **Prometheus** | `9090` | `9090` | HTTP | Time-series metrics server & UI (`http://localhost:9090`) |
| **Grafana** | `3000` | `3010` | HTTP | Metrics Visualization UI (`http://localhost:3010`) |
| **Alertmanager** | `9093` | `9093` | HTTP | Alert notification router UI (`http://localhost:9093`) |

---

## 2. Authentication & JWT Specification

- **Algorithm:** `HS256`
- **Environment Variable Name:** `JWT_SECRET`
- **Header:** `Authorization: Bearer <token>`
- **Token Payload Schema:**

```json
{
  "sub": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email": "alex@example.com",
  "iat": 1718000000,
  "exp": 1718086400
}
```

---

## 3. HTTP REST APIs

### 3.1 Common Conventions
- **Health Check:** `GET /health` → `200 OK` (or `503 Service Unavailable` on dependency failure)
- **Metrics:** `GET /metrics` → Prometheus text format exposition

---

### 3.2 User Service (`http://localhost:3001`)

#### `POST /api/v1/auth/signup`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "Alex Smith"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "user": { "id": "usr_123", "email": "user@example.com", "name": "Alex Smith" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Codes:** `400 Bad Request` (validation), `409 Conflict` (email already exists)

#### `POST /api/v1/auth/login`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "user": { "id": "usr_123", "email": "user@example.com", "name": "Alex Smith" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Codes:** `401 Unauthorized` (invalid credentials)

#### `GET /api/v1/users/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "Alex Smith",
    "createdAt": "2026-09-18T05:30:00.000Z"
  }
  ```
- **Error Codes:** `401 Unauthorized`

#### `GET /api/v1/users/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:** User profile if `:id === token.sub`.
- **Error Codes:** `401 Unauthorized`, `403 Forbidden` (if `:id` does not match token sub)

---

### 3.3 Catalog Service (`http://localhost:3002`)

#### Product Data Schema (ID-based, no slug)
```ts
Product {
  id: string;             // primary key & URL routing parameter: /[id]
  title: string;
  description: string;
  category: string;
  skinTypes: string[];    // Postgres native string array
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  imageUrl: string;
  stock: number;          // inStock derived on frontend as stock > 0
  isBestSeller: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### `GET /api/v1/products`
- **Query Params:** `?category=&categories=&skinType=&skinTypes=&minPrice=&maxPrice=&rating=&minRating=&promotion=&promotions=&isBestSeller=&isNewArrival=&isOnSale=&availability=&sortBy=&page=1&limit=12`
- **Response `200 OK`:**
  ```json
  {
    "products": [
      {
        "id": "prod-1",
        "title": "SilkSculpt Serum",
        "description": "Intensive botanical peptide serum...",
        "category": "Skin Care",
        "skinTypes": ["Combination", "Dry", "Normal"],
        "rating": 4.9,
        "reviewCount": 312,
        "price": 35.0,
        "originalPrice": 70.0,
        "discountPercent": 50,
        "imageUrl": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be...",
        "stock": 50,
        "isBestSeller": true,
        "isNewArrival": false,
        "isOnSale": true,
        "createdAt": "2026-09-18T05:30:00.000Z",
        "updatedAt": "2026-09-18T05:30:00.000Z"
      }
    ],
    "totalCount": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
  ```

#### `GET /api/v1/products/:id`
- **Response `200 OK`:** Full Product object.
- **Error Codes:** `404 Not Found`

#### `POST /api/v1/products/reserve` (Internal Call from Order Service)
- **Request Body:**
  ```json
  {
    "orderId": "ord_555",
    "items": [
      { "productId": "prod-1", "quantity": 2 }
    ]
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "reserved": true,
    "orderId": "ord_555",
    "items": [
      { "productId": "prod-1", "quantity": 2, "unitPrice": 35.0, "title": "SilkSculpt Serum" }
    ]
  }
  ```
- **Error Codes:** `400 Bad Request`, `404 Not Found`, `409 Conflict` (insufficient stock)

---

### 3.4 Order Service (`http://localhost:3003`)

#### Order Status Lifecycle
```
PENDING_PAYMENT ───(payment.processed)───> COMPLETED
       │
       └───────────(payment.failed)──────> FAILED
```
Allowed status values: `PENDING_PAYMENT`, `COMPLETED`, `FAILED`.

#### `POST /api/v1/orders`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body (Note: unitPrice is omitted; Order service fetches authoritative price from Catalog):**
  ```json
  {
    "items": [
      { "productId": "prod-1", "quantity": 2 }
    ],
    "shippingAddress": "123 Main St, Springfield"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "id": "ord_555",
    "userId": "usr_123",
    "status": "PENDING_PAYMENT",
    "totalAmount": 70.0,
    "shippingAddress": "123 Main St, Springfield",
    "items": [
      { "productId": "prod-1", "quantity": 2, "unitPrice": 35.0 }
    ],
    "createdAt": "2026-09-18T05:30:00.000Z"
  }
  ```
- **Error Codes:** `400 Bad Request`, `401 Unauthorized`, `409 Conflict` (insufficient stock)

#### `GET /api/v1/orders`
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `?page=1&limit=10`
- **Response `200 OK`:** Paginated array of the authenticated user's orders, sorted newest first.

#### `GET /api/v1/orders/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:** Order details including items.
- **Error Codes:** `401 Unauthorized`, `404 Not Found` (if order does not exist or belongs to another user)

---

### 3.5 Payment Service (`http://localhost:3004`)

#### `POST /api/v1/payments/process` (Synchronous fallback)
- **Request Body:**
  ```json
  {
    "orderId": "ord_555",
    "userId": "usr_123",
    "amount": 70.0
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "id": "pay_999",
    "orderId": "ord_555",
    "userId": "usr_123",
    "amount": 70.0,
    "status": "SUCCESS",
    "transactionReference": "tx_mock_123",
    "createdAt": "2026-09-18T05:30:00.000Z"
  }
  ```

---

## 4. RabbitMQ Event Contracts

### 4.1 Broker Configuration
- **Exchange:** `ecommerce` (Type: `topic`, Durable: `true`)
- **Dead-Letter Exchange (DLX):** `ecommerce.dlx` (Type: `topic`, Durable: `true`)
- **Dead-Letter Queue (DLQ):** `ecommerce.dead_letter_queue`

### 4.2 Events & Routing Keys

| Event Name | Routing Key | Publisher | Consumer Queue(s) |
|---|---|---|---|
| `OrderCreated` | `order.created` | Order Service | `payment.order_created.queue` |
| `PaymentProcessed` | `payment.processed` | Payment Service | `order.payment_processed.queue` |
| `PaymentFailed` | `payment.failed` | Payment Service | `order.payment_failed.queue` |

### 4.3 Event Payloads

#### `order.created`
```json
{
  "eventId": "evt_101",
  "eventType": "OrderCreated",
  "timestamp": "2026-09-18T05:30:00.000Z",
  "data": {
    "orderId": "ord_555",
    "userId": "usr_123",
    "totalAmount": 70.0,
    "items": [
      { "productId": "prod-1", "quantity": 2, "unitPrice": 35.0 }
    ]
  }
}
```

#### `payment.processed`
```json
{
  "eventId": "evt_102",
  "eventType": "PaymentProcessed",
  "timestamp": "2026-09-18T05:30:02.000Z",
  "data": {
    "paymentId": "pay_999",
    "orderId": "ord_555",
    "userId": "usr_123",
    "amount": 70.0,
    "status": "SUCCESS",
    "transactionReference": "tx_mock_123"
  }
}
```

#### `payment.failed`
```json
{
  "eventId": "evt_103",
  "eventType": "PaymentFailed",
  "timestamp": "2026-09-18T05:30:02.000Z",
  "data": {
    "orderId": "ord_555",
    "userId": "usr_123",
    "amount": 70.0,
    "reason": "SIMULATED_TRANSACTION_FAILURE"
  }
}
```

---

## 5. Prometheus Metrics Specifications

### 5.1 Common RED Metrics
- `http_requests_total{service, method, route, status_code}`
- `http_request_duration_seconds{service, method, route, status_code}`

### 5.2 Service-Specific Metrics
- **User Service:**
  - `user_signups_total` (Counter)
  - `user_logins_total{status="success|failure"}` (Counter)
- **Catalog Service:**
  - `catalog_cache_hits_total` (Counter)
  - `catalog_cache_misses_total` (Counter)
  - `catalog_stock_reservations_total{status="success|out_of_stock"}` (Counter)
- **Order Service:**
  - `orders_created_total` (Counter)
  - `order_processing_duration_seconds` (Histogram)
- **Payment Service:**
  - `payment_transactions_total{status="success|failed"}` (Counter)
  - `payment_queue_consumer_lag_seconds` (Histogram)
