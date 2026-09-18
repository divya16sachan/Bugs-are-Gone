import { FastifyReply, FastifyRequest } from "fastify";
import { paymentService } from "../services/payment.service.js";

export async function processPaymentHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as { orderId: string; userId: string; amount: number };

  if (!body.orderId || !body.userId || body.amount === undefined) {
    return reply.status(400).send({
      error: "BadRequest",
      message: "Missing orderId, userId, or amount",
      statusCode: 400,
    });
  }

  const payment = await paymentService.processPaymentSync(body);
  return reply.status(200).send(payment);
}
