import { dnsResolveA } from "./dnsResolve";
import { geoForIpsBatch } from "./ipApiGeo";
import { mapPool } from "./mapPool";
import { parseNetAddress } from "./parseNetAddress";
import type { GeoSummary, ParsedNetAddress, ValidatorGeoEntry } from "./types";

function resolvedIpFromParsed(parsed: ParsedNetAddress): string | null {
  if (parsed.kind === "ip4" || parsed.kind === "ip6") return parsed.ip;
  return null;
}

export async function enrichValidatorsGeo(
  fetchFn: typeof fetch,
  validators: { iotaAddress: string; netAddress: string }[],
): Promise<ValidatorGeoEntry[]> {
  const parsedList = validators.map((v) => ({
    iotaAddress: v.iotaAddress,
    netAddress: v.netAddress,
    parsed: parseNetAddress(v.netAddress),
  }));

  const hostnames = new Set<string>();
  for (const row of parsedList) {
    if (row.parsed.kind === "hostname") hostnames.add(row.parsed.host);
  }

  const hostList = [...hostnames];
  const resolvedHosts = await mapPool(hostList, 12, (host) => dnsResolveA(fetchFn, host));
  const hostToIp = new Map(hostList.map((h, i) => [h, resolvedHosts[i] ?? null]));

  const ipsNeeded = new Set<string>();
  for (const row of parsedList) {
    const direct = resolvedIpFromParsed(row.parsed);
    if (direct) ipsNeeded.add(direct);
    else if (row.parsed.kind === "hostname") {
      const ip = hostToIp.get(row.parsed.host);
      if (ip) ipsNeeded.add(ip);
    }
  }

  const ipList = [...ipsNeeded];
  const ipToGeo = ipList.length
    ? await geoForIpsBatch(fetchFn, ipList)
    : new Map<string, GeoSummary | null>();

  return parsedList.map((row): ValidatorGeoEntry => {
    const resolvedIp =
      row.parsed.kind === "hostname"
        ? (hostToIp.get(row.parsed.host) ?? null)
        : resolvedIpFromParsed(row.parsed);

    let error: string | undefined;
    if (row.parsed.kind === "unsupported") error = "unsupported_net_address";
    else if (row.parsed.kind === "hostname" && !resolvedIp) error = "dns_resolution_failed";
    else if (resolvedIp) {
      const g = ipToGeo.get(resolvedIp);
      if (g === undefined || g === null) error = "geo_lookup_failed";
    }

    const geo = resolvedIp ? (ipToGeo.get(resolvedIp) ?? null) : null;

    return {
      iotaAddress: row.iotaAddress,
      netAddress: row.netAddress,
      parsed: row.parsed,
      geo,
      ...(error ? { error } : {}),
    };
  });
}
