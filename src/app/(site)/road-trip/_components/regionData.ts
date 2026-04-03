export const REGION_CENTROIDS: Record<string, [number, number]> = {
  "pays-basque":  [-1.4440, 43.2951],
  "bretagne":     [-3.0000, 48.1000],
  "provence":     [ 5.5000, 43.7000],
  "camargue":     [ 4.5500, 43.5200],
  "alsace":       [ 7.4500, 48.3300],
  "dordogne":     [ 0.7200, 44.9000],
  "corse":        [ 9.0000, 42.0500],
  "normandie":    [-0.3500, 49.1800],
  "ardeche":      [ 4.2500, 44.6500],
  "pyrenees":     [ 0.9500, 42.8500],
  "loire":        [ 1.5000, 47.5000],
  "jura":         [ 5.8000, 46.7000],
  "vercors":      [ 5.4000, 44.9500],
  "cotentin":     [-1.4500, 49.5000],
  "landes":       [-1.0000, 43.9500],
};

export function haversineKm(
  [lon1, lat1]: [number, number],
  [lon2, lat2]: [number, number]
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1r = (lat1 * Math.PI) / 180;
  const lat2r = (lat2 * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
