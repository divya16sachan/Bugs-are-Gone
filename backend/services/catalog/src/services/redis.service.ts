import { Redis } from "ioredis";
import { config } from "../config.js";
import { catalogMetrics } from "../middleware/metrics.middleware.js";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });

    redisClient.on("error", (err: any) => {
      console.error("[Redis Error]:", err.message);
    });
  }
  return redisClient;
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    if (data) {
      catalogMetrics.cacheHitsTotal.inc();
      return JSON.parse(data) as T;
    }
    catalogMetrics.cacheMissesTotal.inc();
    return null;
  } catch (err) {
    console.error(`[Redis getCached Error for key ${key}]:`, err);
    catalogMetrics.cacheMissesTotal.inc();
    return null;
  }
}

export async function setCached(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error(`[Redis setCached Error for key ${key}]:`, err);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const client = getRedisClient();
    if (pattern.includes("*")) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } else {
      await client.del(pattern);
    }
  } catch (err) {
    console.error(`[Redis invalidateCache Error for pattern ${pattern}]:`, err);
  }
}
