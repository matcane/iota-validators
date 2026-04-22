import { Hono } from "hono";
import { cors } from "hono/cors";

import { enrichValidatorsGeo, parseValidatorsGeoRequest } from "./geo";
import type { Env } from "./types";

const DEVICE_ID_MIN = 8;
const DEVICE_ID_MAX = 128;
const DEVICE_ID_RE = /^[A-Za-z0-9._-]+$/;

const ALLOWED_RPC_METHODS = new Set<string>([
  "iotax_getLatestIotaSystemState",
  "iotax_getLatestIotaSystemStateV2",
  "iota_getCheckpoint",
  "iota_getLatestCheckpointSequenceNumber",
  "iota_getProtocolConfig",
]);

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: unknown;
  method?: string;
  params?: unknown;
};

function validateDeviceId(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.length < DEVICE_ID_MIN || raw.length > DEVICE_ID_MAX) return null;
  if (!DEVICE_ID_RE.test(raw)) return null;
  return raw;
}

function rpcError(id: unknown, code: number, message: string): Response {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (context, next) => {
  const allowed = (context.env.ALLOWED_ORIGINS ?? "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origin = context.req.header("origin") ?? "";
  const match =
    allowed.includes("*") || allowed.includes(origin) ? origin || "*" : allowed[0] || "*";
  return cors({
    origin: match,
    allowHeaders: ["content-type", "x-device-id"],
    allowMethods: ["POST", "OPTIONS"],
    maxAge: 86400,
  })(context, next);
});

app.get("/", (context) => context.json({ ok: true, service: "iota-validators-proxy" }));

app.post("/rpc", async (context) => {
  const deviceId = validateDeviceId(context.req.header("x-device-id"));
  if (!deviceId) return context.json({ error: "Invalid x-device-id" }, 400);

  const ip = context.req.header("cf-connecting-ip") ?? "unknown";

  const [ipCheck, deviceCheck] = await Promise.all([
    context.env.RL_IP.limit({ key: `rpc:ip:${ip}` }),
    context.env.RL_DEVICE.limit({ key: `rpc:dev:${deviceId}` }),
  ]);

  if (!ipCheck.success || !deviceCheck.success) {
    return context.json({ error: "Rate limit exceeded" }, 429);
  }

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = await context.req.json<JsonRpcRequest | JsonRpcRequest[]>();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  const batch = Array.isArray(body) ? body : [body];

  if (batch.length === 0 || batch.length > 20) {
    return rpcError(null, -32600, "Invalid batch size");
  }

  for (const req of batch) {
    if (!req || typeof req !== "object") {
      return rpcError(null, -32600, "Invalid request");
    }

    if (!req.method || !ALLOWED_RPC_METHODS.has(req.method)) {
      return rpcError(req.id, -32601, `Method not allowed ${req.method}`);
    }
  }

  const upstream = await fetch(context.env.IOTA_UPSTREAM_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
});

app.post("/validators-geo", async (context) => {
  const deviceId = validateDeviceId(context.req.header("x-device-id"));
  if (!deviceId) return context.json({ error: "Invalid x-device-id" }, 400);

  const ip = context.req.header("cf-connecting-ip") ?? "unknown";

  const [ipCheck, deviceCheck] = await Promise.all([
    context.env.RL_IP.limit({ key: `vgeo:ip:${ip}` }),
    context.env.RL_DEVICE.limit({ key: `vgeo:dev:${deviceId}` }),
  ]);

  if (!ipCheck.success || !deviceCheck.success) {
    return context.json({ error: "Rate limit exceeded" }, 429);
  }

  let body: unknown;
  try {
    body = await context.req.json();
  } catch {
    return context.json({ error: "Invalid JSON" }, 400);
  }

  const parsed = parseValidatorsGeoRequest(body);
  if (!parsed) return context.json({ error: "Invalid body" }, 400);

  const validatorGeo = await enrichValidatorsGeo(fetch, parsed.validators);

  return context.json({
    epoch: parsed.epoch,
    validatorGeo,
  });
});

app.notFound((context) => context.json({ error: "Not found" }, 404));

app.onError((error, context) => {
  console.error(error);
  return context.json({ error: "Internal error" }, 500);
});

export default app;
