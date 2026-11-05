// Fields of the wrong type from the backend are read as "no data", never a crash: a source's freshness that is not
// text, a weather outlook whose districts are not a list, and warehouse lists that are not a list. Found by feeding
// every card bad values one field at a time. Made-up districts, mandis and sources only.
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AtAGlancePanel from "../components/AtAGlancePanel";
import DataDisplayPanel from "../components/DataDisplayPanel";
import WeatherMapPanel from "../components/WeatherMapPanel";
import { freshnessKey, freshnessStatus } from "../components/freshness";
import { listDate } from "../data/warehousesNear";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const NOT_TEXT = [true, false, 7, NaN, [], ["stale"], {}, { status: "stale" }];

test("freshness that is not text gives no word; text still works", () => {
  for (const v of NOT_TEXT) {
    expect(freshnessStatus({ real_world_freshness: v })).toBe("");
    expect(freshnessKey({ real_world_freshness: v })).toBeNull();
  }
  expect(freshnessKey({ real_world_freshness: "Stale" })).toBe("fresh.stale");
  expect(freshnessKey({ freshness: "fresh" })).toBe("fresh.fresh");
  expect(freshnessKey(null)).toBeNull();
});

const view = (freshness) => {
  const source = { source_name: "Test prices", observed_at: "2026-11-01", real_world_freshness: freshness };
  return {
    market: [{ recommendation: "SELL_AT_MANDI", sources_used: [source], summary: { action: { text: "Sell at APMC Test" } } }],
    water: [{ sources_used: [source], supporting_evidence: {}, summary: null }],
    crop: [{ sources_used: [source], supporting_evidence: {}, summary: null }],
    na_reasons: {},
  };
};

test("the cards that show freshness draw normally, without a freshness word, when it is not text", () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  for (const v of NOT_TEXT) {
    const data = view(v);
    render(<AtAGlancePanel data={data} />);
    expect(screen.getByText("Sell at APMC Test")).toBeTruthy();
    expect(screen.getByText("Data from 1 Nov 2026")).toBeTruthy(); // the date, and no "(Old)" or similar after it
    cleanup();
    for (const card of ["price", "water", "harvest"]) {
      const { container } = render(<DataDisplayPanel data={data} crop="Grain" cropEn="Grain" cropKey="grain" districtName="Home" card={card} />);
      expect(container.querySelector(".card-title")).toBeTruthy();
      expect(container.textContent).not.toMatch(/Up to date|Getting old|\(Old\)/);
      cleanup();
    }
  }
  expect(errors).not.toHaveBeenCalled();
});

const mapData = {
  points: [
    { key: "home", name_en: "Home", district: "Home", lat: 20.0, lon: 76.0 },
    { key: "near", name_en: "Near", district: "Near", lat: 20.5, lon: 76.5 },
  ],
};
const wh = { id: "1", name: "", address: "Gat 1", district: "Home", state: "Teststate", capacity_mt: 1000, valid_upto: "2099-01-01", status: "Active" };
const warehouses = { lists: [{ state: "Teststate", source_last_updated: "2026-10-21" }], warehouses: [wh] };

test("an outlook whose districts are not a list: no weather view; the warehouses view still shows", () => {
  for (const districts of ["x", 7, true, {}, { Home: {} }, null]) {
    const { container } = render(
      <WeatherMapPanel outlook={{ days: 7, districts }} mapData={mapData} selectedDistrictEn="Home" warehouses={warehouses} stateName="teststate" />
    );
    expect(screen.queryByText("What is the weather in each district?")).toBeNull();
    expect(screen.getByText("Where are the registered warehouses?")).toBeTruthy();
    expect(container.querySelectorAll(".leaflet-marker-icon")).toHaveLength(2);
    cleanup();
  }
});

test("bad outlook and no warehouse list for the state: the map card is hidden, as with no data", () => {
  const { container } = render(
    <WeatherMapPanel outlook={{ districts: "x" }} mapData={mapData} selectedDistrictEn="Home" warehouses={warehouses} stateName="otherstate" />
  );
  expect(container.innerHTML).toBe("");
});

test("warehouse lists or dates that are not what is expected: no date, the note without one, no crash", () => {
  for (const lists of ["x", 7, true, {}, null]) expect(listDate({ lists }, "teststate")).toBe("");
  expect(listDate({ lists: [{ state: "Teststate", source_last_updated: 20261021 }] }, "teststate")).toBe("");
  expect(listDate({ lists: "x", source_last_updated: "2026-10-21" }, "teststate")).toBe("2026-10-21");
  expect(listDate(null, "teststate")).toBe("");

  const outlook = {
    days: 7,
    districts: [{ name: "Home", max_temp: 30, dry_days: 7, rain_likely_days: 0, some_chance_days: 0, dates: Array(7).fill("2026-11-05") }],
    source: { name: "Testcast", read_at: "2026-11-05T06:00:00+00:00" },
  };
  for (const lists of ["x", {}, 7]) {
    render(<WeatherMapPanel outlook={outlook} mapData={mapData} selectedDistrictEn="Home" warehouses={{ ...warehouses, lists }} stateName="teststate" />);
    fireEvent.click(screen.getByText("Warehouses"));
    expect(screen.getByText("Registered warehouses. Check with the warehouse before you store.")).toBeTruthy();
    cleanup();
  }
});

// ---- Found by the full run of 20,050 card changes and 1,430 map changes ----

const WRONG = ["x", true, 7, {}, null];

