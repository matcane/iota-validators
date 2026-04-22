type DnsJsonAnswer = { data?: string };
type DnsJsonResponse = { Status?: number; Answer?: DnsJsonAnswer[] };

export async function dnsResolveA(fetchFn: typeof fetch, hostname: string): Promise<string | null> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`;
  const res = await fetchFn(url, {
    headers: { accept: "application/dns-json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as DnsJsonResponse;
  if (data.Status !== 0 || !data.Answer?.length) return null;
  const record = data.Answer.find((a) => a.data);
  return record?.data?.trim() ?? null;
}
