// Regression tests for the 9 logic defects found in the 2026-11-05 audit, the storage card's crash on a
// `read_these_first` that is not a list, and WDRA district names with a bracket. Each test uses the audit's example:
// a recorded backend answer where the audit used one, otherwise made-up names.
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import SimulationPanel from "../components/SimulationPanel";
import DataDisplayPanel from "../components/DataDisplayPanel";
import WeatherNotePanel from "../components/WeatherNotePanel";
import WarehousesPanel from "../components/WarehousesPanel";
import TopMandisPanel from "../components/TopMandisPanel";
import { LanguageContext } from "../i18n/LanguageContext";
import { languageByCode } from "../i18n/languages";
import { toDistrictView } from "../data_adapter/aiaicApi";
import { sameName } from "../config/geo";
import { warehousesNear } from "../data/warehousesNear";
import indore from "./recorded/view_unified_soybean_indore_storage_2026-10-23.json";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const inLanguage = (code, element) => {
  const l = languageByCode(code);
  return render(
    <LanguageContext.Provider
      value={{ lang: code, apiLang: code, locale: l.locale, dir: l.dir, showsEnglishNote: false, selectable: [l], setLanguage() {} }}
    >
      {element}
    </LanguageContext.Provider>
  );
};
// A recorded answer in one language, as the server sends it
const viewIn = (fixture, lang) =>
  toDistrictView({
    services: Object.fromEntries(
      Object.entries(fixture.intelligence).map(([service, items]) => [
        service,
        items.map((intelligence, i) => ({ intelligence, summary: fixture.summary[lang][service][i] })),
      ])
    ),
    na_reasons: fixture.na_reasons[lang],
  });

test("#1 storage: a sample calculation on a fixed ±2% band shows one price and the fixed-band line", () => {
  // recorded Indore soybean answer: cases marked fixed_band plus_minus_2_pct, with a sample calculation
  const { container } = inLanguage("en", <SimulationPanel data={{ storage: viewIn(indore, "en").storage }} districtName="Indore" />);
  const text = container.textContent;
  expect(text).toContain("₹5,200");
  expect(text).not.toContain("₹5,304");
  expect(text).not.toContain("₹5,096");
  expect(text).not.toContain("On a better day");
  expect(text).toContain("only a fixed ±2% around this one price");
  // the backend's "ILLUSTRATIVE ONLY" note is not shown; our own line is, under the sample calculation
  expect(text).not.toContain("ILLUSTRATIVE ONLY");
  expect(text).toContain("Please check with an agronomist before you rely on this.");
});

test("storage: no sample calculation, no agronomist line", () => {
  const data = { storage: [{ recommendation: "SELL_NOW", average_case: { value: 4000 }, summary: null }] };
  const { container } = inLanguage("en", <SimulationPanel data={data} districtName="Home" />);
  expect(container.textContent).not.toContain("agronomist");
});

const water = (explain) => ({
  water: [
    {
      supporting_evidence: {
        groundwater_status: "safe",
        stage_of_extraction_pct: 40,
        cgwb_units_2025: { observed_at: "2025-03-31", stressed_units: [] },
      },
      explainability: explain,
      sources_used: [{ observed_at: "2025-03-31" }],
    },
  ],
  na_reasons: {},
});
test("#2 water: with CGWB's list held and no taluka worse, both languages say so; the GSDA line is never used", () => {
  const data = water(["GSDA's 2023 taluka assessment rates these talukas worse: Testtaluka (critical)."]);
  for (const lang of ["en", "mr"]) {
    const { container } = inLanguage(lang, <DataDisplayPanel data={data} districtName="Home" card="water" />);
    expect(container.textContent).not.toContain("GSDA");
    expect(container.querySelector(".warning")).toBeNull();
    cleanup();
  }
  inLanguage("en", <DataDisplayPanel data={data} districtName="Home" card="water" />);
  expect(screen.getByText("No taluka in this district is in a worse category than the district average.")).toBeTruthy();
});

