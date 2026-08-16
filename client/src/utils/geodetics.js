/**
 * Sorts polygon coordinates in polar angle order around centroid to form a clean perimeter boundary without self-intersections.
 */
export function sortPolygonCoordinates(coords) {
  if (!coords || coords.length < 3) return coords;

  const cLat = coords.reduce((sum, c) => sum + (c.lat ?? c[0]), 0) / coords.length;
  const cLng = coords.reduce((sum, c) => sum + (c.lng ?? c[1]), 0) / coords.length;

  return [...coords].sort((a, b) => {
    const latA = a.lat ?? a[0];
    const lngA = a.lng ?? a[1];
    const latB = b.lat ?? b[0];
    const lngB = b.lng ?? b[1];

    const angleA = Math.atan2(latA - cLat, lngA - cLng);
    const angleB = Math.atan2(latB - cLat, lngB - cLng);

    return angleA - angleB;
  });
}

/**
 * Calculates geodetic measurements (area and perimeter) using coordinates and project center.
 * Uses a local flat-grid approximation suitable for close-range GIS calculations.
 *
 * @param {Array} coords - List of {lat, lng} coordinates.
 * @param {Array} center - Project center [lat, lng].
 * @returns {Object} { areaVal, perimeterVal, estimatedCarbon }
 */
export function calculateGeodetics(coords, center) {
  if (!coords || coords.length < 3) {
    return {
      areaVal: 'Min. 3 Titik',
      perimeterVal: 'Min. 3 Titik',
      estimatedCarbon: '0 tCO2e',
    };
  }

  const sortedCoords = sortPolygonCoordinates(coords);
  const latMid = center[0];
  const latRad = (latMid * Math.PI) / 180;
  const latMetersPerDegree = 111132;
  const lngMetersPerDegree = 111132 * Math.cos(latRad);

  const projected = sortedCoords.map((c) => ({
    x: ((c.lng ?? c[1]) - center[1]) * lngMetersPerDegree,
    y: ((c.lat ?? c[0]) - latMid) * latMetersPerDegree,
  }));

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
  const areaVal = (areaHectares / 1000).toFixed(1) + 'K Ha';
  const perimeterVal = perimeterKm.toFixed(2) + ' Km';

  // Estimate Carbon stock: 194.2 Ton CO2e per hectare
  const totalCarbonVal = areaHectares * 194.2;
  let estimatedCarbon = '';
  if (totalCarbonVal >= 1000000) {
    estimatedCarbon = (totalCarbonVal / 1000000).toFixed(2) + 'M tCO2e';
  } else {
    estimatedCarbon = (totalCarbonVal / 1000).toFixed(1) + 'K tCO2e';
  }

  return { areaVal, perimeterVal, estimatedCarbon };
}
