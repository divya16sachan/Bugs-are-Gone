/**
 * Sends a simulated distributed trace (User -> Catalog -> Order -> Payment)
 * to Jaeger's OTLP HTTP receiver (port 4318) to verify the tracing pipeline.
 */
const http = require('http');
const crypto = require('crypto');

function randomHex(bytes) {
  return crypto.randomBytes(bytes).toString('hex');
}

const traceId = randomHex(16);
const nowNano = BigInt(Date.now()) * 1000000n;
const spanDuration = 50000000n; // 50ms

const rootSpanId = randomHex(8);
const catalogSpanId = randomHex(8);
const orderSpanId = randomHex(8);
const paymentSpanId = randomHex(8);

const payload = {
  resourceSpans: [
    {
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: 'order-service' } }
        ]
      },
      scopeSpans: [
        {
          scope: { name: 'ecom-tracer' },
          spans: [
            {
              traceId,
              spanId: rootSpanId,
              name: 'POST /api/v1/orders/checkout',
              kind: 2, // SPAN_KIND_SERVER
              startTimeUnixNano: nowNano.toString(),
              endTimeUnixNano: (nowNano + spanDuration * 4n).toString(),
              attributes: [
                { key: 'http.status_code', value: { intValue: 201 } },
                { key: 'http.route', value: { stringValue: '/api/v1/orders' } }
              ],
              status: { code: 1 }
            },
            {
              traceId,
              spanId: orderSpanId,
              parentSpanId: rootSpanId,
              name: 'OrderService.createOrder',
              kind: 1, // INTERNAL
              startTimeUnixNano: (nowNano + spanDuration).toString(),
              endTimeUnixNano: (nowNano + spanDuration * 3n).toString(),
              attributes: [
                { key: 'order.id', value: { stringValue: 'ord_demo_999' } }
              ]
            }
          ]
        }
      ]
    },
    {
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: 'catalog-service' } }
        ]
      },
      scopeSpans: [
        {
          scope: { name: 'ecom-tracer' },
          spans: [
            {
              traceId,
              spanId: catalogSpanId,
              parentSpanId: rootSpanId,
              name: 'POST /api/v1/inventory/reserve',
              kind: 2,
              startTimeUnixNano: (nowNano + spanDuration).toString(),
              endTimeUnixNano: (nowNano + spanDuration * 2n).toString(),
              attributes: [
                { key: 'catalog.stock_status', value: { stringValue: 'RESERVED' } }
              ]
            }
          ]
        }
      ]
    },
    {
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: 'payment-service' } }
        ]
      },
      scopeSpans: [
        {
          scope: { name: 'ecom-tracer' },
          spans: [
            {
              traceId,
              spanId: paymentSpanId,
              parentSpanId: rootSpanId,
              name: 'RabbitMQ Consumer: payment.order_created.queue',
              kind: 3, // CONSUMER
              startTimeUnixNano: (nowNano + spanDuration * 2n).toString(),
              endTimeUnixNano: (nowNano + spanDuration * 4n).toString(),
              attributes: [
                { key: 'payment.status', value: { stringValue: 'SUCCESS' } }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const data = JSON.stringify(payload);

const req = http.request({
  hostname: 'localhost',
  port: 4318,
  path: '/v1/traces',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, res => {
  console.log(`Response Status: ${res.statusCode}`);
  let resBody = '';
  res.on('data', chunk => { resBody += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log(`[SUCCESS] Distributed test trace sent successfully! Trace ID: ${traceId}`);
      console.log(`Inspect at: http://localhost:16686/trace/${traceId}`);
    } else {
      console.log(`Received non-200 response:`, resBody);
    }
  });
});

req.on('error', err => {
  console.error('Failed to send test trace to Jaeger OTLP receiver:', err.message);
  console.log('(Ensure Jaeger is running via: docker compose -f monitoring/tracing/docker-compose.tracing.yml up -d)');
});

req.write(data);
req.end();
