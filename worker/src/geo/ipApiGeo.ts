import type { GeoSummary } from "./types";

type IpApiBatchRow = {
  query?: string;
  status?: string;
  country?: string;
  regionName?: string;
  city?: string;
  lat?: number;
  lon?: number;
};

const BATCH_URL =
  "http://ip-api.com/batch?fields=status,message,country,regionName,city,lat,lon,isp,query";
const CHUNK_SIZE = 100;

const CHUNK_GAP_MS = 1400;

function rowToGeo(row: IpApiBatchRow): GeoSummary | null {
  if (row.status !== "success") return null;
  if (typeof row.lat !== "number" || typeof row.lon !== "number") return null;
  return {
    country: row.country ?? "",
    region: row.regionName ?? "",
    city: row.city ?? "",
    latitude: row.lat,
    longitude: row.lon,
  };
}

export async function geoForIpsBatch(
  fetchFn: typeof fetch,
  ips: string[],
): Promise<Map<string, GeoSummary | null>> {
  const out = new Map<string, GeoSummary | null>();

  for (let offset = 0; offset < ips.length; offset += CHUNK_SIZE) {
    if (offset > 0) {
      await new Promise((r) => setTimeout(r, CHUNK_GAP_MS));
    }

    const chunk = ips.slice(offset, offset + CHUNK_SIZE);
    for (const ip of chunk) out.set(ip, null);

    let res: Response;
    try {
      res = await fetchFn(BATCH_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(chunk.map((query) => ({ query }))),
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      continue;
    }

    if (!res.ok) continue;

    let rows: unknown;
    try {
      rows = await res.json();
    } catch {
      continue;
    }

    if (!Array.isArray(rows)) continue;

    for (const raw of rows) {
      const row = raw as IpApiBatchRow;
      const ip = row.query;
      if (typeof ip !== "string") continue;
      out.set(ip, rowToGeo(row));
    }
  }

  return out;
}
