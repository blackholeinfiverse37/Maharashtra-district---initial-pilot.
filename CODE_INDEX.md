# CODE_INDEX: AIAIC District Intelligence Dashboard (prototype)

Updated 2026-11-06: the working tree after commit 0e343f7, with the Task 4 changes. What each file is for, what changed
since commit b54256e, and which files make up each recent feature. Entry point and data flow: see `REVIEW_PACKET.md`.
Quality checks (tests, coverage, builds, bad-field test): section 4.

## 1. Files

### src/

```
src/
  main.jsx                      starts React and wraps the app in the language provider
  App.jsx                       the page: state, district and crop pickers, loads the answers, lays out the cards
  index.css                     all styles (Tailwind plus the dashboard's own card, list and map styles)
  App.css                       not used (left from the Vite template)
  assets/
    hero.png                    not used (left from the Vite template)
    react.svg                   not used (left from the Vite template)
    vite.svg                    not used (left from the Vite template)
  components/
    AtAGlancePanel.jsx          "At a glance": the three main answers in large text for a phone
    BackgroundInfoPanel.jsx     "Background information (older data)": e-NAM mandis, soil moisture (switched off in App.jsx)
    CardBoundary.jsx            each card's safety net: a failing card shows a short message, the others keep working
    CropAreaPieChart.jsx        the district's crop area chart (DES)
    CropSelector.jsx            the crop dropdown, filled from the backend's list for the district
    DataDisplayPanel.jsx        harvest, best mandi price, water stress and the taluka warning cards
    DistrictSelector.jsx        the district dropdown
    EnglishOnly.jsx             backend lines that exist only in English, behind one tap on Marathi and Hindi pages
    LanguageSelector.jsx        the English / Hindi / Marathi switch
    SimulationPanel.jsx         the storage card: sell now or store, with the sample calculation
    SystemStateBar.jsx          the status line (loading, chosen district and crop)
    TimeRangeSelector.jsx       not used (an early season picker, not rendered anywhere)
    TopMandisPanel.jsx          "Which mandis pay the most?": top 5 mandis, up to 5 more behind "Show more"
    TransportCostPanel.jsx      mandis in other districts that pay more, with the break-even cost per km
    WarehousesPanel.jsx         "Warehouses in and near your district" from the WDRA list
    Warning.jsx                 one warning in the shared amber style
    WeatherMapPanel.jsx         the district map: weather view and warehouses view (Leaflet)
    WeatherNotePanel.jsx        the 7-day weather forecast card, or the backend's reason when there is none
    freshness.js                turns a source's age (fresh / aging / stale) into a word key
  config/
    backendTextCleanup.js       temporary list of backend wording the dashboard removes or shortens
    geo.js                      straight-line distance between district centres and the 150 km "near" limit
    mapTiles.js                 OpenStreetMap tile address and its licence notice
    states.js                   the states the dashboard offers and the code sent to the backend for each
    waterCategories.js          CGWB groundwater categories, from least to most severe
  data/
    warehousesNear.js           picks the warehouses to show: active, still valid, in or near the district
    wdraClean.js                cleaning rules for the WDRA list (removes personal names and phone numbers)
    wdra_warehouses.json        the cleaned WDRA list (built by scripts/build_wdra.js)
  data_adapter/
    aiaicApi.js                 every call to the AIAIC backend
  i18n/
    LanguageContext.js          the language context and the useLanguage / useT hooks
    LanguageProvider.jsx        holds the chosen language and remembers it
    backendText.js              picks the backend's own Marathi or Hindi text, and marks lines that are only English
    format.js                   dates and numbers in the chosen language's format
    languages.js                every language the dashboard knows, in one place
    translate.js                t(key): the dashboard's own words in the chosen language
    strings/
      en.js                     English words
      hi.js                     Hindi words
      mr.js                     Marathi words
      index.js                  gathers the three string files
  test/
    a_marathi_or_hindi_page_shows_no_english.test.jsx          no English on Marathi or Hindi pages
    aiaic_api.test.js                                          backend calls: what is sent, failed calls, bad answers
    backend_english_is_not_shown_in_marathi.test.jsx           backend English lines stay out of Marathi pages
    bad_backend_fields.test.jsx                                fields of the wrong type are read as "no data"
    card_boundary.test.jsx                                     one failing card does not blank the page
    district_map.test.jsx                                      map switches between weather and warehouses views
    storage_price_not_district.test.jsx                        the short storage price note replaces the long warning
    task4_defects.test.jsx                                     regression tests for the 9 Task 4 defects and 2 crashes
    the_store_panel_never_shows_a_fixed_band_as_a_range.test.jsx   a fixed ±2% band is shown as one price
    top5_show_more.test.jsx                                    Top 5 mandis card and its "Show more"
    transport_cost_card.test.jsx                               transport cost card
    warehouses_card.test.jsx                                   warehouses card and WDRA cleaning rules
    wdra_lists_by_state.test.js                                WDRA lists for several states, no personal columns
    we_did_not_ask_cleanup.test.js                             the temporary backend wording cleanup
    weather_note_panel.test.jsx                                the 7-day weather forecast card
    recorded/                                                  real backend answers, saved for the tests
      places_soil_moisture_2026-10-23.json                     soil moisture answers (Nashik en/mr, Indore hi)
      view_onion_nashik_storage_2026-10-02.json                Nashik onion storage answer
      view_unified_onion_nashik_2026-10-23.json                Nashik onion, all answers, in three languages
      view_unified_soybean_indore_storage_2026-10-23.json      Indore soybean storage answer
```

