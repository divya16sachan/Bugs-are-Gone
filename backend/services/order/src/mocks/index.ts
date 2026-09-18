// External dependency mocks for Order Service (e.g. Catalog HTTP client mock)
export const mocks = {
  catalogClient: {
    reserveStock: async (_orderId: string, _items: any[]) => ({
      reserved: true,
      reservationId: "mock_res_123",
    }),
  },
};
