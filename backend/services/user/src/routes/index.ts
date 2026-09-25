import { FastifyPluginAsync } from "fastify";
import {
  signupHandler,
  loginHandler,
  getProfileMeHandler,
  getProfileByIdHandler,
  listUsersHandler,
} from "../controllers/index.js";

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/users (list all users with pagination)
  fastify.get("/api/v1/users", listUsersHandler);

  // POST /api/v1/auth/signup
  fastify.post(
    "/api/v1/auth/signup",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password", "name"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            name: { type: "string", minLength: 1 },
            role: { type: "string" },
            confirmPassword: { type: "string" },
          },
          additionalProperties: true,
        },
      },
    },
    signupHandler
  );

  // POST /api/v1/auth/login
  fastify.post(
    "/api/v1/auth/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
      },
    },
    loginHandler
  );

  // GET /api/v1/users/me & GET /api/v1/auth/check (JWT auth check)
  fastify.get("/api/v1/users/me", getProfileMeHandler);
  fastify.get("/api/v1/auth/check", getProfileMeHandler);
  fastify.get("/api/v1/auth/me", getProfileMeHandler);

  // GET /api/v1/users/:id
  fastify.get(
    "/api/v1/users/:id",
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
    getProfileByIdHandler
  );
};