test("price, water and harvest cards: bad lists, list items and codes are read as no data", async () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const { default: DataDisplay } = await import("../components/DataDisplayPanel");
  const good = view("fresh");
  const variants = [];
  for (const v of WRONG) {
    variants.push({ ...good, market: [{ ...good.market[0], summary: { price_compare: { rows: v } } }] });
    variants.push({ ...good, water: [{ ...good.water[0], explainability: [v], supporting_evidence: { groundwater_status: v } }] });
    variants.push({ ...good, water: [{ ...good.water[0], explainability: v }] });
    variants.push({ ...good, crop: [{ ...good.crop[0], supporting_evidence: { district_crop_apy: { crops: v } }, summary: { district_crops: { names: v } } }] });
    variants.push({ ...good, crop: [{ ...good.crop[0], supporting_evidence: { district_crop_apy: { crops: [v] } }, summary: { district_crops: { names: [v] } } }] });
  }
  for (const data of variants)
    for (const card of ["price", "water", "harvest"]) {
      for (const lang of ["en", "mr"]) {
        const l = (await import("../i18n/languages")).languageByCode(lang);
        const { LanguageContext } = await import("../i18n/LanguageContext");
        const { container } = render(
          <LanguageContext.Provider value={{ lang, apiLang: lang, locale: l.locale, dir: l.dir, showsEnglishNote: false, selectable: [l], setLanguage() {} }}>
            <DataDisplay data={data} crop="Grain" cropEn="Grain" cropKey="grain" districtName="Home" card={card} />
          </LanguageContext.Provider>
        );
        expect(container.querySelector(".card-title")).toBeTruthy();
        cleanup();
      }
    }
  expect(errors).not.toHaveBeenCalled();
});

test("farmland chart: sources or crops that are not a list draw no chart, no crash", async () => {
  const { default: Pie } = await import("../components/CropAreaPieChart");
  for (const v of WRONG) {
    const data = { crop: [{ sources_used: v, supporting_evidence: { district_crop_apy: { crops: v } }, summary: { district_crops: { names: v } } }] };
    expect(render(<Pie data={data} crop="Grain" cropEn="Grain" cropKey="grain" districtName="Home" />).container.innerHTML).toBe("");
    cleanup();
    const listed = { crop: [{ supporting_evidence: { district_crop_apy: { crops: [v] } } }] };
    expect(render(<Pie data={listed} crop="Grain" districtName="Home" />).container.innerHTML).toBe("");
    cleanup();
  }
});

test("storage warnings and sample words: parts that are not lists or text are read as none", async () => {
  const { mustRead, scenarioWords } = await import("../i18n/backendText");
  for (const v of WRONG) {
    const item = { read_these_first: ["A"], summary: { sections: v, confidence: { cap_reasons: v } } };
    expect(mustRead(item, "mr", "mr")).toEqual({ shown: [], englishOnly: [] });
    const item2 = { summary: { sections: [{ id: "caveats", items: v }], confidence: { cap_reasons: v } } };
    expect(mustRead(item2, "mr", "mr")).toEqual({ shown: [], englishOnly: [] });
  }
  for (const v of [true, 7, {}, [], null]) {
    expect(scenarioWords({}, { recommendation: v, note: v }, "en", "en")).toEqual({ headline: "", note: null, englishOnly: [] });
    expect(scenarioWords({ summary: { illustrative_scenario: { text: v, note: v, note_lang: "mr" } } }, {}, "mr", "mr")).toEqual({
      headline: null,
      note: null,
      englishOnly: [],
    });
  }
  expect(scenarioWords({}, { recommendation: "SELL_NOW" }, "en", "en").headline).toBe("sell now");
});

test("weather card: a summary or day that is not what is expected is left out; the other days show", async () => {
  const { default: WeatherNote } = await import("../components/WeatherNotePanel");
  for (const v of [{}, [], 7, true]) {
    const forecast = {
      summary: { action: { text: v } },
      days: [null, v, { date: "2026-11-06", kind: "dry", kind_text: v, label: v, t_max: 30 }],
      source: { name: v, read_at: "2026-11-05T06:00:00+00:00" },
    };
    const { container } = render(<WeatherNote forecast={forecast} />);
    expect(container.querySelectorAll(".forecast-day")).toHaveLength(1);
    expect(container.textContent).toContain("Dry");
    expect(container.querySelector(".card-sentence")).toBeNull();
    cleanup();
    expect(render(<WeatherNote data={{ weather: v, na_reasons: { weather: { text: v } } }} />).container.innerHTML).toBe("");
    cleanup();
  }
});

test("district map: points that are not a list hide the card; a warehouse status that is not text is not counted", () => {
  for (const points of WRONG) {
    const { container } = render(<WeatherMapPanel outlook={{ districts: [] }} mapData={{ points }} selectedDistrictEn="Home" warehouses={warehouses} stateName="teststate" />);
    expect(container.innerHTML).toBe("");
    cleanup();
  }
  for (const status of [true, 7, {}, [], null]) {
    const bad = { ...warehouses, warehouses: [{ ...wh, status }, { ...wh, id: "2" }] };
    const { container } = render(<WeatherMapPanel outlook={{ districts: [] }} mapData={mapData} selectedDistrictEn="Home" warehouses={bad} stateName="teststate" />);
    const titles = [...container.querySelectorAll(".leaflet-marker-icon")].map((m) => m.getAttribute("title"));
    expect(titles).toContain("Home: 1 registered warehouses, 1,000 tonnes");
    cleanup();
  }
});
