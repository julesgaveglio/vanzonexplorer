interface CamboMapSectionProps {
  destination?: string;
  distance?: string;
}

export default function CamboMapSection({ destination, distance }: CamboMapSectionProps) {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h3 className="text-xl font-black text-slate-900 mb-2 text-center">
          Votre point de départ : Cambo-les-Bains
        </h3>
        <p className="text-slate-500 text-center text-sm mb-6">
          {destination && distance
            ? `À ${distance} de ${destination}. Remise des clés sur place, parking gratuit.`
            : "Remise des clés sur place, parking gratuit."}
        </p>
        <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
          <iframe
            src="https://maps.google.com/maps?q=Cambo-les-Bains,64250,France&t=&z=13&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Cambo-les-Bains — Point de départ Vanzon Explorer"
          />
        </div>
      </div>
    </section>
  );
}
