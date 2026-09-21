import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import http from "http";
import crypto from "crypto";

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

export interface TracingConfig {
  serviceName: string;
  jaegerOtlpEndpoint?: string;
}

function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function parseTraceParent(header?: string | string[]): { traceId: string; parentSpanId?: string } | null {
  if (!header || typeof header !== "string") return null;
  const parts = header.trim().split("-");
  if (parts.length >= 4 && parts[1].length === 32 && parts[2].length === 16) {
    return {
      traceId: parts[1],
      parentSpanId: parts[2],
    };
  }
  return null;
}

export function formatTraceParent(context: TraceContext): string {
  return `00-${context.traceId}-${context.spanId}-01`;
}

/**
 * Dispatches an OpenTelemetry JSON trace span to Jaeger's OTLP HTTP receiver (port 4318)
 */
export function sendSpanToJaeger(
  endpoint: string,
  serviceName: string,
  spanName: string,
  traceId: string,
  spanId: string,
  parentSpanId: string | undefined,
  startTimeNano: bigint,
  endTimeNano: bigint,
  attributes: Record<string, string | number | boolean>
): void {
  const url = new URL(endpoint.endsWith("/v1/traces") ? endpoint : `${endpoint}/v1/traces`);

  const otelAttributes = Object.entries(attributes).map(([key, value]) => {
    if (typeof value === "number") {
      return { key, value: Number.isInteger(value) ? { intValue: value } : { doubleValue: value } };
    }
    if (typeof value === "boolean") {
      return { key, value: { boolValue: value } };
    }
    return { key, value: { stringValue: String(value) } };
  });

  const spanObj: any = {
    traceId,
    spanId,
    name: spanName,
    kind: 2, // SPAN_KIND_SERVER
    startTimeUnixNano: startTimeNano.toString(),
    endTimeUnixNano: endTimeNano.toString(),
    attributes: otelAttributes,
    status: {
      code: Number(attributes["http.status_code"]) >= 500 ? 2 : 1, // 2: ERROR, 1: OK
    },
  };

  if (parentSpanId) {
    spanObj.parentSpanId = parentSpanId;
  }

  const payload = JSON.stringify({
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: serviceName } },
            { key: "telemetry.sdk.name", value: { stringValue: "ecom-opentelemetry" } },
            { key: "telemetry.sdk.language", value: { stringValue: "nodejs" } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: "ecom-tracer", version: "1.0.0" },
            spans: [spanObj],
          },
        ],
      },
    ],
  });

  const req = http.request(
    {
      hostname: url.hostname,
      port: url.port || 4318,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 1000,
    },
    (res) => {
      res.resume(); // Drain stream
    }
  );

  req.on("error", () => {
    // Non-blocking: fail silently if Jaeger is not running so service operations are uninterrupted
  });

  req.write(payload);
  req.end();
}

/**
 * Fastify Distributed Tracing Plugin
 */
export function createTracingPlugin(config: TracingConfig): FastifyPluginAsync {
  const defaultEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || process.env.JAEGER_ENDPOINT || "http://127.0.0.1:4318";
  const jaegerEndpoint = config.jaegerOtlpEndpoint || defaultEndpoint;
  const serviceName = config.serviceName;

  const plugin: FastifyPluginAsync = async (fastify) => {
    fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
      const now = BigInt(Date.now()) * 1000000n;
      (request as any).traceStartTimeNano = now;

      // Extract W3C traceparent or generate new Trace ID
      const incomingHeader = request.headers["traceparent"];
      const parsed = parseTraceParent(incomingHeader);

      const traceId = parsed ? parsed.traceId : randomHex(16);
      const spanId = randomHex(8);
      const parentSpanId = parsed?.parentSpanId;

      const traceContext: TraceContext = { traceId, spanId, parentSpanId };
      (request as any).traceContext = traceContext;

      // Propagate Trace ID in downstream response headers
      reply.header("traceparent", `00-${traceId}-${spanId}-01`);
      reply.header("x-trace-id", traceId);
    });

    fastify.addHook("onResponse", async (request: FastifyRequest, reply: FastifyReply) => {
      const startTimeNano = (request as any).traceStartTimeNano as bigint;
      const traceContext = (request as any).traceContext as TraceContext;
      if (!startTimeNano || !traceContext) return;

      const path = request.url.split("?")[0];
      // Skip health and metrics requests to avoid trace pollution
      if (path === "/health" || path === "/metrics") return;

      const route = request.routeOptions?.url || path || "unknown";
      const endTimeNano = BigInt(Date.now()) * 1000000n;

      sendSpanToJaeger(
        jaegerEndpoint,
        serviceName,
        `${request.method} ${route}`,
        traceContext.traceId,
        traceContext.spanId,
        traceContext.parentSpanId,
        startTimeNano,
        endTimeNano,
        {
          "http.method": request.method,
          "http.route": route,
          "http.url": request.url,
          "http.status_code": reply.statusCode,
          "service.name": serviceName,
        }
      );
    });
  };

  return fp(plugin, {
    name: `fastify-tracing-${config.serviceName}`,
  });
}
