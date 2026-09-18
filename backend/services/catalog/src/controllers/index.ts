import { FastifyReply, FastifyRequest } from "fastify";

// Stub controllers — real business logic implemented in Phase 1
export async function getProductsHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    products: [],
    total: 0,
    page: 1,
    limit: 20,
    message: "Catalog products endpoint stub",
  });
}

export async function getProductByIdHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    message: "Catalog product details endpoint stub",
  });
}

export async function reserveStockHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    reserved: true,
    message: "Stock reservation endpoint stub",
  });
}
