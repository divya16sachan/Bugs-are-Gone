import { FastifyPluginAsync } from "fastify";
import { processPaymentHandler } from "../controllers/index.js";

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
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
