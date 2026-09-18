import { FastifyReply, FastifyRequest } from "fastify";

// Stub controllers — real business logic implemented in Phase 1
export async function signupHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send({
    message: "User signup endpoint stub",
  });
}

export async function loginHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    message: "User login endpoint stub",
  });
}

export async function getProfileHandler(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(200).send({
    message: "User profile endpoint stub",
  });
}
