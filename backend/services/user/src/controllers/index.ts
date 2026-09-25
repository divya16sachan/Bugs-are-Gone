import { FastifyReply, FastifyRequest } from "fastify";
import { userService } from "../services/user.service.js";

function extractUser(req: FastifyRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err: any = new Error("Invalid or missing token");
    err.statusCode = 401;
    err.name = "Unauthorized";
    throw err;
  }
  const token = authHeader.split(" ")[1];
  try {
    return userService.verifyToken(token);
  } catch (e: any) {
    const err: any = new Error("Invalid or expired token");
    err.statusCode = 401;
    err.name = "Unauthorized";
    throw err;
  }
}

export async function signupHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as { email: string; password: string; name: string };
  try {
    const result = await userService.signup(body);
    return reply.status(201).send(result);
  } catch (err: any) {
    if (err.message === "EMAIL_EXISTS") {
      return reply.status(409).send({
        error: "Conflict",
        message: "A user with this email address already exists",
        statusCode: 409,
      });
    }
    throw err;
  }
}

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as { email: string; password: string };
  try {
    const result = await userService.login(body);
    return reply.status(200).send(result);
  } catch (err: any) {
    if (err.message === "INVALID_CREDENTIALS") {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid email or password",
        statusCode: 401,
      });
    }
    throw err;
  }
}

export async function getProfileMeHandler(req: FastifyRequest, reply: FastifyReply) {
  const decoded = extractUser(req);
  const user = await userService.getProfile(decoded.sub);

  if (!user) {
    return reply.status(404).send({
      error: "NotFound",
      message: "User not found",
      statusCode: 404,
    });
  }

  return reply.status(200).send(user);
}

export async function getProfileByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const decoded = extractUser(req);

  if (decoded.sub !== id) {
    return reply.status(403).send({
      error: "Forbidden",
      message: "Access to this profile is forbidden",
      statusCode: 403,
    });
  }

  const user = await userService.getProfile(id);
  if (!user) {
    return reply.status(404).send({
      error: "NotFound",
      message: "User not found",
      statusCode: 404,
    });
  }

  return reply.status(200).send(user);
}

export async function listUsersHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = req.query as { page?: string; limit?: string };
  const page = parseInt(query.page || "1", 10) || 1;
  const limit = parseInt(query.limit || "10", 10) || 10;

  const result = await userService.listUsers(page, limit);
  return reply.status(200).send(result);
}
