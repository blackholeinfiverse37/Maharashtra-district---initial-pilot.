# EVIDENCE T-GOV-F02: AIAIC District Intelligence Dashboard

**Compiled:** 2026-11-06, on the working tree after commit 0e343f7 (the Task 4 changes, not yet committed when this
was written). **Owner:** Gauri Deshpande. Decisions: `docs/ADR-T-GOV-F02.md`. Datasets: `docs/DATASET_INVENTORY.md`.

Everything below was run or read on 2026-11-06 unless another date is given. The backend's address is written as
`$VITE_AIAIC_API` (it is kept in `.env`, which is never committed).

## 1. AIKosh evidence

The soil moisture the backend serves comes from Bharat AIKosh. The backend says so in its own answer (sample 1 in
section 3), and `docs/DATASET_INVENTORY.md` records the same:

| Item | As the backend states it |
|---|---|
| Dataset | "Daily Data of Soil Moisture", file `sm_Maharashtra_2020.csv` (and `sm_MadhyaPradesh_2020.csv`) |
| Publisher | National Water Informatics Centre (Ministry of Jal Shakti), per the data.gov.in catalogue |
| Catalogue | `https://www.data.gov.in/catalog/daily-data-soil-moisture` |
| Obtained through | AIKosh (`https://aikosh.indiaai.gov.in`), downloaded by the data owner on 20 Oct 2026 |
| Licence | GODL (Government Open Data License - India), as the AIKosh page states |
| Period | 2020-01-01 to 2020-09-23 only (one past year) |
| SHA-256 of the Maharashtra file | `25884b2efcf3720c572ff3f4b362e02690fac93cb01434ff490a07d8588b2b7d` |

The dashboard does not download from AIKosh itself; it reads this data only through the backend
(`GET /places/soil-moisture`). The card that shows it (Background information) is switched off.

## 2. MASTERDB evidence

No interface or documentation for MASTERDB was available to us. Nothing in this repository reads from or writes to
MASTERDB, and no MASTERDB data is used (`docs/DATASET_INVENTORY.md`, MASTERDB row: "Not verified").

## 3. Two API samples

Both called on 2026-11-06 with the header `ngrok-skip-browser-warning: true`. Excerpts only; field names and values
as sent.

**Sample 1.** `GET $VITE_AIAIC_API/places/soil-moisture?district=Nashik&state=maharashtra&lang=en`: HTTP 200 at
2026-11-06T07:10:25Z.

```json
{
 "district": "Nashik",
 "title": "Soil moisture at 15 cm in 2020",
 "headline": "In 2020 the soil at 15 cm in Nashik was between 8.3% and 43.7% (volume, as published) from 2020-01-01 to 2020-09-23.",
 "caveat": "2020 only: one past year, not what is usual, and not this season. The record ends on 2020-09-23.",
 "source": {
  "name": "Daily Data of Soil Moisture: sm_Maharashtra_2020.csv",
  "publisher": "National Water Informatics Centre (Ministry of Jal Shakti), per the data.gov.in catalogue",
  "url": "https://www.data.gov.in/resource/soil-moisture-maharashtra-2020",
  "catalogue": "https://www.data.gov.in/catalog/daily-data-soil-moisture",
  "obtained_through": "AIKosh (https://aikosh.indiaai.gov.in), downloaded by the owner on 20 Oct 2026",
  "license": "GODL (Government Open Data License - India), as the AIKosh page states",
  "observed": "2020-01-01 to 2020-09-23",
  "sha256": "25884b2efcf3720c572ff3f4b362e02690fac93cb01434ff490a07d8588b2b7d"
 },
 "season": { "first_day": "2020-01-01", "last_day": "2020-09-23", "days_held": 248, "days_missing": 19 }
}
```

**Sample 2.** `GET $VITE_AIAIC_API/view/unified?crop=tur&region=Akola&state=maharashtra&lang=en`: HTTP 200 at
2026-11-06T07:10:25Z. The market answer only (the answer also held `water`, `weather`, `crop` and `storage`).

```json
{
 "recommendation": "SELL_AT_MANDI",
 "abstained": false,
 "source": {
  "source_name": "Agmarknet — Current Daily Price of Various Commodities from Various Markets (Mandi)",
  "observed_at": "2026-11-04T00:00:00",
  "real_world_freshness": "aging"
 },
 "options_first_3": [
  { "mandi": "APMC Amarawati", "district": "Amarawati", "gross_price": 10425, "price_day": "2026-11-04", "km": 84.4 },
  { "mandi": "APMC Dhamngaon-Railway", "district": "Amarawati", "gross_price": 10300, "price_day": "2026-11-04", "km": 84.4 },
  { "mandi": "APMC Akola", "district": "Akola", "gross_price": 10000, "price_day": "2026-11-04", "km": 0 }
 ],
 "breakeven_baseline": { "code": "own_district", "mandi": "APMC Akola", "price": 10000 },
 "breakeven": [
  { "mandi": "APMC Amarawati", "price_advantage_per_q": 425, "km": 84.4, "break_even_rs_per_q_per_km": 5.035 },
  { "mandi": "APMC Dhamngaon-Railway", "price_advantage_per_q": 300, "km": 84.4, "break_even_rs_per_q_per_km": 3.554 }
 ]
}
```

