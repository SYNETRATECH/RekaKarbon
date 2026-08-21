export type CoordPoint = { lat?: number; lng?: number } | [number, number];

export interface GeodeticResult {
  areaVal: string;
  perimeterVal: string;
  estimatedCarbon: string;
}

/**
 * Sorts polygon coordinates in polar angle order around centroid to form a clean perimeter boundary without self-intersections.
 */
export function sortPolygonCoordinates<T extends CoordPoint>(coords: T[]): T[] {
  if (!coords || coords.length < 3) return coords;

  const cLat =
    coords.reduce((sum, c) => {
      const lat = Array.isArray(c) ? c[0] : (c.lat ?? 0);
      return sum + lat;
    }, 0) / coords.length;

  const cLng =
    coords.reduce((sum, c) => {
      const lng = Array.isArray(c) ? c[1] : (c.lng ?? 0);
      return sum + lng;
    }, 0) / coords.length;

  return [...coords].sort((a, b) => {
    const latA = Array.isArray(a) ? a[0] : (a.lat ?? 0);
    const lngA = Array.isArray(a) ? a[1] : (a.lng ?? 0);
    const latB = Array.isArray(b) ? b[0] : (b.lat ?? 0);
    const lngB = Array.isArray(b) ? b[1] : (b.lng ?? 0);

    const angleA = Math.atan2(latA - cLat, lngA - cLng);
    const angleB = Math.atan2(latB - cLat, lngB - cLng);

    return angleA - angleB;
  });
}

/**
 * Calculates geodetic measurements (area and perimeter) using coordinates and project center.
 * Uses a local flat-grid approximation suitable for close-range GIS calculations.
 *
 * @param coords - List of coordinates.
 * @param center - Project center [lat, lng].
 * @returns {GeodeticResult} { areaVal, perimeterVal, estimatedCarbon }
 */
export function calculateGeodetics(
  coords: CoordPoint[],
  center: [number, number] | number[]
): GeodeticResult {
  if (!coords || coords.length < 3) {
    return {
      areaVal: 'Min. 3 Titik',
      perimeterVal: 'Min. 3 Titik',
      estimatedCarbon: '0 tCO₂e',
    };
  }

  const sortedCoords = sortPolygonCoordinates(coords);
  const latMid = center[0];
  const latRad = (latMid * Math.PI) / 180;
  const latMetersPerDegree = 111132;
  const lngMetersPerDegree = 111132 * Math.cos(latRad);

  const projected = sortedCoords.map((c) => {
    const lat = Array.isArray(c) ? c[0] : (c.lat ?? 0);
    const lng = Array.isArray(c) ? c[1] : (c.lng ?? 0);
    return {
      x: (lng - center[1]) * lngMetersPerDegree,
      y: (lat - latMid) * latMetersPerDegree,
    };
  });

  let areaSum = 0;
  let perimeterSum = 0;

  for (let i = 0; i < projected.length; i++) {
    const p1 = projected[i];
    const p2 = projected[(i + 1) % projected.length];

    areaSum += p1.x * p2.y - p2.x * p1.y;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    perimeterSum += Math.sqrt(dx * dx + dy * dy);
  }

  const areaSqMeters = Math.abs(areaSum) / 2;
  const areaHectares = areaSqMeters / 10000;
  const perimeterKm = perimeterSum / 1000;

  // Format outputs
  const areaVal = (areaHectares / 1000).toFixed(1) + 'k ha';
  const perimeterVal = perimeterKm.toFixed(2) + ' km';

  // Estimate Carbon stock: 194.2 Ton CO2e per hectare
  const totalCarbonVal = areaHectares * 194.2;
  let estimatedCarbon = '';
  if (totalCarbonVal >= 1000000) {
    estimatedCarbon = (totalCarbonVal / 1000000).toFixed(2) + 'M tCO₂e';
  } else {
    estimatedCarbon = (totalCarbonVal / 1000).toFixed(1) + 'K tCO₂e';
  }

  return { areaVal, perimeterVal, estimatedCarbon };
}
