import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";
import { userMetrics } from "../middleware/metrics.middleware.js";
import { JwtPayload } from "@ecom/shared";

export class UserService {
  async signup(data: { email: string; password: string; name: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new Error("EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
      },
    });

    const token = this.generateToken(user.id, user.email);
    userMetrics.userSignupsTotal.inc();

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: "customer",
      },
      token,
      accessToken: token,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      userMetrics.userLoginsTotal.inc({ status: "failure" });
      throw new Error("INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      userMetrics.userLoginsTotal.inc({ status: "failure" });
      throw new Error("INVALID_CREDENTIALS");
    }

    const token = this.generateToken(user.id, user.email);
    userMetrics.userLoginsTotal.inc({ status: "success" });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: "customer",
      },
      token,
      accessToken: token,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      role: "customer" as const,
    };
  }

  generateToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
    };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: "1d", algorithm: "HS256" });
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as JwtPayload;
  }
}

export const userService = new UserService();
