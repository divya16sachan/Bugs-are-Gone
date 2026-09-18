import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { orderService } from "../services/order.service.js";
import { config } from "../config.js";
import { JwtPayload } from "@ecom/shared";

function extractUser(req: FastifyRequest): JwtPayload {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err: any = new Error("Invalid or missing token");
    err.statusCode = 401;
    err.name = "Unauthorized";
    throw err;
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as JwtPayload;
  } catch (e: any) {
    const err: any = new Error("Invalid or expired token");
    err.statusCode = 401;
    err.name = "Unauthorized";
    throw err;
  }
}

export async function createOrderHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const user = extractUser(req);
    const body = req.body as {
      items: Array<{ productId: string; quantity: number }>;
      shippingAddress: string;
    };

    const order = await orderService.createOrder({
      userId: user.sub,
      items: body.items,
      shippingAddress: body.shippingAddress,
    });

    return reply.status(201).send(order);
  } catch (err: any) {
    if (err.statusCode === 401 || err.name === "Unauthorized" || err.name === "JsonWebTokenError") {
      return reply.status(401).send({
        error: "Unauthorized",
        message: err.message || "Invalid or missing token",
        statusCode: 401,
      });
    }

    if (
      err.statusCode === 409 ||
      err.message?.includes("INSUFFICIENT_STOCK") ||
      err.message?.includes("InsufficientStock") ||
      err.message?.includes("insufficient_stock")
    ) {
      return reply.status(409).send({
        error: "InsufficientStock",
        message: err.message || "Insufficient stock for requested items",
        statusCode: 409,
      });
    }

    if (err.statusCode === 404 || err.message?.includes("PRODUCT_NOT_FOUND")) {
      return reply.status(404).send({
        error: "NotFound",
        message: err.message || "Product not found",
        statusCode: 404,
      });
    }

    throw err;
  }
}

export async function listOrdersHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = extractUser(req);
  const query = req.query as { page?: string; limit?: string };
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 10;

  const result = await orderService.listUserOrders(user.sub, page, limit);
  return reply.status(200).send(result);
}

export async function getOrderByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  const user = extractUser(req);
  const { id } = req.params as { id: string };

  const order = await orderService.getOrderById(id, user.sub);
  if (!order) {
    return reply.status(404).send({
      error: "NotFound",
      message: `Order with id '${id}' not found`,
      statusCode: 404,
    });
  }

  return reply.status(200).send(order);
}
