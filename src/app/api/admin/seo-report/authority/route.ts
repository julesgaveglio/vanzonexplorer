import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { dfsPost } from "@/lib/dataforseo";
import type { AuthorityData, SslInfo, DomainWhois, DnsInfo } from "@/types/seo-report";

interface DfsBacklinksSummary {
  rank?: number;
  backlinks?: number;
  referring_domains?: number;
}

// ─── Open PageRank (gratuit, domcop.com) ─────────────────────────────────────
async function fetchPageRank(domain: string): Promise<{ rank: number | null; decimal: number | null }> {
  const key = process.env.OPEN_PAGERANK_KEY;
  if (!key) return { rank: null, decimal: null };
  try {
    const res = await fetch(`https://openpagerank.com/api/v1.0/getPageRank?domains[]=${domain}`, {
      headers: { "API-OPR": key },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { rank: null, decimal: null };
    const data = await res.json() as { response?: Array<{ page_rank_integer?: number; page_rank_decimal?: number }> };
    const r = data.response?.[0];
    return { rank: r?.page_rank_integer ?? null, decimal: r?.page_rank_decimal ?? null };
  } catch {
    return { rank: null, decimal: null };
  }
}

// ─── RDAP / WHOIS (gratuit, sans clé) ────────────────────────────────────────
async function fetchWhois(domain: string): Promise<DomainWhois | null> {
  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/rdap+json" },
    });
    if (!res.ok) return null;
    const data = await res.json() as {
      events?: Array<{ eventAction?: string; eventDate?: string }>;
      entities?: Array<{ vcardArray?: unknown[]; roles?: string[] }>;
      nameservers?: Array<{ ldhName?: string }>;
    };

    const events = data.events ?? [];
    const created = events.find((e) => e.eventAction === "registration")?.eventDate ?? null;
    const expiry = events.find((e) => e.eventAction === "expiration")?.eventDate ?? null;
    const nameservers = (data.nameservers ?? []).map((ns) => ns.ldhName ?? "").filter(Boolean);

    // Registrar from entities
    const registrarEntity = (data.entities ?? []).find((e) => e.roles?.includes("registrar"));
    const registrar = registrarEntity
      ? (registrarEntity as { vcardArray?: Array<Array<Array<unknown>>> }).vcardArray?.[1]
          ?.find((v: unknown[]) => v[0] === "fn")?.[3] as string ?? null
      : null;

    // Domain age
    let domainAge: string | null = null;
    if (created) {
      const years = Math.floor((Date.now() - new Date(created).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      domainAge = `${years} an${years > 1 ? "s" : ""}`;
    }

    return { createdDate: created, expiryDate: expiry, registrar, nameservers, domainAge };
  } catch {
    return null;
  }
}

// ─── SSL Labs (gratuit, Qualys) ──────────────────────────────────────────────
async function fetchSsl(domain: string): Promise<SslInfo | null> {
  try {
    // Start analysis (or get cached)
    const res = await fetch(
      `https://api.ssllabs.com/api/v3/analyze?host=${domain}&fromCache=on&maxAge=24`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      endpoints?: Array<{
        grade?: string;
        details?: {
          protocols?: Array<{ name?: string; version?: string }>;
          cert?: { notBefore?: number; notAfter?: number; issuerSubject?: string };
        };
      }>;
    };

    const ep = data.endpoints?.[0];
    if (!ep) return null;

    const cert = ep.details?.cert;
    const protocols = ep.details?.protocols?.map((p) => `${p.name} ${p.version}`).join(", ") ?? null;

    return {
      grade: ep.grade ?? null,
      validFrom: cert?.notBefore ? new Date(cert.notBefore).toISOString() : null,
      validTo: cert?.notAfter ? new Date(cert.notAfter).toISOString() : null,
      issuer: cert?.issuerSubject ?? null,
      protocol: protocols,
    };
  } catch {
    return null;
  }
}

// ─── DNS (Google DNS, gratuit) ───────────────────────────────────────────────
async function fetchDns(domain: string): Promise<DnsInfo | null> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { Answer?: Array<{ data?: string; TTL?: number }> };
    const answer = data.Answer?.[0];
    return { ip: answer?.data ?? null, ttl: answer?.TTL ?? null };
  } catch {
    return null;
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const body = await req.json();
  const { url } = body;
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    // Tout en parallèle avec timeout individuel par API
    const [dfsResult, pageRankResult, whoisResult, sslResult, dnsResult] = await Promise.allSettled([
      dfsPost<DfsBacklinksSummary>(
        "/backlinks/summary/live",
        [{ target: domain, target_type: "domain", include_subdomains: true }]
      ),
      fetchPageRank(domain),
      fetchWhois(domain),
      fetchSsl(domain),
      fetchDns(domain),
    ]);

    const dfs = dfsResult.status === "fulfilled" ? dfsResult.value : null;
    const pr = pageRankResult.status === "fulfilled" ? pageRankResult.value : { rank: null, decimal: null };
    const whois = whoisResult.status === "fulfilled" ? whoisResult.value : null;
    const ssl = sslResult.status === "fulfilled" ? sslResult.value : null;
    const dns = dnsResult.status === "fulfilled" ? dnsResult.value : null;

    const data: AuthorityData = {
      domainAuthority: Math.round(dfs?.rank ?? 0),
      backlinksCount: dfs?.backlinks ?? 0,
      referringDomains: dfs?.referring_domains ?? 0,
      organicTraffic: 0,
      pageRank: pr.rank,
      pageRankDecimal: pr.decimal,
      ssl,
      whois,
      dns,
    };

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
