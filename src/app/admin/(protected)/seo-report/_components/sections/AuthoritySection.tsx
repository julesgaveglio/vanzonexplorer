import type { AuthorityData } from "@/types/seo-report";

function Badge({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className={`text-lg font-bold ${color ?? "text-slate-800"}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function sslColor(grade: string | null): string {
  if (!grade) return "text-slate-400";
  if (grade.startsWith("A")) return "text-emerald-600";
  if (grade === "B") return "text-amber-600";
  return "text-red-600";
}

export default function AuthoritySection({ data }: { data: AuthorityData }) {
  const daColor = data.domainAuthority >= 50 ? "text-emerald-600" : data.domainAuthority >= 25 ? "text-amber-600" : "text-red-600";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <h3 className="text-base font-semibold text-slate-800">Autorité & Infrastructure</h3>

      {/* Row 1 : DA + Backlinks + Referring domains + PageRank */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className={`text-3xl font-bold ${daColor}`}>{data.domainAuthority}</div>
          <div className="text-xs text-slate-500 mt-1">Domain Authority</div>
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(data.domainAuthority, 100)}%` }} />
          </div>
        </div>
        <Badge label="Backlinks" value={data.backlinksCount.toLocaleString("fr-FR")} />
        <Badge label="Domaines référents" value={data.referringDomains.toLocaleString("fr-FR")} />
        <Badge
          label="PageRank"
          value={data.pageRank != null ? String(data.pageRank) : "—"}
          color={data.pageRank != null && data.pageRank >= 3 ? "text-emerald-600" : "text-slate-600"}
        />
      </div>

      {/* Row 2 : SSL + WHOIS + DNS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Badge
          label="SSL Grade"
          value={data.ssl?.grade ?? "—"}
          color={sslColor(data.ssl?.grade ?? null)}
        />
        <Badge label="Âge domaine" value={data.whois?.domainAge ?? "—"} />
        <Badge
          label="Expiration"
          value={data.whois?.expiryDate ? new Date(data.whois.expiryDate).toLocaleDateString("fr-FR") : "—"}
        />
        <Badge label="IP" value={data.dns?.ip ?? "—"} />
      </div>

      {/* Row 3 : Details */}
      {(data.whois || data.ssl) && (
        <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
          {data.whois?.registrar && <p>Registrar : {data.whois.registrar}</p>}
          {data.whois?.nameservers && data.whois.nameservers.length > 0 && (
            <p>Nameservers : {data.whois.nameservers.join(", ")}</p>
          )}
          {data.ssl?.issuer && <p>SSL Issuer : {data.ssl.issuer}</p>}
          {data.ssl?.protocol && <p>Protocoles : {data.ssl.protocol}</p>}
          {data.dns?.ttl != null && <p>DNS TTL : {data.dns.ttl}s</p>}
        </div>
      )}
    </div>
  );
}
