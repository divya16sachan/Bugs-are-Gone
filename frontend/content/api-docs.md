# E-Commerce Microservices API Documentation

Welcome to the **E-Commerce SRE & Microservices Platform** API documentation. All backend microservices are accessible either directly on their dedicated ports or through the unified **Nginx API Gateway** on port `8080`.

---

## Architecture & Gateway Overview

All client frontend requests route through the centralized API Gateway:

- **Gateway Base URL:** `http://localhost:8080`
- **Authentication Scheme:** `Authorization: Bearer <JWT_TOKEN>`
- **Response Format:** `application/json`

### Service Ports Table

| Service | Host Port | Gateway Route Prefix | Description |
| :--- | :--- | :--- | :--- |
| **User Service** | `3001` | `/api/v1/auth`, `/api/v1/users` | Authentication & User Profiles |
| **Catalog Service** | `3002` | `/api/v1/products` | Product Inventory, Filtering & Caching |
| **Order Service** | `3003` | `/api/v1/orders` | Checkout, Order Processing & Lifecycle |
| **Payment Service** | `3004` | `/api/v1/payments` | Payment Transactions & Webhooks |

---

## 1. User & Authentication Service

The User Service handles customer registration, credential verification, JWT generation, and profile management.

### Register User
Creates a new customer account and returns a signed JWT access token.

- **Endpoint:** `POST /api/v1/auth/signup`
- **Auth:** Public
- **Content-Type:** `application/json`

#### Request Body
```json
{
  "name": "Divya Sachan",
  "email": "divya@example.com",
  "password": "SecurePassword123!"
}
```

