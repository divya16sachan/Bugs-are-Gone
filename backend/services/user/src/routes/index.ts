import { FastifyPluginAsync } from "fastify";
import { signupHandler, loginHandler, getProfileHandler } from "../controllers/index.js";

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/api/v1/auth/signup", signupHandler);
  fastify.post("/api/v1/auth/login", loginHandler);
  fastify.get("/api/v1/users/me", getProfileHandler);
};
