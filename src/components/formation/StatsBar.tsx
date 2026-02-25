const stats = [
  { value: "2", label: "Vans construits et testés en conditions réelles" },
  { value: "9", label: "Modules de formation" },
  { value: "50+", label: "Vidéos pratiques" },
  { value: "0€", label: "Compétences en bricolage requises" },
];

export default function StatsBar() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass-card text-center p-6"
            >
              <p className="text-3xl md:text-4xl font-black text-amber-500">
                {s.value}
              </p>
              <p className="text-sm text-slate-500 mt-2 leading-snug">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