test("#3 weather: days before today are dropped; with none left the card says the forecast is out of date", () => {
  const old = {
    summary: { action: { text: "Dry, then rain likely." } },
    days: [
      { date: "2026-10-22", kind: "dry", t_max: 31 },
      { date: "2026-10-23", kind: "rain_likely", t_max: 29 },
    ],
    source: { name: "Testcast", read_at: "2026-10-21T06:00:00+00:00" },
  };
  const { container } = inLanguage("en", <WeatherNotePanel forecast={old} today="2026-11-05" />);
  expect(container.querySelectorAll(".forecast-day")).toHaveLength(0);
  expect(container.textContent).not.toContain("Dry, then rain likely.");
  expect(screen.getByText("This forecast is out of date: it was read on 21 Oct 2026. A newer one could not be loaded.")).toBeTruthy();
  cleanup();

  const mixed = { ...old, days: [{ date: "2026-11-04", kind: "dry" }, { date: "2026-11-05", kind: "dry" }, { date: "2026-11-06", kind: "rain_likely" }] };
  const now = inLanguage("en", <WeatherNotePanel forecast={mixed} today="2026-11-05" />).container;
  expect(now.querySelectorAll(".forecast-day")).toHaveLength(2);
  expect(now.textContent).not.toContain("out of date");
});

test("#4 storage: a mandi in the selected district gets a neutral line, never 'not from <district>'", () => {
  const data = {
    storage: [
      {
        recommendation: "SELL_NOW",
        read_these_first: [],
        subject: { region: "Home", reference_mandi: "APMC Near" },
        supporting_evidence: { representative_mandi: "APMC Near", representative_mandi_district: "Home" },
        average_case: { value: 4000 },
        best_case: { value: 4100 },
        worst_case: { value: 3900 },
        summary: null,
      },
    ],
  };
  const { container } = inLanguage("en", <SimulationPanel data={data} districtName="Home" />);
  expect(container.textContent).not.toContain("not from");
  expect(screen.getByText("The price used here comes from APMC Near.")).toBeTruthy();
});

test("#5 price: an abstained market answer shows no price, no recommended mandi, and a 'no advice here' warning", () => {
  const data = {
    market: [
      {
        abstained: true,
        recommendation: "SELL_AT_MANDI",
        recommendation_detail: "Sell at APMC Test",
        average_case: { value: 4300 },
        sources_used: [{ observed_at: "2026-10-24" }],
        summary: { price_compare: { rows: [{ mandi: "APMC Test", role: "chosen", price: 4300 }] } },
        supporting_evidence: { options: [{ mandi: "APMC Test", gross_price: 4300, district: "Home", km: 0, is_local: true }] },
      },
    ],
    na_reasons: {},
  };
  const { container } = inLanguage("en", <DataDisplayPanel data={data} crop="Grain" districtName="Home" card="price" />);
  expect(container.textContent).not.toContain("4,300");
  expect(container.textContent).not.toContain("Market paying the most");
  expect(container.querySelector(".warning").textContent).toBe("No price advice here. The data is not reliable enough.");
  cleanup();
  const top = inLanguage("en", <TopMandisPanel data={data} />).container;
  expect(top.textContent).not.toContain("Recommended"); // the same answer names no recommended mandi there either
});

test("#6 harvest: the yield of the season with the largest area, with the season named", () => {
  // the audit's example rows (Nashik jowar): Kharif 1,000 ha at 1,373 kg/ha, Rabi 4,000 ha at 959 kg/ha, Summer 0 ha
  const data = {
    crop: [
      {
        supporting_evidence: {
          district_crop_apy: {
            year: "2024-25",
            crops: [
              { crop: "Jowar", season: "Kharif", area_lakh_ha: 0.01, yield_kg_ha: 1373 },
              { crop: "Jowar", season: "Rabi", area_lakh_ha: 0.04, yield_kg_ha: 959 },
              { crop: "Jowar", season: "Summer", area_lakh_ha: 0, yield_kg_ha: 832 },
            ],
          },
        },
        summary: null,
      },
    ],
    na_reasons: {},
  };
  const { container } = inLanguage("en", <DataDisplayPanel data={data} crop="Jowar" cropEn="Jowar" districtName="Home" card="harvest" />);
  expect(container.textContent).toContain("0.96");
  expect(container.textContent).not.toContain("1.37");
  expect(screen.getByText("Season with the most area: Rabi")).toBeTruthy();
});

