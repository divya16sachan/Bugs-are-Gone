import { FastifyPluginAsync } from "fastify";
import { createOrderHandler, getOrderByIdHandler } from "../controllers/index.js";

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/api/v1/orders", createOrderHandler);
  fastify.get("/api/v1/orders/:id", getOrderByIdHandler);
};
