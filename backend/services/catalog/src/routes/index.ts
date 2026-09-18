import { FastifyPluginAsync } from "fastify";
import { getProductsHandler, getProductByIdHandler, reserveStockHandler } from "../controllers/index.js";

export const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/products
  fastify.get(
    "/api/v1/products",
    {
      schema: {
        querystring: {
          type: "object",
          additionalProperties: true,
          properties: {
            category: { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
            categories: { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
            skinType: { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
            skinTypes: { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
            minPrice: { anyOf: [{ type: "string" }, { type: "number" }] },
            maxPrice: { anyOf: [{ type: "string" }, { type: "number" }] },
            rating: { anyOf: [{ type: "string" }, { type: "number" }] },
            minRating: { anyOf: [{ type: "string" }, { type: "number" }] },
            promotion: { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
            promotions: { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
            availability: { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
            sortBy: { type: "string" },
            sort: { type: "string" },
            isBestSeller: { anyOf: [{ type: "string" }, { type: "boolean" }] },
            isNewArrival: { anyOf: [{ type: "string" }, { type: "boolean" }] },
            isOnSale: { anyOf: [{ type: "string" }, { type: "boolean" }] },
            page: { anyOf: [{ type: "string" }, { type: "number" }] },
            limit: { anyOf: [{ type: "string" }, { type: "number" }] },
            pageSize: { anyOf: [{ type: "string" }, { type: "number" }] },
          },
        },
      },
    },
    getProductsHandler
  );

  // GET /api/v1/products/:id
  fastify.get(
    "/api/v1/products/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    getProductByIdHandler
  );

  // POST /api/v1/products/reserve
  fastify.post(
    "/api/v1/products/reserve",
    {
      schema: {
        body: {
          type: "object",
          required: ["orderId", "items"],
          properties: {
            orderId: { type: "string" },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
      },
    },
    reserveStockHandler
  );
};
