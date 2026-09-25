import { FastifyPluginAsync } from "fastify";
import {
  processPaymentHandler,
  getPaymentByOrderIdHandler,
  listPaymentsHandler,
} from "../controllers/index.js";

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/payments (list all payments with pagination)
  fastify.get("/api/v1/payments", listPaymentsHandler);

  // GET /api/v1/payments/:orderId & /api/v1/payments/order/:orderId
  fastify.get("/api/v1/payments/:orderId", getPaymentByOrderIdHandler);
  fastify.get("/api/v1/payments/order/:orderId", getPaymentByOrderIdHandler);

  // POST /api/v1/payments/process
  fastify.post(
    "/api/v1/payments/process",
    {
      schema: {
        body: {
          type: "object",
          required: ["orderId", "userId", "amount"],
          properties: {
            orderId: { type: "string" },
            userId: { type: "string" },
            amount: { type: "number", minimum: 0 },
          },
        },
      },
    },
    processPaymentHandler
  );
};
