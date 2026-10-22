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

// Every call takes `lang` (the language the backend should answer in; English when not given). Names come back in
// two forms: `name` in that language, to SHOW, and `name_en`, which is what is always SENT back to the backend.

// [{ key, name, name_en }] for a state ("maharashtra" or "mp").
export async function fetchDistricts(state, lang = 'en') {
  const d = await getJson('/places/districts', { state, lang })
  return (d.districts || []).map((x) => ({
    key: x.key,
    name: x.name || x.name_en || x.key,
    name_en: x.name_en || x.name || x.key,
  }))
}

// [{ key, name, name_en, basis }] for one district: the crops AIAIC offers first, in its order.
export async function fetchCrops(state, district, lang = 'en') {
  const d = await getJson('/places/crops', { state, district, lang })
  const byKey = Object.fromEntries((d.crops || []).map((c) => [c.crop, c]))
  return (d.first_page || []).map((key) => ({
    key,
    name: (byKey[key] && (byKey[key].name || byKey[key].name_en)) || key,
    name_en: (byKey[key] && (byKey[key].name_en || byKey[key].name)) || key,
    basis: byKey[key] ? byKey[key].basis : null,
  }))
}

// { market: [item], storage: [item], water: [item], crop: [item], weather: [item] } where each item is the
// service's answer with its `summary` attached: the same shape the panels already read. Plus `na_reasons`: the
// server's own reason, per service, when it returns no answer (e.g. { weather: { code, text } }).
export async function fetchDistrictView({ state, district, crop, lang = 'en' }) {
  const payload = await getJson('/view/unified', { crop, region: district, state, lang })
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

// The 7-day weather forecast for one district (it does not depend on the crop): the server's own summary, its days
// and its source, as sent.
export async function fetchWeatherForecast({ state, district, lang = 'en' }) {
  return getJson('/weather/forecast', { district, state, lang })
}

// The 7-day weather outlook for every district of a state, one line each (dry days, next rain-likely day, highest
// temperature) with its source. Always read in English: its district `name` is then the English name, which is how it
// is matched with the map's districts (the outlook has no separate English-name field).
export async function fetchWeatherOutlook({ state }) {
  return getJson('/weather/outlook', { state, lang: 'en' })
}

// Every district's centre (lat, lon) with its name in the chosen language (`district`) and in English (`name_en`).
export async function fetchPlacesMap({ state, crop, lang = 'en' }) {
  return getJson('/places/map', { state, crop, lang })
}

// Background facts for one district (older data, not about the crop), each as the server sends it:
// the mandis that were on e-NAM, and a past year's soil moisture.
export async function fetchEnamMandis({ state, district, lang = 'en' }) {
  return getJson('/places/enam-mandis', { district, state, lang })
}
export async function fetchSoilMoisture({ state, district, lang = 'en' }) {
  return getJson('/places/soil-moisture', { district, state, lang })
}

// The states the backend serves, as its /catalog lists them (e.g. ["madhya pradesh", "maharashtra"]); [] when it
// lists none. Each served name is also accepted as the `state` of the other calls.
export async function fetchServedStates() {
  const d = await getJson('/catalog', { lang: 'en' })
  const served = d?.states?.served
  return Array.isArray(served) ? served.filter((s) => typeof s === 'string' && s) : []
}

// The language codes the backend accepts as `lang`, read from its own /openapi.json: the parameter's `enum` when it has
// one, otherwise the "en | hi | mr" list its description gives. An empty list means "could not tell".
export async function fetchBackendLanguages() {
  const spec = await getJson('/openapi.json')
  const codes = new Set()
  // "Summary language: en (default) | hi | mr." -> en, hi, mr
  const fromList = (text) => {
    for (const run of (typeof text === 'string' && text.match(/\b[a-z]{2,3}\b(?: \(default\))?(?:\s*\|\s*[a-z]{2,3}\b)+/g)) || []) {
      for (const part of run.replace(/\(default\)/g, '').split('|')) {
        const code = part.trim()
        if (/^[a-z]{2,3}$/.test(code)) codes.add(code)
      }
    }
  }
  for (const ops of Object.values(spec?.paths || {})) {
    for (const p of ops?.get?.parameters || []) {
      if (p?.name !== 'lang') continue
      const schemas = [p.schema, ...(p.schema?.anyOf || [])]
      for (const s of schemas) for (const code of s?.enum || []) if (typeof code === 'string') codes.add(code)
    }
  }
  if (codes.size === 0) {
    for (const ops of Object.values(spec?.paths || {})) {
      for (const p of ops?.get?.parameters || []) if (p?.name === 'lang') fromList(p.description || p.schema?.description)
    }
  }
  return [...codes]
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
