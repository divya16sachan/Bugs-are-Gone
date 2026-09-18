import { FastifyPluginAsync } from "fastify";
import { HealthCheckFn, HealthCheckResult } from "@ecom/shared";

export class HealthCheckManager {
  private checks: Map<string, HealthCheckFn> = new Map();
  private serviceName: string;
  private startTime: number = Date.now();

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  registerCheck(name: string, checkFn: HealthCheckFn) {
    this.checks.set(name, checkFn);
  }

  async runChecks(): Promise<{ statusCode: number; result: HealthCheckResult }> {
    const checksResult: Record<string, { status: "ok" | "down"; details?: string }> = {};
    let isHealthy = true;

    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const check = await checkFn();
        if (!check.ok) {
          isHealthy = false;
          checksResult[name] = { status: "down", details: check.details };
        } else {
          checksResult[name] = { status: "ok", details: check.details };
        }
      } catch (err: any) {
        isHealthy = false;
        checksResult[name] = { status: "down", details: err.message };
      }
    }

    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const result: HealthCheckResult = {
      status: isHealthy ? "ok" : "down",
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      checks: this.checks.size > 0 ? checksResult : undefined,
    };

    return {
      statusCode: isHealthy ? 200 : 503,
      result,
    };
  }
}

export const healthManager = new HealthCheckManager("order-service");

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async (_request, reply) => {
    const { statusCode, result } = await healthManager.runChecks();
    return reply.status(statusCode).send(result);
  });
};
