import FunnelTabsClient from "./_components/FunnelTabsClient";

export default function AdminFunnelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">VBA — Acquisition</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tunnel, campagnes, leads — données 100% fiables
        </p>
      </div>
      <FunnelTabsClient />
    </div>
  );
}
