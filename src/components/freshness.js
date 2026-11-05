// How old a source is, as a key into the string files ("fresh.fresh", "fresh.aging", "fresh.stale"), used on every
// card. An unknown or missing status, or one that is not text, gives no key, and so no word.
const KEYS = { fresh: "fresh.fresh", aging: "fresh.aging", stale: "fresh.stale" };

export function freshnessStatus(source) {
  const status = source?.real_world_freshness || source?.freshness;
  return typeof status === "string" ? status.toLowerCase() : "";
}

export function freshnessKey(source) {
  return KEYS[freshnessStatus(source)] || null;
}