test("#7 warehouses: without the map data, the card says it could not check nearby districts", () => {
  const data = {
    lists: [{ state: "Teststate", source_last_updated: "2026-10-21" }],
    warehouses: [{ id: "1", name: "", address: "Gat 1", district: "Near", state: "Teststate", capacity_mt: 500, valid_upto: "2099-01-01", status: "Active" }],
  };
  const { container } = inLanguage("en", <WarehousesPanel stateName="teststate" districtEn="Home" mapData={null} data={data} today="2026-11-05" />);
  expect(container.textContent).not.toContain("No active registered warehouse is listed in or near this district.");
  expect(container.textContent).toContain("Could not check nearby districts");
});

test("#8 weather: the crop's weather answer is shown as the backend sends it, even when the forecast call failed", () => {
  const data = {
    weather: [{ recommendation: "WAIT", recommendation_detail: "Wait for the next good rain before sowing.", summary: { action: { text: "Wait for the next good rain before sowing." } } }],
    na_reasons: {},
  };
  inLanguage("en", <WeatherNotePanel data={data} forecast={null} />);
  expect(screen.getByText("Wait for the next good rain before sowing.")).toBeTruthy();
  cleanup();
  const mr = { weather: [{ ...data.weather[0], summary: { action: { text: "पुढच्या चांगल्या पावसानंतर पेरणी करा." } } }], na_reasons: {} };
  inLanguage("mr", <WeatherNotePanel data={mr} forecast={null} />);
  expect(screen.getByText("पुढच्या चांगल्या पावसानंतर पेरणी करा.")).toBeTruthy();
});

test("#9 water: the percentage is described against the water that can be safely drawn", () => {
  const { container } = inLanguage("en", <DataDisplayPanel data={water([])} districtName="Home" card="water" />);
  expect(container.textContent).toContain("of the water that can be safely drawn");
  expect(container.textContent).not.toContain("of that refill");
});

test("storage card: a read_these_first that is not a list does not crash the card", () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  for (const v of [true, {}, 1e308, -1, "x", null]) {
    const data = { storage: [{ recommendation: "SELL_NOW", read_these_first: v, average_case: { value: 4000 }, summary: null }] };
    const { container } = inLanguage("en", <SimulationPanel data={data} districtName="Home" />);
    expect(container.querySelector(".card-title")).toBeTruthy();
    cleanup();
  }
  expect(errors).not.toHaveBeenCalled();
});

test("WDRA's 'Khandwa (East Nimar)' matches AIAIC's 'Khandwa'", () => {
  expect(sameName("Khandwa (East Nimar)", "Khandwa")).toBe(true);
  expect(sameName("Khandwa (East Nimar)", "Khargone")).toBe(false);
  const list = [{ id: "1", district: "Khandwa (East Nimar)", state: "Madhya Pradesh", status: "Active", valid_upto: "2099-01-01", capacity_mt: 100 }];
  const mapData = { points: [{ name_en: "Khandwa", lat: 21.8, lon: 76.3 }] };
  expect(warehousesNear({ list, stateName: "madhya pradesh", districtEn: "Khandwa", mapData, today: "2026-11-05" })).toHaveLength(1);
});

test("storage card: summary sections or items that are not lists do not crash the fixed-band check", async () => {
  const { fixedBandOf } = await import("../data_adapter/aiaicApi");
  for (const v of [true, {}, 1e308, -1, "x"]) {
    expect(fixedBandOf({ sections: v })).toBeNull();
    expect(fixedBandOf({ sections: [{ id: "cases", items: v }] })).toBeNull();
  }
  expect(fixedBandOf({ sections: [null, { items: [{ data: { fixed_band: "plus_minus_2_pct" } }] }] })).toBe("plus_minus_2_pct");
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const sim = { recommendation: "SELL_NOW", average_case: { value: 4000 } };
  for (const sections of [true, {}, [null]]) {
    const data = { storage: [{ supporting_evidence: { illustrative_storage_scenario: sim }, summary: { sections } }] };
    const { container } = inLanguage("en", <SimulationPanel data={data} districtName="Home" />);
    expect(container.querySelector(".card-title")).toBeTruthy();
    cleanup();
  }
  expect(errors).not.toHaveBeenCalled();
});
