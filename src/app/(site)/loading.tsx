export default function SiteLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">

      {/* Barre de progression en haut */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
        <div
          style={{
            position: "absolute",
            top: 0,
            height: "100%",
            width: "55%",
            background:
              "linear-gradient(90deg, transparent 0%, #3B82F6 30%, #0EA5E9 70%, transparent 100%)",
            animation: "vanzon-bar 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
      </div>

      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png"
        alt=""
        aria-hidden="true"
        width={44}
        height={44}
        style={{ marginBottom: 20, opacity: 0.7 }}
      />

      {/* Dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[0, 0.18, 0.36].map((delay, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)",
              animation: `vanzon-dot 0.75s ease-in-out ${delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes vanzon-bar {
          0%   { left: -60%; }
          100% { left: 110%; }
        }
        @keyframes vanzon-dot {
          0%   { opacity: 0.35; transform: translateY(0px); }
          100% { opacity: 1;    transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
