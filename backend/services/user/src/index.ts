import { buildApp } from "./app.js";
import { config } from "./config.js";

async function start() {
  try {
    const app = await buildApp();
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`${config.serviceName} running on http://${config.host}:${config.port}`);
  } catch (err) {
    console.error(`Failed to start ${config.serviceName}:`, err);
    process.exit(1);
  }
}

start();
