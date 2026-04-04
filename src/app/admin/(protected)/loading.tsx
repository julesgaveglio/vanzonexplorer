export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#0f1117]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-white/60 animate-spin" />
        <p className="text-white/30 text-xs tracking-widest uppercase">
          Chargement
        </p>
      </div>
    </div>
  );
}
