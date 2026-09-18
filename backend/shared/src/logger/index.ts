import { pino, Logger, LoggerOptions } from "pino";

export interface LoggerConfig {
  serviceName: string;
  level?: string;
  isDevelopment?: boolean;
}

export function createLogger(config: LoggerConfig): Logger {
  const { serviceName, level = process.env.LOG_LEVEL || "info", isDevelopment = process.env.NODE_ENV !== "production" } = config;

  const options: LoggerOptions = {
    name: serviceName,
    level,
    formatters: {
      level(label) {
        return { level: label };
      },
      bindings(bindings) {
        return {
          pid: bindings.pid,
          host: bindings.hostname,
          service: serviceName,
        };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (isDevelopment && !process.env.CI) {
    return pino({
      ...options,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });
  }

  return pino(options);
}
