import { FastifyReply, FastifyRequest } from "fastify";

// Stub controllers — real business logic implemented in Phase 1
export async function processPaymentHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    paymentId: "pay_stub",
    status: "SUCCESS",
    message: "Process payment endpoint stub",
  });
}
