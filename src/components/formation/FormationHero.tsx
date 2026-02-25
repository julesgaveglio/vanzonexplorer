import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";

const GHL_BOOKING_URL = process.env.NEXT_PUBLIC_GHL_BOOKING_URL || "#";

const pills = [
  { icon: "🙋‍♂️", label: "Accompagnement" },
  { icon: "🎬", label: "Formation vidéo" },
  { icon: "🤖", label: "Outils IA inclus" },
  { icon: "🛠️", label: "Pratique & terrain" },
  { icon: "📄", label: "Administratif & VASP" },
];

export default function FormationHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #FFFFFF 0%, #EFF6FF 60%, #F0FDFF 100%)",
      }}
    >
      {/* Blobs décoratifs */}
      <div className="absolute top-20 -left-40 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-[0.10] blur-3xl" />
      <div className="absolute top-60 right-0 w-96 h-96 bg-sky-200 rounded-full opacity-[0.10] blur-3xl" />
      <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-amber-200 rounded-full opacity-[0.08] blur-3xl" />

      <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36 text-center">
        {/* Badge pill */}
        <span className="inline-flex items-center gap-2 badge-glass !bg-blue-50/80 !border-blue-200/50 !text-blue-700 !px-5 !py-2 text-sm font-medium mb-8">
          🎓 Van Business Academy
        </span>

        {/* Titre */}
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
          De 0 à tes premiers revenus
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
            de location.
          </span>
        </h1>

        {/* Sous-titre */}
        <p className="text-xl text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
          Jules et Elio t&apos;accompagnent de l&apos;achat du fourgon
          jusqu&apos;au premier euro généré — sans expérience requise.
        </p>

        {/* Pills de réassurance */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {pills.map((p) => (
            <span
              key={p.label}
              className="badge-glass !px-4 !py-2 text-sm text-slate-600 font-medium"
            >
              {p.icon} {p.label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <LiquidButton href={GHL_BOOKING_URL} external size="lg">
            Réserver mon appel gratuit →
          </LiquidButton>
          <LiquidButton variant="ghost" href="#programme" size="lg">
            Découvrir le programme ↓
          </LiquidButton>
        </div>

        {/* Image hero — placeholder tant que les vraies photos ne sont pas ajoutées */}
        <div className="relative mt-16 mx-auto max-w-4xl">
          <Image
            src="https://iili.io/qKw6yru.png"
            alt="Presentation formation van business academy vanzon explorer"
            width={1200}
            height={800}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
}
