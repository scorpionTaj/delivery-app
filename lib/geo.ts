export type Zone = { id: string; name: string; lat: number; lng: number; radius_m: number; color?: string };

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in meters between two lat/lng points. */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/**
 * Picks the nearest zone (by distance to its center) that contains the point.
 * If none contains it, returns how far the point is outside the closest zone edge.
 */
export function findZone(
  lat: number,
  lng: number,
  zones: Zone[],
): { zone: Zone; distance: number } | { zone: null; outsideBy: number | null } {
  let best: { zone: Zone; distance: number } | null = null;
  let outsideBy: number | null = null;

  for (const zone of zones) {
    const distance = haversine(lat, lng, zone.lat, zone.lng);
    if (distance <= zone.radius_m) {
      if (!best || distance < best.distance) best = { zone, distance };
    } else {
      const gap = distance - zone.radius_m;
      if (outsideBy === null || gap < outsideBy) outsideBy = gap;
    }
  }
  return best ?? { zone: null, outsideBy };
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

const PALETTE = ["#4f46e5", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#9333ea", "#db2777", "#0d9488"];

/**
 * Gives each zone a color by position. Every page loads zones ordered by
 * created_at, so the map, product list and dashboard always match.
 */
export function withColors<T>(zones: T[]): (T & { color: string })[] {
  return zones.map((z, i) => ({ ...z, color: PALETTE[i % PALETTE.length] }));
}
