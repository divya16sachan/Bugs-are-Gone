import { config } from "../config.js";

export interface ReserveItem {
  productId: string;
  quantity: number;
}

export interface ReservedItemDetail {
  productId: string;
  quantity: number;
  unitPrice: number;
  title?: string;
}

export interface ReserveStockResponse {
  reserved: boolean;
  orderId: string;
  items: ReservedItemDetail[];
}

export class CatalogClient {
  async reserveStock(orderId: string, items: ReserveItem[], traceparent?: string): Promise<ReserveStockResponse> {
    if (process.env.USE_MOCKS === "true") {
      console.log(`[Mock CatalogClient] Stock reserved for order ${orderId}`);
      return {
        reserved: true,
        orderId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: 25.0,
          title: `Mock Product ${i.productId}`,
        })),
      };
    }

    try {
      const url = `${config.catalogServiceUrl}/api/v1/products/reserve`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (traceparent) {
        headers["traceparent"] = traceparent;
      }
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ orderId, items }),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        const err: any = new Error(errorData.message || `Catalog reservation failed with status ${response.status}`);
        err.statusCode = response.status;
        throw err;
      }

      const data = (await response.json()) as ReserveStockResponse;
      return data;
    } catch (err: any) {
      console.error("[CatalogClient reserveStock Error]:", err.message);
      throw err;
    }
  }
}

export const catalogClient = new CatalogClient();
