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
  catalogServiceUrl: string;
  rabbitmqUrl: string;
}

export const config: AppConfig = {
  serviceName: "order-service",
  port: parseInt(process.env.PORT || "3003", 10),
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  jwtSecret: process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/order_db?schema=public",
  catalogServiceUrl: process.env.CATALOG_SERVICE_URL || "http://localhost:3002",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
};
