// src/components/ui/ScrollingBanner.tsx
// Bandeau d'images défilant en continu (marquee CSS infini).
// Responsive : hauteur 160px mobile, 200px desktop.

'use client'

import Image from 'next/image'

// Images emblématiques Pays Basque (sélection manuelle des meilleurs POIs)
const BANNER_IMAGES = [
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/grande-plage-885a3d70.webp', alt: 'Grande Plage de Biarritz' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/la-rhune-cb9d1b78.webp', alt: 'La Rhune — sommet montagne Pays Basque' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/gorges-de-kakuetta-1e07f008.webp', alt: 'Gorges de Kakuetta — canyon Pays Basque' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/hendaye-plage-7c9a44b4.webp', alt: 'Plage d\'Hendaye — côte basque' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/l-atelier-du-piment-106857f7.webp', alt: 'Piment d\'Espelette — culture basque' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/les-chalets-d-iraty-4a28da05.webp', alt: 'Forêt d\'Iraty — Pyrénées basques' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/ur-bizia-rafting-7103dd7f.webp', alt: 'Rafting sur la Nive — Bidarray' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/plage-de-mayarko-3a9bfb09.webp', alt: 'Plage de Mayarko — Guéthary' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/le-chat-perche-aa9df487.webp', alt: 'Saint-Jean-Pied-de-Port — village basque' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/mondarrain-18e9e109.webp', alt: 'Mondarrain — randonnée montagne Itxassou' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/kako-extea-3b954ac8.webp', alt: 'Kako Extea — pintxos Saint-Jean-de-Luz' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/cenitz-beach-d9120b1b.webp', alt: 'Cenitz — crique secrète Guéthary' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/via-ferrata-du-pays-basque-70e3a70d.webp', alt: 'Via ferrata — aventure Bidarray' },
  { src: 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi/musee-basque-et-de-l-histoire-de-bayonne-ee197a01.webp', alt: 'Musée Basque — Bayonne' },
]

export default function ScrollingBanner() {
  // On double la liste pour le loop infini
  const images = [...BANNER_IMAGES, ...BANNER_IMAGES]

  return (
    <div className="relative w-full overflow-hidden py-6">
      {/* Gradient fade gauche/droite */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-bg-primary to-transparent sm:w-24" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-bg-primary to-transparent sm:w-24" />

      <div className="flex animate-scroll-banner gap-4">
        {images.map((img, i) => (
          <div
            key={`${img.alt}-${i}`}
            className="relative h-40 w-60 flex-none overflow-hidden rounded-2xl shadow-md sm:h-48 sm:w-72 md:h-52 md:w-80"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="320px"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  )
}
