import { apiClient, setAccessToken, getAccessToken } from "./api-client";
import { useAuthStore } from "@/features/auth/auth-store";
import { Product } from "@/app/_components/types";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  accessToken?: string;
}

export interface ReserveItemRequest {
  productId: string;
  quantity: number;
}

export interface ReserveStockResponse {
  reserved: boolean;
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    title: string;
  }>;
}

export interface OrderItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  status: "PENDING_PAYMENT" | "COMPLETED" | "FAILED";
  totalAmount: number;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrdersListResponse {
  orders: Order[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: string;
  transactionReference: string | null;
  createdAt: string;
}

export const servicesApi = {
  // USER SERVICE
  signup: async (data: { email: string; password: string; name: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>("/api/v1/auth/signup", data);
    const token = res.token || res.accessToken;
    if (token) {
      setAccessToken(token);
      if (res.user) {
        useAuthStore.getState().setAuth(res.user as any, token);
      }
    }
    return res;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>("/api/v1/auth/login", data);
    const token = res.token || res.accessToken;
    if (token) {
      setAccessToken(token);
      if (res.user) {
        useAuthStore.getState().setAuth(res.user as any, token);
      }
    }
    return res;
  },

  getMe: async (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>("/api/v1/users/me");
  },

  getUsers: async (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiClient.get<{
      users: UserProfile[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/v1/users${qs}`);
  },

  getUserById: async (id: string): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(`/api/v1/users/${id}`);
  },

  logout: () => {
    useAuthStore.getState().clearAuth();
    setAccessToken(null);
  },

  // CATALOG SERVICE
  getProducts: async (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          if (Array.isArray(v)) {
            v.forEach((item) => query.append(k, item));
          } else {
            query.append(k, String(v));
          }
        }
      });
    }
    const qs = query.toString();
    return apiClient.get<{
      products: Product[];
      totalCount: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/v1/products${qs ? `?${qs}` : ""}`);
  },

  getProductById: async (id: string): Promise<Product> => {
    return apiClient.get<Product>(`/api/v1/products/${id}`);
  },

  reserveStock: async (data: { orderId: string; items: ReserveItemRequest[] }): Promise<ReserveStockResponse> => {
    return apiClient.post<ReserveStockResponse>("/api/v1/products/reserve", data);
  },

  seedCatalog: async () => {
    return apiClient.post<{ success: boolean; message: string; count: number }>("/api/v1/products/seed", {});
  },

  // ORDER SERVICE
  createOrder: async (data: {
    items: Array<{ productId: string; quantity: number }>;
    shippingAddress: string;
  }): Promise<Order> => {
    return apiClient.post<Order>("/api/v1/orders", data);
  },

  listOrders: async (page = 1, limit = 10): Promise<OrdersListResponse> => {
    return apiClient.get<OrdersListResponse>(`/api/v1/orders?page=${page}&limit=${limit}`);
  },

  getOrderById: async (id: string): Promise<Order> => {
    return apiClient.get<Order>(`/api/v1/orders/${id}`);
  },

  // PAYMENT SERVICE
  processPayment: async (data: { orderId: string; userId: string; amount: number }): Promise<PaymentRecord> => {
    return apiClient.post<PaymentRecord>("/api/v1/payments/process", data);
  },

  getPaymentByOrderId: async (orderId: string): Promise<PaymentRecord | null> => {
    try {
      return await apiClient.get<PaymentRecord>(`/api/v1/payments/${orderId}`);
    } catch {
      return null;
    }
  },

  listPayments: async (page = 1, limit = 10): Promise<{
    payments: PaymentRecord[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    return apiClient.get<{
      payments: PaymentRecord[];
      totalCount: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/v1/payments?page=${page}&limit=${limit}`);
  },
};

