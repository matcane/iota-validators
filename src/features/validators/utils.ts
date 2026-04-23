import type { IotaValidatorSummary } from "@iota/iota-sdk/client";

import type { ValidatorGeoEntry } from "./types";

export interface ValidatorRpcFields extends IotaValidatorSummary {
  effectiveCommissionRate?: string | null;
}

const IOTA_DECIMALS = 1_000_000_000n;

export function formatCompactNumber(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatStakeFromRaw(raw: string): string {
  try {
    const nano = BigInt(raw);
    const whole = Number(nano / IOTA_DECIMALS);
    return `${formatCompactNumber(whole)} IOTA`;
  } catch {
    return "—";
  }
}

export function votingPowerPercent(raw: string): string {
  return `${+raw / 100} %`;
}

export function geoLine(entry: ValidatorGeoEntry | undefined) {
  if (!entry?.geo) return "";
  const { city, region, country } = entry.geo;
  const parts = [city, region, country].filter(Boolean);
  return parts.length ? parts.join(", ") : "";
}

export function formatNanoIota(raw: string): string {
  try {
    const nano = BigInt(raw);
    const iota = Number(nano) / Number(IOTA_DECIMALS);
    if (!Number.isFinite(iota)) return "—";
    if (iota === 0) return "0 IOTA";
    if (iota < 1000) {
      return `${iota.toLocaleString(undefined, { maximumFractionDigits: iota < 1 ? 9 : 6 })} IOTA`;
    }
    return formatStakeFromRaw(raw);
  } catch {
    return "—";
  }
}

export function formatPoolTokenFromRaw(raw: string): string {
  try {
    const whole = Number(BigInt(raw) / IOTA_DECIMALS);
    if (!Number.isFinite(whole)) return "—";
    return `${formatCompactNumber(whole)} pool tokens`;
  } catch {
    return "—";
  }
}

export function commissionPercentFromIotaRate(raw: string): string {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return "—";
  try {
    const n = BigInt(trimmed);
    const whole = n / 100n;
    const frac2 = n % 100n;
    if (frac2 === 0n) return `${whole}%`;
    const fracStr = frac2.toString().padStart(2, "0");
    return `${whole}.${fracStr.replace(/0+$/, "") || "0"}%`;
  } catch {
    return "—";
  }
}

export function commissionDisplayRate(validator: ValidatorRpcFields): string {
  const eff = validator.effectiveCommissionRate;
  if (eff != null && String(eff).trim() !== "") {
    return commissionPercentFromIotaRate(String(eff));
  }
  return commissionPercentFromIotaRate(validator.commissionRate);
}
