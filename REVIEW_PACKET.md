# REVIEW_PACKET: AIAIC District Intelligence Dashboard (prototype)

**Owner:** Gauri Deshpande. **State:** DRAFT, prepared in Hemanth's review of 2026-10-02 for Gauri to check, edit
and sign. The April 2026 packet described mock adapters (`Mahesadapter`, `deep_adapter`) that no longer exist; it
is replaced. **Last updated:** 2026-10-29. File-by-file index: `CODE_INDEX.md`.

## 1. Entry point

- `index.html` → `src/main.jsx` → `src/App.jsx`. Run: `npm run dev`. Tests: `npm test`.
- Configuration: `.env` (not committed) with `VITE_AIAIC_API`, the AIAIC server address (see `.env.example`).

## 2. Core flow (input → output)

1. **State → district.** `GET /places/districts?state=`: the state's districts, by AIAIC's closed list.
2. **District → crop.** `GET /places/crops?state=&district=`: the crops AIAIC offers for that district, in its
   order (Nashik: onion, maize, soybean, wheat, …).
3. **District + crop → answers.** `GET /view/unified?crop=&region=&state=&lang=en`: market, water, crop,
   storage and weather answers, each with AIAIC's summary.
4. The panels show each answer with its source, date and staleness:
   - `DataDisplayPanel`: harvest, best mandi price, water stress, and the taluka warning;
   - `SimulationPanel`: sell or store; a fixed band is shown as the single price it is;
   - `CropAreaPieChart`: the district's crop area (DES).
5. **District only.** `GET /weather/forecast` (7-day forecast), `GET /weather/outlook` and `GET /places/map` (the
   district map). `GET /places/enam-mandis` and `GET /places/soil-moisture` feed the Background card, and are not
   called while that card is switched off.

All of it is in `src/data_adapter/aiaicApi.js` (calls) and the components. Nothing is computed in the browser except
the warehouse distances (`src/config/geo.js`) and the choice of which warehouses to list (`src/data/warehousesNear.js`).

## 3. What was built

- Live AIAIC data only, from one server. The district-synced crop list comes from AIAIC.
- Source, date and freshness on every card. The uncalibrated warning is shown.
- The fixed-band rule, with a test on a real recorded AIAIC answer (Nashik onion, 2026-10-02) and a defect
  control: removing the rule makes the test fail.
- **Language switch.** English, Hindi and Marathi. The dashboard's own words are in `src/i18n/strings/`; every
  string is in `docs/translations_for_review.csv` for a native speaker to check. The choice is remembered on the
  device.
- **Marathi and Hindi backend text.** On a Marathi or Hindi page, the cards show the text AIAIC itself sends in that
  language. Lines AIAIC has only in English are not mixed in: they are counted and kept behind one tap ("More, in
  English only"). Tests check that a Marathi or Hindi page shows no English otherwise.
- **Top 5 mandis.** "Which mandis pay the most?": the mandis AIAIC compared, highest price first, each with its
  district, price, the day that price was seen and its distance. "Show more" adds up to 5 more, including prices from
  other days, under a line saying AIAIC did not compare them.
- **Warehouses.** "Warehouses in and near your district": WDRA-registered warehouses that are active and still
  valid today, in the district or within 150 km of it, nearest first, with capacity.
- **Weather map.** A map of the state's districts (Leaflet, OpenStreetMap tiles), one pin per district with the
  week's weather in words. A switch turns it into a warehouses view: the number of registered warehouses per district.
- **Weather forecast card.** "What will the weather be this week?": the district's 7-day forecast, day by day (dry,
  some chance of rain, rain likely), with AIAIC's summary and source. When there is no forecast, the card shows
  AIAIC's own reason.
- **Background card.** "Background information (older data)": the district's e-NAM mandis, soil moisture at 15 cm,
  and the date of the warehouse list, each with its date and source, kept apart from this season's answers.
  **Switched off for now** (`SHOW_BACKGROUND = false` in `src/App.jsx`, since 5be526d): the card is built but not
  shown, and its data is not fetched.

## 4. What is intentionally not here

