import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import crypto from "crypto";

export type CpuWorkLevel = "none" | "low" | "medium" | "high";

export interface ChaosConfig {
  injectLatencyMs: number;
  injectErrorRate: number;
  cpuWork: CpuWorkLevel;
}

export class ChaosManager {
  private config: ChaosConfig;

  constructor() {
    this.config = {
      injectLatencyMs: parseInt(process.env.INJECT_LATENCY_MS || "0", 10),
      injectErrorRate: parseFloat(process.env.INJECT_ERROR_RATE || "0.0"),
      cpuWork: (process.env.CPU_WORK || "none").toLowerCase() as CpuWorkLevel,
    };
  }

  getConfig(): ChaosConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ChaosConfig>): ChaosConfig {
    if (updates.injectLatencyMs !== undefined) {
      this.config.injectLatencyMs = Math.max(0, updates.injectLatencyMs);
    }
    if (updates.injectErrorRate !== undefined) {
      this.config.injectErrorRate = Math.min(1.0, Math.max(0.0, updates.injectErrorRate));
    }
    if (updates.cpuWork !== undefined) {
      this.config.cpuWork = updates.cpuWork;
    }
    return this.getConfig();
  }

  reset(): ChaosConfig {
    this.config = {
      injectLatencyMs: 0,
      injectErrorRate: 0.0,
      cpuWork: "none",
    };
    return this.getConfig();
  }

  burnCpu(level: CpuWorkLevel): void {
    if (level === "none") return;

    let iterations = 0;
    if (level === "low") iterations = 10000;
    else if (level === "medium") iterations = 80000;
    else if (level === "high") iterations = 300000;

    // Deterministic CPU burn using cryptographic hashing
    let hash = "chaos-seed";
    for (let i = 0; i < iterations; i++) {
      hash = crypto.createHash("sha256").update(hash + i).digest("hex");
    }
  }
}

export const chaosManager = new ChaosManager();

export function createChaosPlugin(serviceName: string): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (fastify) => {
    // 1. Chaos Hook on Incoming Requests
    fastify.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
      const path = request.url.split("?")[0];

      // Never inject faults into health, metrics, or chaos endpoints
      if (path.startsWith("/health") || path.startsWith("/metrics") || path.startsWith("/chaos")) {
        return;
      }

      const config = chaosManager.getConfig();

      // (a) Error rate injection (force HTTP 500)
      if (config.injectErrorRate > 0 && Math.random() < config.injectErrorRate) {
        request.log.warn({ service: serviceName, rate: config.injectErrorRate }, "[Chaos] Injected error triggered");
        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: `[Chaos Incident] Synthetic failure triggered by INJECT_ERROR_RATE (${config.injectErrorRate})`,
        });
      }

      // (b) Latency injection
      if (config.injectLatencyMs > 0) {
        request.log.info({ service: serviceName, latencyMs: config.injectLatencyMs }, "[Chaos] Injected latency delay");
        await new Promise((resolve) => setTimeout(resolve, config.injectLatencyMs));
      }

      // (c) CPU Burn injection
      if (config.cpuWork && config.cpuWork !== "none") {
        chaosManager.burnCpu(config.cpuWork);
      }
    });

    // 2. Control Endpoints for Person B Experiments
    fastify.get("/chaos/config", async () => {
      return {
        service: serviceName,
        chaos: chaosManager.getConfig(),
      };
    });

    fastify.post("/chaos/inject", async (request: FastifyRequest) => {
      const body = (request.body || {}) as Partial<ChaosConfig>;
      const updated = chaosManager.updateConfig(body);
      request.log.warn({ service: serviceName, config: updated }, "[Chaos] Updated chaos configuration");
      return {
        service: serviceName,
        status: "Chaos configuration updated",
        chaos: updated,
      };
    });

    fastify.post("/chaos/reset", async (request: FastifyRequest) => {
      const resetConfig = chaosManager.reset();
      request.log.info({ service: serviceName }, "[Chaos] Reset chaos configuration to baseline");
      return {
        service: serviceName,
        status: "Chaos reset to baseline",
        chaos: resetConfig,
      };
    });
  };

  return fp(plugin, {
    name: `fastify-chaos-plugin-${serviceName}`,
  });
}
