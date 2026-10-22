// How old a source is, as a key into the string files ("fresh.fresh", "fresh.aging", "fresh.stale"), used on every
// card. An unknown or missing status gives no key, and so no word.
const KEYS = { fresh: "fresh.fresh", aging: "fresh.aging", stale: "fresh.stale" };

export function freshnessStatus(source) {
  return (source?.real_world_freshness || source?.freshness || "").toLowerCase();
}

export function freshnessKey(source) {
  return KEYS[freshnessStatus(source)] || null;
}
