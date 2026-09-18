import { FastifyPluginAsync } from "fastify";
import { processPaymentHandler } from "../controllers/index.js";

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/api/v1/payments/process", processPaymentHandler);
};
