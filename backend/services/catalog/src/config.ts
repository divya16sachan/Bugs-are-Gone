import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  serviceName: string;
  port: number;
  host: string;
  nodeEnv: string;
  logLevel: string;
  jwtSecret: string;
  databaseUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
}

export const config: AppConfig = {
  serviceName: "catalog-service",
  port: parseInt(process.env.PORT || "3002", 10),
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  jwtSecret: process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/catalog_db?schema=public",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
};
