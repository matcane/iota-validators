import type { ValidatorsGeoRequestBody } from "./types";

const MAX_VALIDATORS_GEO = 200;
const MAX_EPOCH_LEN = 32;
const MAX_IOTA_ADDR_LEN = 128;
const MAX_NET_ADDR_LEN = 512;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function parseValidatorsGeoRequest(body: unknown): ValidatorsGeoRequestBody | null {
  if (!isRecord(body)) return null;
  const epochRaw = body.epoch;
  if (typeof epochRaw !== "string") return null;
  const epoch = epochRaw.trim();
  if (epoch.length < 1 || epoch.length > MAX_EPOCH_LEN) return null;

  const validatorsRaw = body.validators;
  if (!Array.isArray(validatorsRaw)) return null;
  if (validatorsRaw.length === 0 || validatorsRaw.length > MAX_VALIDATORS_GEO) return null;

  const validators: { iotaAddress: string; netAddress: string }[] = [];
  for (const item of validatorsRaw) {
    if (!isRecord(item)) return null;
    const { iotaAddress, netAddress } = item;
    if (typeof iotaAddress !== "string" || typeof netAddress !== "string") return null;
    if (iotaAddress.length > MAX_IOTA_ADDR_LEN || netAddress.length > MAX_NET_ADDR_LEN) return null;
    if (!iotaAddress.startsWith("0x")) return null;
    validators.push({ iotaAddress, netAddress });
  }

  return { epoch, validators };
}
