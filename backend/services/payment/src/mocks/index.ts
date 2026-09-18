// External dependency mocks for Payment Service (e.g. Stripe / payment gateway mock)
export const mocks = {
  paymentGateway: {
    charge: async (_amount: number, _currency: string = "USD") => ({
      success: true,
      transactionId: "mock_tx_999",
    }),
  },
};
