import type { ParsedNetAddress } from "./types";

const HOST_KINDS = new Set(["dns", "dns4", "dns6", "dnsaddr"]);

export function parseNetAddress(netAddress: string): ParsedNetAddress {
  const parts = netAddress.split("/").filter(Boolean);
  if (parts.length < 2) return { kind: "unsupported" };

  const kind = parts[0].toLowerCase();
  const value = parts[1];

  if (!value) return { kind: "unsupported" };

  if (HOST_KINDS.has(kind)) return { kind: "hostname", host: value };
  if (kind === "ip4") return { kind: "ip4", ip: value };
  if (kind === "ip6") return { kind: "ip6", ip: value };

  return { kind: "unsupported" };
}
