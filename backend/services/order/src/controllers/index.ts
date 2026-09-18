import { FastifyReply, FastifyRequest } from "fastify";

// Stub controllers — real business logic implemented in Phase 1
export async function createOrderHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send({
    orderId: "ord_stub",
    status: "PENDING_PAYMENT",
    message: "Create order endpoint stub",
  });
}

export async function getOrderByIdHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    message: "Get order details endpoint stub",
  });
}