### scripts/

```
scripts/
  build_wdra.js                 builds src/data/wdra_warehouses.json from the WDRA CSV (kept outside the repo)
```

### docs/

```
docs/
  ADR-T-GOV-F02.md              decision record: how the dashboard shows backend data it cannot trust
  EVIDENCE_T-GOV-F02.md         evidence: AIKosh and MASTERDB, two API samples, test output, steps, results, known gaps
  demo_1.mp4                    a demo video of the dashboard (committed 2026-09-23)
  translations_for_review.csv   every dashboard string in English, Hindi and Marathi, for a native speaker to check
```

## 2. Files changed since b54256e

`git diff --stat b54256e HEAD`: 37 files changed, 17,332 insertions, 153 deletions. One of the 37 is a root-level
instruction file for the repository, which is not listed below.

```
 docs/translations_for_review.csv                   |   48 +-
 eslint.config.js                                   |    5 +
 scripts/build_wdra.js                              |   63 +
 src/App.jsx                                        |   73 +-
 src/components/AtAGlancePanel.jsx                  |    7 +-
 src/components/BackgroundInfoPanel.jsx             |   28 +-
 src/components/CropAreaPieChart.jsx                |   20 +-
 src/components/DataDisplayPanel.jsx                |   55 +-
 src/components/EnglishOnly.jsx                     |   19 +
 src/components/SimulationPanel.jsx                 |   70 +-
 src/components/TopMandisPanel.jsx                  |  126 +
 src/components/TransportCostPanel.jsx              |   61 +
 src/components/WarehousesPanel.jsx                 |   68 +
 src/components/WeatherMapPanel.jsx                 |  193 +-
 src/config/backendTextCleanup.js                   |   20 +
 src/config/geo.js                                  |   28 +
 src/data/warehousesNear.js                         |   47 +
 src/data/wdraClean.js                              |   64 +
 src/data/wdra_warehouses.json                      | 4267 +++++++++++
 src/data_adapter/aiaicApi.js                       |   10 +-
 src/i18n/backendText.js                            |  102 +
 src/i18n/strings/en.js                             |   57 +-
 src/i18n/strings/hi.js                             |   56 +-
 src/i18n/strings/mr.js                             |   56 +-
 src/index.css                                      |   95 +
 ...marathi_or_hindi_page_shows_no_english.test.jsx |  301 +
 ...ackend_english_is_not_shown_in_marathi.test.jsx |  143 +
 src/test/district_map.test.jsx                     |   66 +
 .../recorded/places_soil_moisture_2026-10-23.json  | 1507 ++++
 .../view_unified_onion_nashik_2026-10-23.json      | 7494 ++++++++++++++++++++
 ..._unified_soybean_indore_storage_2026-10-23.json | 1917 +++++
 src/test/storage_price_not_district.test.jsx       |   77 +
 src/test/top5_show_more.test.jsx                   |   87 +
 src/test/transport_cost_card.test.jsx              |   81 +
 src/test/warehouses_card.test.jsx                  |  147 +
 src/test/we_did_not_ask_cleanup.test.js            |   25 +
```

