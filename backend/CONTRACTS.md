# E-Commerce SRE System — Frozen Contracts

> **CRITICAL NOTICE:** This document defines the frozen architectural contracts across all 4 microservices and supporting infrastructure. Services communicate strictly via these contracts. Do not alter schemas, endpoints, or event formats without cross-team consensus.

---

## 1. Ports Table

| Component | Container / Process Port | Host Port | Protocol | Purpose / URL |
|---|---|---|---|---|
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
| **Grafana** | `3000` | `3000` | HTTP | Metrics Visualization UI (`http://localhost:3000`) |
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
  ```json
  {
    "status": "ok",
    "service": "user-service",
    "timestamp": "2026-09-18T05:30:00.000Z",
    "checks": {
      "database": "ok"
    }
  }
  ```
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
- **Error Codes:** `400 Bad Request` (validation), `409 Conflict` (email exists)

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
- **Error Codes:** `401 Unauthorized`

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

---

### 3.3 Catalog Service (`http://localhost:3002`)

#### `GET /api/v1/products`
- **Query Params:** `?page=1&limit=20&category=electronics`
- **Response `200 OK`:**
  ```json
  {
    "products": [
      {
        "id": "prod_101",
        "name": "Noise-Cancelling Headphones",
        "description": "Premium wireless headphones",
        "price": 199.99,
        "stock": 45,
        "category": "electronics"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
  ```

#### `GET /api/v1/products/:id`
- **Response `200 OK`:**
  ```json
  {
    "id": "prod_101",
    "name": "Noise-Cancelling Headphones",
    "description": "Premium wireless headphones",
    "price": 199.99,
    "stock": 45,
    "category": "electronics"
  }
  ```
- **Error Codes:** `404 Not Found`

#### `POST /api/v1/products/reserve` (Internal Call from Order Service)
- **Request Body:**
  ```json
  {
    "orderId": "ord_555",
    "items": [
      { "productId": "prod_101", "quantity": 2 }
    ]
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "reserved": true,
    "reservationId": "res_888",
    "orderId": "ord_555"
  }
  ```
- **Error Codes:** `400 Bad Request` (insufficient stock), `404 Not Found`

---

### 3.4 Order Service (`http://localhost:3003`)

#### `POST /api/v1/orders`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "items": [
      { "productId": "prod_101", "quantity": 2 }
    ],
    "shippingAddress": "123 Main St, Springfield"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "orderId": "ord_555",
    "userId": "usr_123",
    "status": "PENDING_PAYMENT",
    "totalAmount": 399.98,
    "createdAt": "2026-09-18T05:30:00.000Z"
  }
  ```
- **Error Codes:** `400 Bad Request`, `401 Unauthorized`, `422 Unprocessable Entity` (stock unavailable)

#### `GET /api/v1/orders/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "orderId": "ord_555",
    "userId": "usr_123",
    "status": "COMPLETED",
    "totalAmount": 399.98,
    "items": [{ "productId": "prod_101", "quantity": 2, "unitPrice": 199.99 }]
  }
  ```
- **Error Codes:** `401 Unauthorized`, `404 Not Found`

---

### 3.5 Payment Service (`http://localhost:3004`)

#### `POST /api/v1/payments/process` (Internal / Synchronous fallback)
- **Request Body:**
  ```json
  {
    "orderId": "ord_555",
    "userId": "usr_123",
    "amount": 399.98,
    "paymentMethod": "credit_card"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "paymentId": "pay_999",
    "orderId": "ord_555",
    "status": "SUCCESS",
    "transactionReference": "tx_abc123"
  }
  ```
- **Error Codes:** `402 Payment Required` (declined / simulated fault)

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
| `PaymentFailed` | `payment.failed` | Payment Service | `order.payment_failed.queue`, `catalog.stock_release.queue` |
| `StockReleased` | `catalog.stock_released` | Catalog Service | `order.stock_released.queue` |

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
    "totalAmount": 399.98,
    "items": [
      { "productId": "prod_101", "quantity": 2, "unitPrice": 199.99 }
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
    "amount": 399.98,
    "status": "SUCCESS"
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
    "reason": "SIMULATED_TRANSACTION_FAILURE",
    "retryCount": 3
  }
}
```

---

## 5. Prometheus Metrics Specifications

### 5.1 Common RED Metrics (Exposed by all 4 services)
- `http_requests_total`: Counter tracking total incoming HTTP requests.
  - Labels: `service`, `method`, `route`, `status_code`
- `http_request_duration_seconds`: Histogram tracking HTTP request latency.
  - Labels: `service`, `method`, `route`, `status_code`
  - Buckets: `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]`

### 5.2 Service-Specific Metrics

#### User Service
- `user_signups_total`: Counter
- `user_logins_total`: Counter (`status="success|failure"`)

#### Catalog Service
- `catalog_cache_hits_total`: Counter
- `catalog_cache_misses_total`: Counter
- `catalog_stock_reservations_total`: Counter (`status="success|out_of_stock"`)

#### Order Service
- `orders_created_total`: Counter
- `order_processing_duration_seconds`: Histogram

#### Payment Service
- `payment_transactions_total`: Counter (`status="success|failed"`)
- `payment_queue_consumer_lag_seconds`: Histogram

#### Infrastructure Metrics (RabbitMQ)
- `rabbitmq_queue_messages`: Gauge (Queue depth / backlog for KEDA autoscaling demo)
- `rabbitmq_queue_messages_ready`: Gauge

---

## 6. Docker Image Naming Convention

- Format: `<dockerhub-user>/ecom-<service>:<git-sha>`
- Examples:
  - `divya16sachan/ecom-user:a1b2c3d`
  - `divya16sachan/ecom-catalog:a1b2c3d`
  - `divya16sachan/ecom-order:a1b2c3d`
  - `divya16sachan/ecom-payment:a1b2c3d`
