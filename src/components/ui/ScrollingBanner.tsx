// src/components/ui/ScrollingBanner.tsx
// Bandeau d'images : auto-scroll CSS + swipe tactile natif.

'use client'

import Image from 'next/image'

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
  const images = [...BANNER_IMAGES, ...BANNER_IMAGES]

  return (
    <div className="relative -mx-4 w-[calc(100%+2rem)] py-4 sm:-mx-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)]">
      {/* Gradient fade collé aux bords écran */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-bg-primary to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-bg-primary to-transparent sm:w-16" />

      {/* Scroll container : tactile natif + auto-scroll CSS */}
      <div
        className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-none animate-scroll-banner hover:[animation-play-state:paused] touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {images.map((img, i) => (
          <div
            key={`${img.alt}-${i}`}
            className="relative h-28 w-44 flex-none overflow-hidden rounded-xl shadow-sm sm:h-32 sm:w-52 md:h-36 md:w-56"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="224px"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  )
}