Committed after this list: 0baa199 (test coverage setup), 7555d38 (Madhya Pradesh warehouses, the error boundary,
the bad-data fixes and their tests) and 0e343f7 (review packet and code index). Task 4 (2026-11-06) changes
`src/components/{DataDisplayPanel,SimulationPanel,TopMandisPanel,WarehousesPanel,WeatherNotePanel}.jsx`,
`src/config/geo.js`, `src/data_adapter/aiaicApi.js`, the three string files and their CSV, and adds
`src/test/task4_defects.test.jsx`, `docs/ADR-T-GOV-F02.md` and `docs/EVIDENCE_T-GOV-F02.md`.

## 3. Recent features and their files

The weather map (3336381) and the language switch (bc21758) were committed on 2026-10-22, before b54256e, so their
first versions are not in the list above. The warehouse view on the map came later, in 84a6bdf.

| Feature | Commits | Files |
|---|---|---|
| Top 5 mandis card | fa0b36f, 5be526d ("Show more") | `src/components/TopMandisPanel.jsx`, `src/App.jsx`, `src/i18n/strings/{en,hi,mr}.js`, `src/index.css`, `src/test/top5_show_more.test.jsx` |
| Warehouses card | 84a6bdf | `src/components/WarehousesPanel.jsx`, `src/data/warehousesNear.js`, `src/data/wdraClean.js`, `src/data/wdra_warehouses.json`, `scripts/build_wdra.js`, `src/config/geo.js`, `src/components/WeatherMapPanel.jsx` (warehouses view), `src/test/warehouses_card.test.jsx`, `src/test/district_map.test.jsx` |
| Marathi/Hindi backend text fixes | fa0b36f, b7c6d11, 5be526d | `src/i18n/backendText.js`, `src/components/EnglishOnly.jsx`, `src/config/backendTextCleanup.js`, `src/data_adapter/aiaicApi.js`, `src/components/{AtAGlancePanel,BackgroundInfoPanel,CropAreaPieChart,DataDisplayPanel,SimulationPanel}.jsx`, `src/test/a_marathi_or_hindi_page_shows_no_english.test.jsx`, `src/test/backend_english_is_not_shown_in_marathi.test.jsx`, `src/test/storage_price_not_district.test.jsx`, `src/test/we_did_not_ask_cleanup.test.js`, `src/test/recorded/*_2026-10-23.json` |
| Weather map | 3336381 | `src/components/WeatherMapPanel.jsx`, `src/config/mapTiles.js`, `src/data_adapter/aiaicApi.js` (`/weather/outlook`), `src/App.jsx`, `src/index.css`, `package.json` (leaflet) |
| Language switch | bc21758 | `src/components/LanguageSelector.jsx`, `src/i18n/{LanguageContext,languages,format,translate}.js`, `src/i18n/LanguageProvider.jsx`, `src/i18n/strings/{en,hi,mr,index}.js`, `src/main.jsx`, `docs/translations_for_review.csv` |

## 4. Quality checks

As of 2026-11-06 (details in `REVIEW_PACKET.md`, section 7, and `docs/EVIDENCE_T-GOV-F02.md`):

- **Tests:** 15 files, 97 tests, all passing (`npx vitest run`).
- **Coverage:** statements 92.85%, branches 85.38%, functions 91.12%, lines 94.21% (`npx vitest run --coverage`;
  `.js`/`.jsx` source only, `src/main.jsx` and the tests left out).
- **Repeatable build:** 50 builds in a row gave the same `dist/` (SHA-256 `d5f9d9e8dcd4…afaa1c04`, 2026-11-04, on the
  code before the Task 3 and Task 4 fixes; not repeated on the final code).
- **Bad-field test:** 0 crashes. The last full run, after all Task 4 fixes: 0 in 20,050 card changes and 1,430 map
  changes. After the final change, only the storage card was retested, because only that card changed since: 0 in
  4,430 storage changes.
- **Task 4:** 9 logic defects fixed, each with a regression test that failed before the fix
  (`src/test/task4_defects.test.jsx`); the storage sample's "ILLUSTRATIVE ONLY" note replaced by the dashboard's own
  agronomist line.
- **Warehouses:** Madhya Pradesh included (3,710 rows read, 662 active) alongside Maharashtra (426 rows, 303 active).
- **Error boundary:** `src/components/CardBoundary.jsx` around every card in `src/App.jsx`.

Python checks (pytest, requirements.txt, Pydantic) apply to the forecast service repository, not to this React dashboard.
