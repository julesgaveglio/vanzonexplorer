// src/components/ui/ScrollingBanner.tsx
// 3 lignes de petites images Pays Basque défilant en continu.
// Ligne 1 & 3 : gauche→droite. Ligne 2 : droite→gauche (reverse).

'use client'

import Image from 'next/image'

const BASE = 'https://vekavbjntnrqtwnslvxz.supabase.co/storage/v1/object/public/road-trip-images/poi'

// Toutes les images Pays Basque (49 POIs)
const ALL_IMAGES = [
  { src: `${BASE}/grande-plage-885a3d70.webp`, alt: 'Grande Plage Biarritz' },
  { src: `${BASE}/la-rhune-cb9d1b78.webp`, alt: 'La Rhune' },
  { src: `${BASE}/gorges-de-kakuetta-1e07f008.webp`, alt: 'Gorges de Kakuetta' },
  { src: `${BASE}/hendaye-plage-7c9a44b4.webp`, alt: 'Hendaye Plage' },
  { src: `${BASE}/l-atelier-du-piment-106857f7.webp`, alt: 'Piment Espelette' },
  { src: `${BASE}/les-chalets-d-iraty-4a28da05.webp`, alt: 'Iraty' },
  { src: `${BASE}/ur-bizia-rafting-7103dd7f.webp`, alt: 'Rafting Nive' },
  { src: `${BASE}/plage-de-mayarko-3a9bfb09.webp`, alt: 'Plage Mayarko' },
  { src: `${BASE}/le-chat-perche-aa9df487.webp`, alt: 'Saint-Jean-Pied-de-Port' },
  { src: `${BASE}/mondarrain-18e9e109.webp`, alt: 'Mondarrain' },
  { src: `${BASE}/kako-extea-3b954ac8.webp`, alt: 'Pintxos SJDL' },
  { src: `${BASE}/cenitz-beach-bc7e4fb8.webp`, alt: 'Cenitz Guéthary' },
  { src: `${BASE}/via-ferrata-du-pays-basque-70e3a70d.webp`, alt: 'Via ferrata' },
  { src: `${BASE}/musee-basque-et-de-l-histoire-de-bayonne-ee197a01.webp`, alt: 'Musée Basque' },
  { src: `${BASE}/ainhoa-f2845b9d.webp`, alt: 'Village Ainhoa' },
  { src: `${BASE}/anglet-surf-ocean-fc67c25e.webp`, alt: 'Surf Anglet' },
  { src: `${BASE}/alameda-894a2ef1.webp`, alt: 'Restaurant Alameda' },
  { src: `${BASE}/camping-harrobia-131acd77.webp`, alt: 'Camping Bidart' },
  { src: `${BASE}/choko-ona-dce4a216.webp`, alt: 'Choko Ona Espelette' },
  { src: `${BASE}/ecole-de-surf-biarritz-f1b08ef3.webp`, alt: 'Surf Biarritz' },
  { src: `${BASE}/el-callejon-23f327ba.webp`, alt: 'El Callejon SJDL' },
  { src: `${BASE}/evasion-64-58077cc4.webp`, alt: 'Canyoning Itxassou' },
  { src: `${BASE}/ibaia-7466367d.webp`, alt: 'Ibaïa Bayonne' },
  { src: `${BASE}/ilbarritz-f1b7f65b.webp`, alt: 'Ilbarritz' },
  { src: `${BASE}/karafe-a9f2fc49.webp`, alt: 'Karafe Bayonne' },
  { src: `${BASE}/la-table-d-aurelien-largeau-59722bde.webp`, alt: 'Table Aurélien Largeau' },
  { src: `${BASE}/le-bakera-72fc960f.webp`, alt: 'Le Bakera Bayonne' },
  { src: `${BASE}/le-bar-basque-1415f504.webp`, alt: 'Bar Basque Biarritz' },
  { src: `${BASE}/aire-naturelle-de-camping-d-iraty-fda1f1c9.webp`, alt: 'Camping Iraty' },
  { src: `${BASE}/camping-biarritz-df54e129.webp`, alt: 'Camping Biarritz' },
  { src: `${BASE}/camping-larrouleta-456c5b2e.webp`, alt: 'Camping Urrugne' },
  { src: `${BASE}/ecole-de-surf-anglet-plage-marinella-0915c71c.webp`, alt: 'Surf Marinella' },
  { src: `${BASE}/ecole-de-surf-john-et-tim-5b63a6f1.webp`, alt: 'Surf John et Tim' },
  { src: `${BASE}/ecole-de-surf-jomoraiz-a83a3494.webp`, alt: 'Surf JoMoraiz' },
  { src: `${BASE}/etxea-centre-d-interpretation-de-l-aop-piment-d-espelette-a111368d.webp`, alt: 'Piment Espelette visite' },
  { src: `${BASE}/plage-d-ilbarritz-f4e81b7c.webp`, alt: 'Plage Ilbarritz' },
  { src: `${BASE}/salle-d-escalade-d-itxassou-ae72ab2a.webp`, alt: 'Escalade Itxassou' },
  { src: `${BASE}/aire-naturelle-de-camping-cars-etxola-22e2bcd6.webp`, alt: 'Camping Etxola' },
  { src: `${BASE}/parking-acotz-afaf1209.webp`, alt: 'Parking Acotz SJDL' },
  { src: `${BASE}/aire-des-corsaires-65db07a0.webp`, alt: 'Aire Corsaires Anglet' },
  { src: `${BASE}/aire-camping-car-park-de-biarritz-378e31bc.webp`, alt: 'Aire Biarritz' },
  { src: `${BASE}/aire-de-camping-car-park-de-biarritz-240ffe78.webp`, alt: 'Aire camping Biarritz' },
]

// Répartir en 3 lignes
const ROW_1 = ALL_IMAGES.slice(0, 14)
const ROW_2 = ALL_IMAGES.slice(14, 28)
const ROW_3 = ALL_IMAGES.slice(28, 42)

function ImageRow({
  images,
  reverse = false,
  speed,
}: {
  images: typeof ALL_IMAGES
  reverse?: boolean
  speed: string
}) {
  const doubled = [...images, ...images]
  return (
    <div className="overflow-hidden">
      <div
        className={`flex gap-2 ${reverse ? 'animate-scroll-banner-reverse' : 'animate-scroll-banner'}`}
        style={{ animationDuration: speed }}
      >
        {doubled.map((img, i) => (
          <div
            key={`${img.alt}-${i}`}
            className="relative h-16 w-24 flex-none overflow-hidden rounded-lg sm:h-20 sm:w-28"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="112px"
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ScrollingBanner() {
  return (
    <div className="relative -mx-4 w-[calc(100%+2rem)] overflow-hidden py-3 sm:-mx-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)]">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-bg-primary to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-bg-primary to-transparent sm:w-16" />

      <div className="space-y-2">
        <ImageRow images={ROW_1} speed="35s" />
        <ImageRow images={ROW_2} speed="45s" reverse />
        <ImageRow images={ROW_3} speed="40s" />
      </div>
    </div>
  )
}