`options_first_3` is the first three of the backend's `options` list; the other keys are as sent.

## 4. Test output

`npx vitest run --coverage`, 2026-11-06:

```
 Test Files  15 passed (15)
      Tests  97 passed (97)
Statements   : 92.85% ( 858/924 )
Branches     : 85.38% ( 882/1033 )
Functions    : 91.12% ( 267/293 )
Lines        : 94.21% ( 716/760 )
```

| Test file | Tests |
|---|---|
| `a_marathi_or_hindi_page_shows_no_english.test.jsx` | 17 |
| `task4_defects.test.jsx` | 13 |
| `aiaic_api.test.js` | 12 |
| `bad_backend_fields.test.jsx` | 10 |
| `warehouses_card.test.jsx` | 6 |
| `wdra_lists_by_state.test.js` | 6 |
| `top5_show_more.test.jsx` | 5 |
| `weather_note_panel.test.jsx` | 5 |
| `card_boundary.test.jsx` | 4 |
| `transport_cost_card.test.jsx` | 4 |
| `backend_english_is_not_shown_in_marathi.test.jsx` | 3 |
| `district_map.test.jsx` | 3 |
| `storage_price_not_district.test.jsx` | 3 |
| `the_store_panel_never_shows_a_fixed_band_as_a_range.test.jsx` | 3 |
| `we_did_not_ask_cleanup.test.js` | 3 |
| **Total** | **97** |

`npm run lint` (`eslint .`): no errors, no warnings. `npm run build`: succeeds; `dist/assets/index-*.js` is
1,484.76 kB (364.72 kB gzipped), over Vite's 500 kB warning limit.

Coverage measures only `.js` and `.jsx` source files; `src/main.jsx` (it only mounts the app) and the test files are
left out (`vite.config.js`).

## 5. Steps to reproduce

1. `git clone https://github.com/blackholeinfiverse37/Maharashtra-district---initial-pilot..git` and `cd` into it.
2. `npm ci` (every dependency is pinned exactly in `package.json`).
3. Copy `.env.example` to `.env` and set `VITE_AIAIC_API` to the AIAIC server's address (never commit it).
4. `npx vitest run --coverage`: the tests and coverage in section 4. The tests use recorded backend answers
   (`src/test/recorded/`) and need no server.
5. `npm run lint` and `npm run build`.
6. The two API samples: `curl -H "ngrok-skip-browser-warning: true" "$VITE_AIAIC_API/places/soil-moisture?district=Nashik&state=maharashtra&lang=en"`
   and `curl -H "ngrok-skip-browser-warning: true" "$VITE_AIAIC_API/view/unified?crop=tur&region=Akola&state=maharashtra&lang=en"`.
   Live answers change from day to day; the values above are those of 2026-11-06.
7. The bad-field test (section 6) was run from a copy of the project outside the repository; its script is not in
   the repository.

**Clean-copy check (2026-11-06).** To show the repository works on its own: a fresh clone of the local `main` branch
(at commit 8d2f34f) into a new, empty folder, with **no `.env` file**, on Node v24.11.1 and npm 11.6.2. Exact commands
and results:

```
$ git clone <repository link> aiaic-check
$ cd aiaic-check
$ npm ci
added 286 packages in 6s
$ npm test
 Test Files  15 passed (15)
      Tests  97 passed (97)
$ npm run lint
(no output: no errors, no warnings; exit 0)
$ npm run build
dist/index.html                     0.49 kB │ gzip:   0.32 kB
dist/assets/index-B7LVO9Ok.css     34.16 kB │ gzip:  11.16 kB
dist/assets/index-DjyvKAcH.js   1,484.71 kB │ gzip: 364.68 kB
✓ built in 501ms
(!) Some chunks are larger than 500 kB after minification.
```

All four steps exited with 0, and the clone had no changed files afterwards. The tests need no `.env` and no server:
they use recorded backend answers, and the one test that loads the whole page sets its own test address
(`src/test/backend_english_is_not_shown_in_marathi.test.jsx`). The build sizes differ slightly from those in section 4,
which were measured in the working folder.

## 6. Results

**Logic defects (Task 4).** Nine defects from the 2026-11-05 audit, each with a regression test in
`src/test/task4_defects.test.jsx` that failed on the code before the fix and passes after it:

