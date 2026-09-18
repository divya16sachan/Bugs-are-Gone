import { FastifyPluginAsync } from "fastify";
import { getProductsHandler, getProductByIdHandler, reserveStockHandler } from "../controllers/index.js";

export const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/api/v1/products", getProductsHandler);
  fastify.get("/api/v1/products/:id", getProductByIdHandler);
  fastify.post("/api/v1/products/reserve", reserveStockHandler);
};
