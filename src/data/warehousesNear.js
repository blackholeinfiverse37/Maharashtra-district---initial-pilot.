// Which WDRA warehouses the warehouse card shows (see WarehousesPanel.jsx): only Active ones still valid today, in the
// chosen state, in the farmer's own district or within NEAR_KM of it (straight line between AIAIC's district
// centres), own district first, then nearest, then largest.
import { NEAR_KM, centresFrom, distanceKm, norm, sameName } from "../config/geo";

// Today as "YYYY-MM-DD" in the viewer's own time zone
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// A warehouse the dashboard lists: Active, registration still valid today, in the chosen state
const isListed = (w, stateName, today) =>
  w?.status?.toLowerCase() === "active" && w.valid_upto && w.valid_upto >= today && sameName(w.state, stateName);

export function warehousesNear({ list, stateName, districtEn, mapData, today = todayIso() }) {
  const centres = centresFrom(mapData);
  const home = centres.get(norm(districtEn));
  return (Array.isArray(list) ? list : [])
    .filter((w) => isListed(w, stateName, today))
    .map((w) => {
      if (sameName(w.district, districtEn)) return { ...w, local: true, km: 0 };
      const there = centres.get(norm(w.district));
      return home && there ? { ...w, local: false, km: distanceKm(home, there) } : null;
    })
    .filter((w) => w && (w.local || w.km <= NEAR_KM))
    .sort((a, b) => a.km - b.km || (b.capacity_mt || 0) - (a.capacity_mt || 0));
}


// Per district of the chosen state: how many listed warehouses and their total capacity (tonnes), by normalised
// district name. `covered` is false when the file holds no warehouse at all for the state (not yet downloaded), so a
// map never shows "0" for a state the list does not cover.
export function warehouseCountsByDistrict({ list, stateName, today = todayIso() }) {
  const all = Array.isArray(list) ? list : [];
  const covered = all.some((w) => sameName(w?.state, stateName));
  const counts = new Map();
  for (const w of all) {
    if (!isListed(w, stateName, today)) continue;
    const key = norm(w.district);
    const c = counts.get(key) || { count: 0, capacity: 0 };
    c.count += 1;
    c.capacity += Number(w.capacity_mt) || 0;
    counts.set(key, c);
  }
  return { covered, counts };
}
