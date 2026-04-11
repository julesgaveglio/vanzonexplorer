// src/lib/road-trip-pb/metadata.ts
// Metadata helpers pour les 3 niveaux de pages /road-trip-pays-basque-van.

import type { Metadata } from 'next'
import type { DurationSlug } from '@/types/road-trip-pb'
import type { GroupType } from '@/types/roadtrip'
import {
  DURATION_LABELS,
  GROUP_LABELS,
  hubPath,
  durationPath,
  finalPath,
} from './constants'

const BASE = 'https://vanzonexplorer.com'

export function buildHubMetadata(): Metadata {
  const canonical = `${BASE}${hubPath()}`
  return {
    title: 'Road Trip en Van au Pays Basque — Itinéraires sur mesure',
    description:
      'Itinéraires road trip van Pays Basque : weekend, 5 jours, 1 semaine. Spots nuit validés, cartes GPS, activités par profil. Au départ de Cambo-les-Bains.',
    alternates: { canonical },
    openGraph: {
      title: 'Road Trip Van Pays Basque — Itinéraires',
      description:
        'Toutes les durées et tous les profils : weekend, 1 semaine, solo, couple, famille, amis. Cartes + spots + conseils.',
      type: 'website',
      url: canonical,
    },
    robots: { index: true, follow: true },
  }
}

export function buildDurationPageMetadata(duration: DurationSlug): Metadata {
  const dLabel = DURATION_LABELS[duration]
  const canonical = `${BASE}${durationPath(duration)}`
  return {
    title: `Road Trip Pays Basque ${dLabel} en Van — Itinéraire & Spots`,
    description: `Road trip Pays Basque ${dLabel} en van aménagé. Étapes détaillées, spots nuit validés, cartes GPS. Départ Cambo-les-Bains.`,
    alternates: { canonical },
    openGraph: {
      title: `Road Trip Pays Basque ${dLabel} en Van`,
      description: `Itinéraire ${dLabel.toLowerCase()} au Pays Basque en van aménagé.`,
      type: 'website',
      url: canonical,
    },
    robots: { index: duration !== '1-jour', follow: true },
  }
}

export function buildFinalPageMetadata(
  duration: DurationSlug,
  groupType: GroupType
): Metadata {
  const dLabel = DURATION_LABELS[duration]
  const gLabel = GROUP_LABELS[groupType]
  const canonical = `${BASE}${finalPath(duration, groupType)}`
  return {
    title: `Road Trip Van Pays Basque ${dLabel} ${gLabel} — Itinéraire & Spots`,
    description: `Road trip Pays Basque ${dLabel} en van aménagé ${gLabel}. Itinéraire détaillé jour par jour, spots nuit validés, cartes GPS. Au départ de Cambo-les-Bains.`,
    alternates: { canonical },
    openGraph: {
      title: `Road Trip Pays Basque ${dLabel} ${gLabel}`,
      description: `Itinéraire van complet ${gLabel} pour ${dLabel.toLowerCase()} au Pays Basque.`,
      type: 'article',
      url: canonical,
    },
    robots: { index: duration !== '1-jour', follow: true },
  }
}
