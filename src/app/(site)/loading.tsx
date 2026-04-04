export default function SiteLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-bg-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-accent-blue/20 border-t-accent-blue animate-spin" />
        <p className="text-text-primary/40 text-sm">Chargement…</p>
      </div>
    </div>
  );
}