- No intelligence logic of its own (district KPIs are specified in `AIAIC_DATASET_REGISTER_V1_NASHIK.csv` and
  `DISTRICT_KPI_CATALOGUE_V1_NASHIK.csv`, and built in AIAIC's backend).
- No farmer data and no personal data.
- Not the farmer or admin application.
- No transport costs. The transport card shows only AIAIC's break-even figure (how much moving one quintal may cost
  per km for a trip to a better-paying mandi to pay off). What transport really costs is not known here.
- No price trend chart. Each price is for one day; there is no price history over time.
- No crop insurance information.
- No machine translation of backend text. Marathi and Hindi backend text is shown only when AIAIC sends it in that
  language; otherwise the English line goes behind one tap.
- No pytest, Pydantic, `requirements.txt` or 50-run hash gate. This repository has no Python code, so they do not
  apply here. Its checks are the Vitest tests, ESLint and the Vite build (section 6).

## 5. Risks and open questions

- The four AIAIC limitations listed in the README (mandi day, water card, storage wording, missing onion
  production).
- Whether this prototype is kept (see `GAURI_ROLE_AND_NEXT_TASK_2026-10-02.md`) or its views move into AIAIC.
- **npm security alerts.** `npm audit` reports 14 (1 low, 4 moderate, 9 high). `npm audit --omit=dev` reports 4 of
  them in production dependencies, all high: `nanoid`, `postcss`, `source-map-js` and `vite`. All four come in
  through `@tailwindcss/vite`, a build plugin; none is in the code the browser runs. Fixing `vite` needs a newer
  version than the one pinned (8.0.8).
- **Large build file.** `npm run build` warns that `dist/assets/index-*.js` is 831.80 kB (240.83 kB gzipped), over
  Vite's 500 kB limit. The page is not split into smaller parts.
- **Backend advice still in English.** On Marathi and Hindi pages, some of AIAIC's advice text exists only in
  English. It is shown behind one tap, so a farmer who reads only Marathi or Hindi may miss it.
- **Old soil moisture data.** The soil moisture AIAIC holds is from 2020 (`sm_Maharashtra_2020.csv`,
  `sm_MadhyaPradesh_2020.csv`). The Background card shows its dates; that card is switched off for now.
- **Warehouse list.** Maharashtra only, from WDRA's list as of 21 Oct 2026 (downloaded 24 Oct 2026). Other states
  show no warehouses. The list does not update by itself; it is rebuilt with `scripts/build_wdra.js`.
- **Straight-line distances.** Mandi and warehouse distances are straight lines between district centres. Roads are
  longer; the transport and warehouse cards say so, the Top 5 card only says "about X km".

## 6. Evidence

- 2026-10-29, after `npm ci`: `npx vitest run`: 9 test files, 46 tests passed, 0 failed. `npm run lint`
  (`eslint .`): no errors, no warnings. `npm run build`: succeeds, with the one chunk-size warning in section 5.
- 2026-10-02: `npm test`: 3 passed (the tests at the time).
- A browser run against the local AIAIC API, Maharashtra → Nashik → Onion (2026-10-02): districts loaded, the crop
  list was Nashik's, the answers were shown, and the store card showed the single price with the fixed-band note
  (screenshot in the review folder).

## 7. Data sources

- **AIAIC backend.** Every answer on the cards, with the source AIAIC names for it: Agmarknet daily mandi prices
  and Central Ground Water Board groundwater assessments (named in the recorded answers), DES crop area, the e-NAM
  mandi list, and the weather forecast's provider as AIAIC names it on the card. Each card shows its own source and
  date.
- **WDRA registered warehouses.** WDRA's public list of registered warehouses, Maharashtra, as of 21 Oct 2026
  (`src/data/wdra_warehouses.json`). Only id, name, address, district, state, capacity, valid-until date and status
  are kept. No contact numbers or manager names are kept: `src/data/wdraClean.js` drops personal names and blanks
  any address that still holds a phone-like number.
- **Soil moisture.** AIKosh / data.gov.in, "Daily Data of Soil Moisture" (National Water Informatics Centre,
  Ministry of Jal Shakti), 2020, under the Government Open Data License - India (GODL). Served by the AIAIC backend.
- **Leaflet** 1.9.4 for the district map, with OpenStreetMap tiles (© OpenStreetMap contributors, ODbL; the notice
  stays on the map).
