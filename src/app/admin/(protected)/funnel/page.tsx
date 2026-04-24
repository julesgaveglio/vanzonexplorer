import FunnelDashboardClient from "./_components/FunnelDashboardClient";

export default function AdminFunnelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tunnel VBA — Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tracking 100% fiable côté serveur — aucune perte (ad blockers, iOS)
        </p>
      </div>
      <FunnelDashboardClient />
    </div>
  );
}
