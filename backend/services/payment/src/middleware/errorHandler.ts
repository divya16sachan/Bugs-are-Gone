import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error({ err: error, url: request.url, method: request.method }, "Request failed with error");

  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: error.name || "InternalServerError",
    message: error.message || "An unexpected error occurred",
    statusCode,
  });
}
