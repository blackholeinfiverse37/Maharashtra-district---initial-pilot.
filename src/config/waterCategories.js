// Groundwater categories (CGWB codes, as the backend sends them), from least to most severe. A taluka is "worse" than
// its district only when its category comes later in this list than the district's. Saline is a different kind of
// problem (salty water, not over-use), so a saline taluka is always listed.
export const SEVERITY_ORDER = ["safe", "semi_critical", "critical", "over_exploited"];
export const ALWAYS_LISTED = ["saline"];

const rank = (category) => SEVERITY_ORDER.indexOf(category);

// The stressed talukas worth naming next to the district figure: the saline ones, and those in a more severe category
// than the district. When the district's category is unknown, every stressed taluka is kept (as before).
export function talukasWorseThanDistrict(stressedUnits, districtCategory) {
  const units = Array.isArray(stressedUnits) ? stressedUnits : [];
  if (rank(districtCategory) < 0) return units;
  return units.filter((u) => ALWAYS_LISTED.includes(u?.category) || rank(u?.category) > rank(districtCategory));
}
