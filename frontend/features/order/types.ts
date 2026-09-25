export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  shippingAddress: string;
  customerName?: string;
  customerEmail?: string;
}

export interface OrderItemResponse {
  productId: string;
  quantity: number;
  unitPrice?: number;
  title?: string;
}

export interface OrderResponse {
  id: string;
  userId?: string;
  status: "PENDING_PAYMENT" | "COMPLETED" | "FAILED";
  totalAmount: number;
  shippingAddress: string;
  items: OrderItemResponse[];
  createdAt: string;
}
