import Image from "next/image";

interface InfoRow {
  label: string;
  value: string;
}

interface PracticalInfoSectionProps {
  title: string;
  rows: InfoRow[];
  image: string;
  imageAlt: string;
}

export default function PracticalInfoSection({ title, rows, image, imageAlt }: PracticalInfoSectionProps) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Image — visible en premier sur mobile */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl order-first lg:order-last">
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          {/* Contenu */}
          <div className="order-last lg:order-first">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8">{title}</h2>
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="group flex gap-4 bg-slate-50 hover:bg-blue-50/60 rounded-2xl p-4 transition-colors"
                >
                  <div className="w-1 rounded-full bg-gradient-to-b from-[#4D5FEC] to-[#4BC3E3] flex-shrink-0 self-stretch min-h-[2rem]" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#4D5FEC] uppercase tracking-widest mb-1">
                      {row.label}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
