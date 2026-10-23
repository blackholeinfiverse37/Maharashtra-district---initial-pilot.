// Straight-line distance between two district centres, the same method AIAIC uses for its mandi distances
// (great-circle distance, Earth radius 6371 km; checked against AIAIC's own figures, e.g. 58.3 km and 118.6 km).
export const NEAR_KM = 150; // the same limit AIAIC uses for "nearby" mandis

const EARTH_RADIUS_KM = 6371;
const rad = (deg) => (deg * Math.PI) / 180;

export function distanceKm([lat1, lon1], [lat2, lon2]) {
  const h =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// District names compared without case, dots or extra spaces ("Mumbai Sub." = "mumbai sub")
export const sameName = (a, b) => norm(a) !== "" && norm(a) === norm(b);
export const norm = (s) => String(s || "").toLowerCase().replace(/\./g, " ").replace(/\s+/g, " ").trim();

// Every district's centre from AIAIC's /places/map, findable by its English name or its key
export function centresFrom(mapData) {
  const centres = new Map();
  for (const p of mapData?.points || []) {
    const lat = Number(p?.lat);
    const lon = Number(p?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    for (const name of [p.name_en, p.key]) if (norm(name)) centres.set(norm(name), [lat, lon]);
  }
  return centres;
}