| # | Defect | Fixed in |
|---|---|---|
| 1 | Storage: a fixed ±2% band shown as a range when there is a sample calculation | `SimulationPanel.jsx` |
| 2 | Water: English and Marathi gave opposite taluka advice when CGWB's list was held | `DataDisplayPanel.jsx` |
| 3 | Weather: past forecast days shown as "this week" | `WeatherNotePanel.jsx` |
| 4 | Storage: "not from <district>" when the mandi is in the selected district | `SimulationPanel.jsx` |
| 5 | Price: a price and a recommended mandi shown for an abstained answer | `DataDisplayPanel.jsx`, `TopMandisPanel.jsx` |
| 6 | Harvest: the yield of whichever season row came first | `DataDisplayPanel.jsx` |
| 7 | Warehouses: "none in or near" when nearby districts could not be checked | `WarehousesPanel.jsx` |
| 8 | Weather: the crop's own weather answer never shown | `WeatherNotePanel.jsx` |
| 9 | Water: the percentage described against the wrong total | `en.js`, `hi.js`, `mr.js` |

Also fixed, each with a test: two storage-card crashes on bad data (`read_these_first`, and summary sections or items
that are not lists), and WDRA district names with a part in brackets ("Khandwa (East Nimar)" now matches "Khandwa").

**Storage sample calculation note.** The backend's "ILLUSTRATIVE ONLY" note is not shown in any language. Under the
sample calculation, the dashboard shows its own line in English, Hindi and Marathi: "Please check with an agronomist
before you rely on this."

**Bad-field test.** Every field of live backend answers (Akola + tur, English and Marathi, plus the forecast) and of
the map's outlook, district points and warehouse list, changed one at a time to 10 bad values (missing, null, empty
text, wrong type, empty list or object, NaN, a very large number, -1):

| Run | Code | Changes tested | Crashes |
|---|---|---|---|
| Last full run | after all Task 4 fixes, before the agronomist line | 20,050 card changes and 1,430 map changes | **0** |
| Storage card only | final code (after the agronomist line) | 4,430 storage changes (every field under the storage answer, plus the whole answer) | **0** |

Only the storage card was retested after the final change, because only that card changed since the last full run
(the agronomist line in `SimulationPanel.jsx`, and new strings). The other cards and the map rely on the last full run.
Before Task 4, the same test found 8 crashes in the storage card (and, on 2026-11-05, 262 card and 11 map crashes,
fixed in Task 3).

**Error boundary.** Every card is wrapped in `src/components/CardBoundary.jsx`: a card that fails shows a short message
in the chosen language and the rest of the page keeps working.

**Repeatable build.** 50 builds in a row gave the same `dist/` (SHA-256 `d5f9d9e8dcd4…afaa1c04`), on 2026-11-04, on
the code before Task 3 and Task 4. Not repeated on the final code.

## 7. Known gaps and handover

- **Ask agronomists before final deploy: the storage sample calculation and its wording need an agronomist's review.**
- **Blocked downloads.** On 30 Oct 2026 the sign-in code (OTP) for data.gov.in did not arrive, on the owner's mobile number or email, so the owner could not sign in. The 2025 soil moisture data and the DES crop production data could not be downloaded. This is a sign-in problem on the owner's account; the site's own status was not checked.
- **Translations.** Every dashboard string in Hindi and Marathi is machine-drafted and waits for a native speaker's
  review (`docs/translations_for_review.csv`, 179 strings).
- **District names that still differ.** 30 active Madhya Pradesh warehouses are not placed on the map, because WDRA
  and AIAIC spell two districts differently: Narsimhapur / Narsinghpur (29) and Agar-Malwa / Agar Malwa (1). The
  bracket rule fixed Khandwa and Khargone.
- **Madhya Pradesh warehouse list date.** The WDRA file has none, so the card shows no "as on" date for Madhya Pradesh.
- **Personal names in the public history.** Earlier commits (from 84a6bdf) of `src/data/wdra_warehouses.json` hold
  Maharashtra warehouse names with a "C/o" part, which may name a person. The current file has none (a test checks
  this), but the history keeps them; removing them would need a history rewrite and a force push.
- **Large build file.** 1,484.76 kB (364.72 kB gzipped), mostly the warehouse list, which also holds 3,171 inactive or
  suspended rows the page never shows.
- **Bad-field test scope.** It used one district and crop's answers (Akola + tur) in two languages; other answers may
  hold fields these did not. The script is outside the repository.
- **Repeatable build** not repeated on the final code (section 6).
- **Unused code.** `src/components/TimeRangeSelector.jsx` is not used anywhere (0% coverage).
- **Background card** (e-NAM mandis, soil moisture) is built but switched off; its soil moisture is 2020 data only.
- **Python checks** (pytest, requirements.txt, Pydantic) apply to the forecast service repository, not to this React
  dashboard.
