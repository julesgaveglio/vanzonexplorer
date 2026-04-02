/**
 * geojson-builder.ts
 * Construit un GeoJSON FeatureCollection depuis les spots d'un itinéraire road trip.
 * Chaque jour produit : N point features + 1 linestring feature reliant les spots dans l'ordre.
 */

export interface SpotGeo {
  nom: string;
  lat: number;
  lon: number;
  type?: string;
  jour: number;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point" | "LineString";
    coordinates: number[] | number[][];
  };
  properties: Record<string, unknown>;
}

export interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

/**
 * Construit un bounding box depuis une liste de coordonnées.
 * Retourne [minLon, minLat, maxLon, maxLat]
 */
export function computeBoundingBox(spots: SpotGeo[]): [number, number, number, number] | null {
  const validSpots = spots.filter(s => s.lat && s.lon);
  if (validSpots.length === 0) return null;

  const lons = validSpots.map(s => s.lon);
  const lats = validSpots.map(s => s.lat);

  return [
    Math.min(...lons),
    Math.min(...lats),
    Math.max(...lons),
    Math.max(...lats),
  ];
}

/**
 * Construit une FeatureCollection GeoJSON depuis les spots d'un itinéraire.
 * Regroupe les spots par jour et crée une polyline par jour.
 */
export function buildGeoJSON(spots: SpotGeo[]): GeoJSONCollection {
  const validSpots = spots.filter(s => s.lat && s.lon);
  const features: GeoJSONFeature[] = [];

  // Point features pour chaque spot
  for (const spot of validSpots) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [spot.lon, spot.lat],
      },
      properties: {
        nom: spot.nom,
        type: spot.type || "spot",
        jour: spot.jour,
      },
    });
  }

  // LineString par jour
  const spotsParJour = new Map<number, SpotGeo[]>();
  for (const spot of validSpots) {
    const jourSpots = spotsParJour.get(spot.jour) || [];
    jourSpots.push(spot);
    spotsParJour.set(spot.jour, jourSpots);
  }

  for (const [jour, jourSpots] of spotsParJour.entries()) {
    if (jourSpots.length >= 2) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: jourSpots.map(s => [s.lon, s.lat]),
        },
        properties: {
          jour,
          type: "route",
        },
      });
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * Calcule la distance en km entre deux points GPS (formule Haversine).
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calcule le centroïde géographique d'une liste de points.
 */
export function computeCentroid(spots: SpotGeo[]): { lat: number; lon: number } | null {
  const valid = spots.filter(s => s.lat && s.lon);
  if (valid.length === 0) return null;
  const avgLat = valid.reduce((sum, s) => sum + s.lat, 0) / valid.length;
  const avgLon = valid.reduce((sum, s) => sum + s.lon, 0) / valid.length;
  return { lat: avgLat, lon: avgLon };
}
