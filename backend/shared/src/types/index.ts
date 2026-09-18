// Common shared types across microservices

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface HealthCheckResult {
  status: "ok" | "degraded" | "down";
  service: string;
  timestamp: string;
  version?: string;
  uptimeSeconds: number;
  checks?: Record<string, { status: "ok" | "down"; details?: string }>;
}

export type HealthCheckFn = () => Promise<{ name: string; ok: boolean; details?: string }>;

export interface BaseEvent<T = any> {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: T;
}

// Event Data Types
export interface OrderCreatedEventData {
  orderId: string;
  userId: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface PaymentProcessedEventData {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  status: "SUCCESS" | "FAILED";
  transactionReference?: string;
}

export interface PaymentFailedEventData {
  orderId: string;
  userId: string;
  reason: string;
  retryCount?: number;
}

export interface StockReleasedEventData {
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  reason: string;
}
