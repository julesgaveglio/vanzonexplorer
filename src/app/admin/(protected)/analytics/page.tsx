import AnalyticsDashboard from "./_components/AnalyticsDashboard";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics — Tous canaux</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visiteurs et conversions par canal d&apos;acquisition — SEO, Google Ads, Meta, direct…
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
