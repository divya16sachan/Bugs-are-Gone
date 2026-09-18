import { FastifyPluginAsync } from "fastify";
import {
  createOrderHandler,
  listOrdersHandler,
  getOrderByIdHandler,
} from "../controllers/index.js";

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/orders
  fastify.post(
    "/api/v1/orders",
    {
      schema: {
        body: {
          type: "object",
          required: ["items", "shippingAddress"],
          properties: {
            shippingAddress: { type: "string", minLength: 1 },
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
    createOrderHandler
  );

  // GET /api/v1/orders
  fastify.get(
    "/api/v1/orders",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            page: { type: "string" },
            limit: { type: "string" },
          },
        },
      },
    },
    listOrdersHandler
  );

  // GET /api/v1/orders/:id
  fastify.get(
    "/api/v1/orders/:id",
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
    getOrderByIdHandler
  );
};
