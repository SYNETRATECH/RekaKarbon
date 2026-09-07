export interface CoordinatePoint {
  lat: number;
  lng: number;
}

/**
 * Parses and normalizes raw JSON/GeoJSON coordinate arrays into structured { lat, lng } points.
 * Safely handles both tuple format ([lat, lng]) and object format ({ lat, lng }),
 * filtering out invalid, non-finite, or malformed entries.
 */
export function parseProjectCoordinates(value: unknown): CoordinatePoint[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((coordinate) => {
    if (Array.isArray(coordinate) && coordinate.length >= 2) {
      const lat = Number(coordinate[0]);
      const lng = Number(coordinate[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) ? [{ lat, lng }] : [];
    }

    if (typeof coordinate === 'object' && coordinate !== null) {
      const candidate = coordinate as { lat?: unknown; lng?: unknown };
      const lat = Number(candidate.lat);
      const lng = Number(candidate.lng);
      return Number.isFinite(lat) && Number.isFinite(lng) ? [{ lat, lng }] : [];
    }

    return [];
  });
}
