// The ONE place this dashboard talks to AIAIC (review 2026-10-02).
//
// One base address for every call (VITE_AIAIC_API), so the lists and the answers always come from the same server
// and the same data. Before, the district/crop lists came from one server and the answers from another.
//
// What it reads, and why:
//   /places/districts       the state's districts (AIAIC's closed list, current names)
//   /places/crops           the crops for ONE district, in AIAIC's first-page order, each with why it is listed
//   /view/unified           every service's answer for (crop, district) PLUS its summary: action, confidence,
//                           key numbers, sources, and which numbers are NOT a measured range (`fixed_band`)
//
// The browser computes no intelligence here: it shows what the server decided, with its sources (the unified
// task: "UI consumes live services, not duplicated/local logic").

const API = (import.meta.env.VITE_AIAIC_API || '').replace(/\/+$/, '')
const HEADERS = { 'ngrok-skip-browser-warning': 'true' }

async function getJson(path, params = {}) {
  if (!API) throw new Error('VITE_AIAIC_API is not set (see .env.example)')
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  const r = await fetch(`${API}${path}?${query}`, { headers: HEADERS })
  if (!r.ok) throw new Error(`${path} ${r.status}`)
  return r.json()
}

// [{ key, name }] for a state ("maharashtra" or "mp").
export async function fetchDistricts(state) {
  const d = await getJson('/places/districts', { state, lang: 'en' })
  return (d.districts || []).map((x) => ({ key: x.key, name: x.name_en || x.name }))
}

// [{ key, name, basis }] for one district: the crops AIAIC offers first, in its order.
export async function fetchCrops(state, district) {
  const d = await getJson('/places/crops', { state, district, lang: 'en' })
  const byKey = Object.fromEntries((d.crops || []).map((c) => [c.crop, c]))
  return (d.first_page || []).map((key) => ({
    key,
    name: (byKey[key] && (byKey[key].name_en || byKey[key].name)) || key,
    basis: byKey[key] ? byKey[key].basis : null,
  }))
}

// { market: [item], storage: [item], water: [item], crop: [item], weather: [item] } where each item is the
// service's answer with its `summary` attached: the same shape the panels already read. Plus `na_reasons`: the
// server's own reason, per service, when it returns no answer (e.g. { weather: { code, text } }).
export async function fetchDistrictView({ state, district, crop }) {
  const payload = await getJson('/view/unified', { crop, region: district, state, lang: 'en' })
  return {
    ...Object.fromEntries(
      Object.entries(payload.services || {}).map(([service, items]) => [
        service,
        (items || []).map((i) => ({ ...(i.intelligence || {}), summary: i.summary || null })),
      ]),
    ),
    na_reasons: payload.na_reasons || {},
  }
}

// The engine fills best/average/worst with a FIXED band (e.g. plus or minus 2% of one price) when it has no measured
// spread. That is not "a better day / a weaker day", so it must never be shown as one. The summary marks it on the
// case items: returns the marker (e.g. "plus_minus_2_pct") or null.
export function fixedBandOf(summary) {
  for (const section of (summary && summary.sections) || []) {
    for (const item of section.items || []) {
      if (item && item.data && item.data.fixed_band) return item.data.fixed_band
    }
  }
  return null
}
