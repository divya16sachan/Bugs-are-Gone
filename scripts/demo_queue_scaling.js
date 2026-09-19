/**
 * Person D — RabbitMQ Queue Depth Scaling Demo (KEDA)
 * 
 * Purpose:
 * Injects a rapid batch of OrderCreated messages into RabbitMQ exchange 'ecommerce'
 * to fill 'payment.order_created.queue', demonstrating KEDA backpressure autoscaling.
 * 
 * Usage:
 * node scripts/demo_queue_scaling.js [MESSAGE_COUNT]
 * e.g.:
 * node scripts/demo_queue_scaling.js 150
 */

const http = require("http");

const count = parseInt(process.argv[2] || "100", 10);
const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost";
const rabbitmqPort = process.env.RABBITMQ_MGMT_PORT || 15672;
const exchange = process.env.RABBITMQ_EXCHANGE || "ecommerce";
const routingKey = "order.created";

console.log("==========================================================");
console.log("🚀 Person D: RabbitMQ Queue Backlog Injection for KEDA");
console.log(`RabbitMQ Management API: http://${rabbitmqHost}:${rabbitmqPort}`);
console.log(`Exchange:                ${exchange}`);
console.log(`Routing Key:             ${routingKey}`);
console.log(`Message Count:           ${count}`);
console.log("==========================================================");
console.log("Tip: Run 'kubectl get scaledobject,hpa,pods -n ecom -w' to observe scaling!\n");

const auth = Buffer.from("guest:guest").toString("base64");

async function publishMessage(i) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      properties: { delivery_mode: 2 },
      routing_key: routingKey,
      payload: JSON.stringify({
        eventId: `evt_demo_${Date.now()}_${i}`,
        eventType: "OrderCreated",
        timestamp: new Date().toISOString(),
        data: {
          orderId: `ord_demo_${i}`,
          userId: "usr_load_test",
          totalAmount: 199.99,
          items: [{ productId: "prod_101", quantity: 1, unitPrice: 199.99 }]
        }
      }),
      payload_encoding: "string"
    });

    const options = {
      hostname: rabbitmqHost,
      port: rabbitmqPort,
      path: `/api/exchanges/%2f/${exchange}/publish`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      res.on("data", () => {});
      res.on("end", () => resolve(res.statusCode === 200));
    });

    req.on("error", () => resolve(false));
    req.write(payload);
    req.end();
  });
}

async function run() {
  let sent = 0;
  for (let i = 1; i <= count; i++) {
    const ok = await publishMessage(i);
    if (ok) sent++;
    if (i % 20 === 0) {
      console.log(`[Queue Backlog] ${i}/${count} messages published...`);
    }
  }

  console.log("\n==========================================================");
  console.log(`✅ Completed: ${sent} messages injected into '${exchange}'.`);
  console.log("Queue 'payment.order_created.queue' now has backlog.");
  console.log("Observe KEDA ScaledObject expanding payment-service replicas!");
  console.log("==========================================================");
}

run();