#### Response `201 Created`
```json
{
  "user": {
    "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "divya@example.com",
    "name": "Divya Sachan",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Login User
Verifies customer credentials and returns a signed JWT token.

- **Endpoint:** `POST /api/v1/auth/login`
- **Auth:** Public
- **Content-Type:** `application/json`

#### Request Body
```json
{
  "email": "divya@example.com",
  "password": "SecurePassword123!"
}
```

#### Response `200 OK`
```json
{
  "user": {
    "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "divya@example.com",
    "name": "Divya Sachan",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Check Authentication Status
Validates the current session's JWT bearer token and returns authenticated user metadata.

- **Endpoint:** `GET /api/v1/auth/check` (Alias: `GET /api/v1/auth/me`)
- **Auth:** `Bearer <token>`

#### Response `200 OK`
```json
{
  "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email": "divya@example.com",
  "name": "Divya Sachan",
  "role": "customer"
}
```

#### Response `401 Unauthorized`
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing Bearer token",
  "statusCode": 401
}
```

---

### Get Current User Profile
Returns full profile details for the authenticated user.

- **Endpoint:** `GET /api/v1/users/me`
- **Auth:** `Bearer <token>`

#### Response `200 OK`
```json
{
  "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email": "divya@example.com",
  "name": "Divya Sachan",
  "role": "customer",
  "createdAt": "2026-09-18T05:30:00.000Z"
}
```

---

## 2. Product Catalog Service

The Catalog Service provides high-performance product browsing, multi-facet filtering, dynamic sorting, inventory lookup, and Redis cache-aside acceleration.

### List Products (Filtered & Paginated)
Fetches a list of catalog products based on query parameters. All filtering and sorting operations run directly in PostgreSQL via Prisma.

- **Endpoint:** `GET /api/v1/products`
- **Auth:** Public

#### Query Parameters

| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `category` / `categories` | String / Array | `Skin Care,Makeup` | Filter by one or more categories |
| `skinType` / `skinTypes` | String / Array | `Normal,Dry` | Filter by skin type tags |
| `minPrice` | Number | `20` | Minimum product price in USD |
| `maxPrice` | Number | `80` | Maximum product price in USD |
| `rating` / `minRating` | Number | `4.5` | Minimum star rating threshold |
| `promotion` / `promotions` | String / Array | `New Arrivals,Best Sellers` | Filter by active promotion flags |
| `isBestSeller` | Boolean | `true` | Show only best-selling products |
| `isNewArrival` | Boolean | `true` | Show only new arrivals |
| `isOnSale` | Boolean | `true` | Show products currently on sale |
| `availability` | String / Array | `In Stock` / `Out of Stocks` | Filter by stock availability |
| `sortBy` | String | `price-asc` | Sorting: `price-asc`, `price-desc`, `rating-desc`, `best-selling`, `default` |
| `page` | Integer | `1` | Page number (default: `1`) |
| `limit` | Integer | `12` | Items per page (default: `12`) |

#### Example Request
```bash
curl -X GET "http://localhost:8080/api/v1/products?category=Skin%20Care&minPrice=20&maxPrice=50&sortBy=price-asc&page=1&limit=12"
```

#### Response `200 OK`
```json
{
  "products": [
    {
      "id": "prod-11",
      "title": "HydraLuxe Serum",
      "description": "Multi-molecular hyaluronic acid serum with deep moisture retention.",
      "category": "Skin Care",
      "skinTypes": ["Dry", "Combination", "Sensitive"],
      "rating": 4.9,
      "reviewCount": 228,
      "price": 20.0,
      "originalPrice": 40.0,
      "discountPercent": 50,
      "imageUrl": "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec",
      "stock": 50,
      "isBestSeller": true,
      "isNewArrival": true,
      "isOnSale": true,
      "createdAt": "2026-09-18T07:54:06.000Z",
      "updatedAt": "2026-09-18T09:31:21.000Z"
    }
  ],
  "totalCount": 15,
  "page": 1,
  "limit": 12,
  "totalPages": 2
}
```

---

### Get Product Details by ID
Returns a single product by its unique identifier.

- **Endpoint:** `GET /api/v1/products/:id`
- **Auth:** Public

#### Response `200 OK`
```json
{
  "id": "prod-1",
  "title": "SilkSculpt Serum",
  "description": "Intensive botanical peptide serum for radiant, smooth skin texture.",
  "category": "Skin Care",
  "skinTypes": ["Combination", "Dry", "Normal"],
  "rating": 4.9,
  "reviewCount": 312,
  "price": 35.0,
  "originalPrice": 70.0,
  "discountPercent": 50,
  "imageUrl": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be",
  "stock": 50,
  "isBestSeller": true,
  "isNewArrival": false,
  "isOnSale": true,
  "createdAt": "2026-09-18T07:54:06.000Z",
  "updatedAt": "2026-09-18T09:31:21.000Z"
}
```

---

### Reserve Inventory Stock
Atomically reserves stock for items during the order checkout process. Called internally by Order Service.

- **Endpoint:** `POST /api/v1/products/reserve`
- **Auth:** Internal Service Call
- **Content-Type:** `application/json`

#### Request Body
```json
{
  "orderId": "ord_9b1deb4d-3b7d-4bad",
  "items": [
    { "productId": "prod-1", "quantity": 2 }
  ]
}
```

#### Response `200 OK`
```json
{
  "reserved": true,
  "orderId": "ord_9b1deb4d-3b7d-4bad",
  "items": [
    {
      "productId": "prod-1",
      "quantity": 2,
      "unitPrice": 35.0,
      "title": "SilkSculpt Serum"
    }
  ]
}
```

---

## 3. Order Management Service

The Order Service coordinates checkout transactions, inventory reservations, and asynchronous event notifications via RabbitMQ.

### Create Order
Places a new order, queries authoritative pricing from Catalog, reserves inventory, and publishes `order.created` to RabbitMQ.

- **Endpoint:** `POST /api/v1/orders`
- **Auth:** `Bearer <token>`
- **Content-Type:** `application/json`

#### Request Body
```json
{
  "shippingAddress": "456 Blossom Lane, San Francisco, CA 94107",
  "items": [
    { "productId": "prod-1", "quantity": 2 },
    { "productId": "prod-3", "quantity": 1 }
  ]
}
```

#### Response `201 Created`
```json
{
  "id": "ord_555a123b-4c5d-6e7f",
  "userId": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "PENDING_PAYMENT",
  "totalAmount": 133.0,
  "shippingAddress": "456 Blossom Lane, San Francisco, CA 94107",
  "items": [
    { "productId": "prod-1", "quantity": 2, "unitPrice": 35.0 },
    { "productId": "prod-3", "quantity": 1, "unitPrice": 63.0 }
  ],
  "createdAt": "2026-09-18T10:15:00.000Z"
}
```

---

### List Orders
Returns a paginated list of orders placed by the authenticated customer.

- **Endpoint:** `GET /api/v1/orders`
- **Auth:** `Bearer <token>`
- **Query Params:** `?page=1&limit=10`

#### Response `200 OK`
```json
{
  "orders": [
    {
      "id": "ord_555a123b-4c5d-6e7f",
      "status": "COMPLETED",
      "totalAmount": 133.0,
      "createdAt": "2026-09-18T10:15:00.000Z"
    }
  ],
  "totalCount": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### Get Order by ID
Fetches detailed information for a specific order.

- **Endpoint:** `GET /api/v1/orders/:id`
- **Auth:** `Bearer <token>`

#### Response `200 OK`
```json
{
  "id": "ord_555a123b-4c5d-6e7f",
  "userId": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "COMPLETED",
  "totalAmount": 133.0,
  "shippingAddress": "456 Blossom Lane, San Francisco, CA 94107",
  "items": [
    { "productId": "prod-1", "quantity": 2, "unitPrice": 35.0 },
    { "productId": "prod-3", "quantity": 1, "unitPrice": 63.0 }
  ],
  "createdAt": "2026-09-18T10:15:00.000Z",
  "updatedAt": "2026-09-18T10:15:05.000Z"
}
```

---

## 4. Payment Service

The Payment Service handles payment charges, credit card verification, and payment webhooks.

### Synchronous Payment Fallback
Directly processes a payment transaction for an order (fallback for synchronous flows).

- **Endpoint:** `POST /api/v1/payments/process`
- **Auth:** Internal Service Call
- **Content-Type:** `application/json`

#### Request Body
```json
{
  "orderId": "ord_555a123b-4c5d-6e7f",
  "userId": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "amount": 133.0
}
```

#### Response `200 OK`
```json
{
  "id": "pay_999a888b-777c-666d",
  "orderId": "ord_555a123b-4c5d-6e7f",
  "userId": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "amount": 133.0,
  "status": "SUCCESS",
  "transactionReference": "tx_mock_982341203",
  "createdAt": "2026-09-18T10:15:02.000Z"
}
```

---

## 5. Health & Observability Endpoints

Every microservice exposes health checks and native Prometheus metrics.

| Service | Health Check URL | Prometheus Metrics URL |
| :--- | :--- | :--- |
| **User Service** | `http://localhost:3001/health` | `http://localhost:3001/metrics` |
| **Catalog Service** | `http://localhost:3002/health` | `http://localhost:3002/metrics` |
| **Order Service** | `http://localhost:3003/health` | `http://localhost:3003/metrics` |
| **Payment Service** | `http://localhost:3004/health` | `http://localhost:3004/metrics` |

#### Sample Health Response `200 OK`
```json
{
  "status": "ok",
  "service": "catalog-service",
  "uptime": 3600.42,
  "timestamp": "2026-09-18T10:20:00.000Z",
  "dependencies": {
    "database": { "status": "up", "latencyMs": 2.1 },
    "redis": { "status": "up", "latencyMs": 0.8 }
  }
}
```

---

## 6. Asynchronous Event Pipeline (RabbitMQ)

Services publish and consume domain events over the `ecommerce` topic exchange:

```
[Order Service] ──(order.created)──► [Payment Service]
                                             │
      ┌──────────────────────────────────────┴──────────────────────────────────────┐
      ▼                                                                             ▼
[payment.processed]                                                           [payment.failed]
      │                                                                             │
      ▼                                                                             ▼
[Order Service]                                                               [Order Service]
(Sets Status: COMPLETED)                                                      (Sets Status: FAILED)
```
