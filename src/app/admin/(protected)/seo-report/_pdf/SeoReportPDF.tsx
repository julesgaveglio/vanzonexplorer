"use client";
import {
  Document, Page, Text, View, StyleSheet
} from "@react-pdf/renderer";
import type { SeoReportData } from "@/types/seo-report";

const C = {
  accent:  "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  danger:  "#EF4444",
  text:    "#1E293B",
  muted:   "#64748B",
  bg:      "#F8FAFC",
  white:   "#FFFFFF",
};

function scoreColor(score: number) {
  return score >= 80 ? C.success : score >= 50 ? C.warning : C.danger;
}

const s = StyleSheet.create({
  page:       { padding: 40, fontFamily: "Helvetica", backgroundColor: C.white },
  coverPage:  { padding: 40, fontFamily: "Helvetica", backgroundColor: C.accent, justifyContent: "center", alignItems: "center" },
  coverTitle: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8 },
  coverUrl:   { fontSize: 20, color: C.white, fontFamily: "Helvetica-Bold", marginBottom: 40, textAlign: "center" },
  coverScore: { fontSize: 72, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 },
  coverLabel: { fontSize: 16, color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 40 },
  coverDate:  { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  coverFooter:{ position: "absolute", bottom: 30, fontSize: 10, color: "rgba(255,255,255,0.5)" },
  sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 12, borderBottomWidth: 2, borderBottomColor: C.accent, paddingBottom: 6 },
  row:        { flexDirection: "row", gap: 10, marginBottom: 10 },
  card:       { flex: 1, backgroundColor: C.bg, borderRadius: 6, padding: 10 },
  cardValue:  { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 2 },
  cardLabel:  { fontSize: 9, color: C.muted },
  tableRow:   { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingVertical: 6 },
  tableCell:  { flex: 1, fontSize: 9, color: C.text },
  tableCellBold: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: C.text },
  badgeGreen:  { backgroundColor: "#D1FAE5", color: "#065F46", fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeOrange: { backgroundColor: "#FEF3C7", color: "#92400E", fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeRed:    { backgroundColor: "#FEE2E2", color: "#991B1B", fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeIndigo: { backgroundColor: "#E0E7FF", color: "#3730A3", fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  body:       { fontSize: 10, color: C.text, lineHeight: 1.5, marginBottom: 6 },
  mutedText:  { fontSize: 9, color: C.muted, marginBottom: 4 },
  footer:     { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: C.muted },
});

function Footer({ url }: { url: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Rapport SEO — {url}</Text>
      <Text style={s.footerText}>Rapport généré par Vanzon Explorer</Text>
    </View>
  );
}

export default function SeoReportPDF({ report }: { report: SeoReportData }) {
  const date = new Date(report.generatedAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric"
  });
  const sc = scoreColor(report.scoreGlobal);

  return (
    <Document title={`Rapport SEO — ${report.url}`} author="Vanzon Explorer">

      {/* PAGE 1 — Couverture */}
      <Page size="A4" style={s.coverPage}>
        <Text style={s.coverTitle}>Rapport SEO</Text>
        <Text style={s.coverUrl}>{report.url}</Text>
        <Text style={[s.coverScore, { color: sc }]}>{report.scoreGlobal}</Text>
        <Text style={[s.coverLabel, { color: sc }]}>
          {report.scoreGlobal >= 80 ? "Bon" : report.scoreGlobal >= 50 ? "À améliorer" : "Critique"} / 100
        </Text>
        <Text style={s.coverDate}>{date}</Text>
        <Text style={s.coverFooter}>Rapport généré par Vanzon Explorer</Text>
      </Page>

      {/* PAGE 2 — Performance */}
      {report.pagespeed && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>Performance technique</Text>
          <View style={s.row}>
            {(["performance","seo","accessibility","bestPractices"] as const).map((k) => (
              <View key={k} style={s.card}>
                <Text style={[s.cardValue, { color: scoreColor(report.pagespeed!.mobile.scores[k]) }]}>
                  {report.pagespeed!.mobile.scores[k]}
                </Text>
                <Text style={s.cardLabel}>
                  {k === "performance" ? "Performance" : k === "seo" ? "SEO" : k === "accessibility" ? "Accessibilité" : "Bonnes pratiques"} (mobile)
                </Text>
              </View>
            ))}
          </View>
          <Text style={[s.mutedText, { marginTop: 10, marginBottom: 6 }]}>Core Web Vitals (mobile)</Text>
          <View style={s.row}>
            {(["lcp","cls","tbt","fcp"] as const).map((k) => {
              const vital = report.pagespeed!.mobile.vitals[k];
              return (
                <View key={k} style={s.card}>
                  <Text style={[s.cardValue, { fontSize: 14, color: vital.score === null ? C.muted : scoreColor(Math.round((vital.score ?? 0) * 100)) }]}>
                    {vital.value}
                  </Text>
                  <Text style={s.cardLabel}>{k.toUpperCase()}</Text>
                </View>
              );
            })}
          </View>
          {report.pagespeed.mobile.opportunities.length > 0 && (
            <>
              <Text style={[s.mutedText, { marginTop: 10, marginBottom: 6 }]}>Opportunités</Text>
              {report.pagespeed.mobile.opportunities.map((opp) => (
                <View key={opp.id} style={[s.tableRow, { alignItems: "center" }]}>
                  <Text style={[s.tableCell, { flex: 3 }]}>{opp.title}</Text>
                  <Text style={[s.tableCell, { color: C.warning, textAlign: "right" }]}>−{Math.round(opp.savingsMs)}ms</Text>
                </View>
              ))}
            </>
          )}
          <Footer url={report.url} />
        </Page>
      )}

      {/* PAGE 3 — On-page */}
      {report.onpage && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>Audit on-page — Score : {report.onpage.score}/100</Text>
          {report.onpage.items.map((item) => (
            <View key={item.key} style={[s.tableRow, { alignItems: "center" }]}>
              <Text style={[s.tableCell, { flex: 0.3, color: item.pass ? C.success : C.danger }]}>
                {item.pass ? "✓" : "✗"}
              </Text>
              <Text style={[s.tableCell, { flex: 3 }]}>{item.label}</Text>
              <Text style={[s.tableCell, { flex: 2, color: C.muted }]}>{item.detail ?? item.value ?? ""}</Text>
            </View>
          ))}
          {report.onpage.totalImages > 0 && (
            <Text style={[s.body, { marginTop: 12, color: report.onpage.imagesWithoutAlt === 0 ? C.success : C.warning }]}>
              {report.onpage.imagesWithoutAlt === 0
                ? `Toutes les ${report.onpage.totalImages} images ont un attribut alt`
                : `${report.onpage.imagesWithoutAlt} image(s) sans alt sur ${report.onpage.totalImages}`}
            </Text>
          )}
          <Footer url={report.url} />
        </Page>
      )}

      {/* PAGE 4 — Autorité + Concurrents */}
      {(report.authority || report.competitors) && (
        <Page size="A4" style={s.page}>
          {report.authority && (
            <>
              <Text style={s.sectionTitle}>Autorité du domaine</Text>
              <View style={s.row}>
                <View style={s.card}>
                  <Text style={[s.cardValue, { color: scoreColor(report.authority.domainAuthority) }]}>
                    {report.authority.domainAuthority}
                  </Text>
                  <Text style={s.cardLabel}>Domain Authority / 100</Text>
                </View>
                <View style={s.card}>
                  <Text style={s.cardValue}>{report.authority.backlinksCount.toLocaleString("fr-FR")}</Text>
                  <Text style={s.cardLabel}>Backlinks</Text>
                </View>
                <View style={s.card}>
                  <Text style={s.cardValue}>{report.authority.referringDomains.toLocaleString("fr-FR")}</Text>
                  <Text style={s.cardLabel}>Domaines référents</Text>
                </View>
              </View>
            </>
          )}
          {report.competitors && report.competitors.competitors.length > 0 && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 16 }]}>Concurrents organiques</Text>
              {report.competitors.competitors.map((c, i) => (
                <View key={c.domain} style={[s.tableRow, { alignItems: "center" }]}>
                  <Text style={[s.tableCell, { flex: 0.3, color: C.accent }]}>{i + 1}</Text>
                  <Text style={[s.tableCellBold, { flex: 3 }]}>{c.domain}</Text>
                  <Text style={[s.tableCell, { color: C.muted }]}>{c.intersections} mots-clés communs</Text>
                  <Text style={[s.tableCell, { color: C.accent, textAlign: "right" }]}>Pertinence {c.relevance}%</Text>
                </View>
              ))}
            </>
          )}
          <Footer url={report.url} />
        </Page>
      )}

      {/* PAGE 5 — Recommandations IA */}
      {report.aiInsights && (
        <Page size="A4" style={s.page}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={[s.sectionTitle, { marginBottom: 0, borderBottomWidth: 0 }]}>Recommandations IA</Text>
            <View style={s.badgeIndigo}>
              <Text>Secteur : {report.aiInsights.secteur}</Text>
            </View>
          </View>
          {report.aiInsights.axes.map((axe, i) => {
            const badge = axe.priorite === "Fort" ? s.badgeRed : axe.priorite === "Moyen" ? s.badgeOrange : s.badgeIndigo;
            return (
              <View key={i} style={{ backgroundColor: C.bg, borderRadius: 6, padding: 10, marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <View style={badge}><Text>{axe.priorite}</Text></View>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text }}>{axe.titre}</Text>
                </View>
                <Text style={[s.body, { marginBottom: 2 }]}>{axe.description}</Text>
                <Text style={[s.mutedText, { color: C.accent }]}>{axe.impact}</Text>
              </View>
            );
          })}
          <View style={{ backgroundColor: "#EEF2FF", borderRadius: 6, padding: 12, marginTop: 8 }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.accent, marginBottom: 6 }}>
              CONCLUSION
            </Text>
            <Text style={s.body}>{report.aiInsights.conclusion}</Text>
          </View>
          <Footer url={report.url} />
        </Page>
      )}
    </Document>
  );
}
