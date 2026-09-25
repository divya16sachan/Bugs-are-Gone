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

export async function getPaymentByOrderIdHandler(req: FastifyRequest, reply: FastifyReply) {
  const { orderId } = req.params as { orderId: string };
  if (!orderId) {
    return reply.status(400).send({
      error: "BadRequest",
      message: "Missing orderId parameter",
      statusCode: 400,
    });
  }

  const payment = await paymentService.getPaymentByOrderId(orderId);
  if (!payment) {
    return reply.status(404).send({
      error: "NotFound",
      message: `Payment for order ${orderId} not found`,
      statusCode: 404,
    });
  }

  return reply.status(200).send(payment);
}

export async function listPaymentsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { page = 1, limit = 10 } = req.query as { page?: number; limit?: number };
  const result = await paymentService.listPayments(Number(page) || 1, Number(limit) || 10);
  return reply.status(200).send(result);
}


