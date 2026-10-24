// A MARATHI OR HINDI PAGE SHOWS NO ENGLISH (23 Oct 2026).
//
// Seen on the page (Bhandara, tur, Marathi): the warning box ended with AIAIC's English note to developers ("Engine runs
// on UNCALIBRATED ...") and "where to sell" said "Sell at APMC Savner". AIAIC answers each item twice: the engine's
// RECORD, English in every language by design, and its SUMMARY in the language asked. The page read the record in
// several places; it now reads the summary (src/i18n/backendText.js), and a line AIAIC has only in English is counted
// behind one tap (src/components/EnglishOnly.jsx), never mixed into Marathi or Hindi and never dropped.
//
// Read from AIAIC's own answers (src/test/recorded/*_2026-10-23.json; how each was made is written in the file). The
// page is checked as a person sees it: every word of visible text, Latin letters allowed only in proper names (the
// mandis and talukas the answer names, organisations and sources by their own acronyms) and in "English", the language
// picker's name for English. The English page is checked unchanged where it was right.
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import WDRA from "../data/wdra_warehouses.json";
import LanguageProvider from "../i18n/LanguageProvider";
import { LanguageContext } from "../i18n/LanguageContext";
import { languageByCode } from "../i18n/languages";
import { STRINGS } from "../i18n/strings";
import { toDistrictView } from "../data_adapter/aiaicApi";
import { isNotAskedWarning, isPriceNotDistrictWarning } from "../config/backendTextCleanup";
import DataDisplayPanel from "../components/DataDisplayPanel";
import SimulationPanel from "../components/SimulationPanel";
import BackgroundInfoPanel from "../components/BackgroundInfoPanel";
import nashik from "./recorded/view_unified_onion_nashik_2026-10-23.json";
import indore from "./recorded/view_unified_soybean_indore_storage_2026-10-23.json";
import soil from "./recorded/places_soil_moisture_2026-10-23.json";

// The page's calls, answered from the recorded answers (set by each test); the routes a test does not use fail, and
// the page hides what they would have shown, as it does when a call fails.
const api = vi.hoisted(() => ({ view: null, lists: null }));
vi.mock("../data_adapter/aiaicApi", async (importOriginal) => {
  const actual = await importOriginal();
  const notUsed = () => Promise.reject(new Error("not used in this test"));
  return {
    ...actual,
    fetchBackendLanguages: async () => ["en", "hi", "mr"],
    fetchServedStates: async () => ["maharashtra"],
    fetchDistricts: async () => [api.lists.district],
    fetchCrops: async () => [api.lists.crop],
    fetchDistrictView: async () => api.view,
    fetchWeatherForecast: notUsed,
    fetchWeatherOutlook: notUsed,
    fetchPlacesMap: notUsed,
    fetchEnamMandis: notUsed,
    fetchSoilMoisture: notUsed,
  };
});

// jsdom lays nothing out, so the crop-area chart is given a size here; everything else is recharts' own.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal();
  const { cloneElement } = await import("react");
  return { ...actual, ResponsiveContainer: ({ children }) => cloneElement(children, { width: 640, height: 320 }) };
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

// The /view/unified answer in one language, as the server sends it (the record is the same in every language).
const answerIn = (fixture, lang) => ({
  lang,
  services: Object.fromEntries(
    Object.entries(fixture.intelligence).map(([service, items]) => [
      service,
      items.map((intelligence, i) => ({ intelligence, summary: fixture.summary[lang][service][i] })),
    ]),
  ),
  na_reasons: fixture.na_reasons[lang],
});
const viewIn = (fixture, lang) => toDistrictView(answerIn(fixture, lang));

// Stand-ins for the two list routes (/places/districts, /places/crops), which only fill the dropdowns here: Nashik and
// onion under the names AIAIC's own name tables give them (AIAIC: engine/presentation/names.py).
const NAMES = { en: ["Nashik", "Onion"], mr: ["नाशिक", "कांदा"], hi: ["नाशिक", "प्याज"] };
const listsIn = (lang) => ({
  district: { key: "nashik", name: NAMES[lang][0], name_en: "Nashik" },
  crop: { key: "onion", name: NAMES[lang][1], name_en: "Onion" },
});

// A component on its own, in one language (what the language provider would give it).
const inLanguage = (lang, ui) => {
  const l = languageByCode(lang);
  const value = { lang: l.code, apiLang: l.code, locale: l.locale, dir: l.dir, showsEnglishNote: false,
    selectable: [], setLanguage: () => {} };
  return render(<LanguageContext.Provider value={value}>{ui}</LanguageContext.Provider>);
};

// The text a person sees: a closed <details> shows only its <summary>; attributes (tooltips) are not text.
function visibleText(root) {
  const parts = [];
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.hidden || ["SCRIPT", "STYLE"].includes(node.tagName)) return;
    if (node.tagName === "DETAILS" && !node.open) {
      const summary = [...node.children].find((c) => c.tagName === "SUMMARY");
      if (summary) walk(summary);
      return;
    }
    node.childNodes.forEach(walk);
  };
  walk(root);
  return parts.join(" ").replace(/\s+/g, " ");
}

// Proper names may stay in Latin letters: the mandis and talukas the answer names, and these organisations and sources
// by their own names or acronyms. "English" is the language picker's name for English.
const KEPT = ["AIAIC", "APMC", "Agmarknet", "CGWB", "DES", "MoSPI", "ICAR", "FPO", "CWC", "MSP", "WDRA", "AIF", "e-NAM",
  "SFAC", "NWIC", "GEC", "English"];
function englishWords(text, fixture) {
  const proper = new Set();
  for (const items of Object.values(fixture.intelligence)) {
    for (const item of items) {
      const se = item.supporting_evidence || {};
      [se.representative_mandi, item.subject?.reference_mandi].forEach((n) => n && proper.add(n));
      for (const o of se.options || []) o?.mandi && proper.add(o.mandi); // the mandis the market answer compared
      for (const o of se.also_in_window || []) o?.mandi && proper.add(o.mandi); // and those from other days
      for (const u of se.cgwb_units_2025?.stressed_units || []) [u.unit, u.shown].forEach((n) => n && proper.add(n));
    }
  }
  for (const lang of Object.keys(fixture.summary)) {
    for (const row of fixture.summary[lang].market?.[0]?.price_compare?.rows || []) proper.add(row.mandi);
  }
  // the warehouse card's names and addresses: WDRA's own, never translated
  for (const w of WDRA.warehouses) [w.name, w.address].forEach((n) => n && proper.add(n));
  let rest = text;
  for (const name of [...proper].sort((a, b) => b.length - a.length)) rest = rest.split(name).join(" ");
  return (rest.match(/[A-Za-z][A-Za-z'-]*/g) || []).filter((w) => w.length > 1 && !KEPT.includes(w));
}

// The whole page for Nashik and onion, in `lang`, as a person reaches it: language remembered, district, then crop.
async function openThePage(lang) {
  window.localStorage.setItem("aiaic.lang", lang);
  api.lists = listsIn(lang);
  api.view = viewIn(nashik, lang);
  const { container } = render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  );
  const selects = () => [...container.querySelectorAll("select.field-select")].filter((s) => s.id !== "language-select");
  await waitFor(() => expect(selects()[1].querySelectorAll("option").length).toBe(2));
  fireEvent.change(selects()[1], { target: { value: "Nashik" } });
  await waitFor(() => expect(selects()[2].querySelectorAll("option").length).toBe(2));
  fireEvent.change(selects()[2], { target: { value: "onion" } });
  await waitFor(() => expect(container.querySelector(".recharts-legend-item-text")).toBeTruthy());
  return container;
}

describe.each(["mr", "hi"])("the whole page in %s", (lang) => {
  test("shows no English word but proper names", async () => {
    const page = await openThePage(lang);
    const text = visibleText(page);
    expect(englishWords(text, nashik)).toEqual([]);
    // and it shows AIAIC's own words in her language where the English stood
    expect(text).toContain(nashik.summary[lang].market[0].action.text); // where to sell
    expect(text).toContain(nashik.summary[lang].crop[0].district_crops.names[0].name); // the chart's first crop
    expect(text).not.toContain("UNCALIBRATED");
    expect(text).not.toContain("Sell at");
    // the browser tab's title too (index.html holds the English one)
    expect(document.title).toBe(STRINGS[lang]["app.title"]);
  });

  test("keeps every storage warning AIAIC marks, in her language", async () => {
    const page = await openThePage(lang);
    const text = visibleText(page);
    const summary = nashik.summary[lang].storage[0];
    const caps = new Set(summary.confidence.cap_reasons);
    const marked = summary.sections.find((s) => s.id === "caveats").items.filter((c) => c.priority && !caps.has(c.text));
    // two are left out on purpose (src/config/backendTextCleanup.js): the one that says she was not asked, and the long
    // "price is not Nashik's" one, which the card says in one short line of its own; every other is shown
    const shown = marked.filter((c) => text.includes(c.text.slice(0, 40)));
    expect(marked.length - shown.length).toBe(2);
    expect(text).toContain(STRINGS[lang]["storage.priceFromMedianNoPlace"].split("{mandi}")[0]);
    expect(marked.every((c) => c.lang === lang)).toBe(true);
  });
});

describe("the English page", () => {
  test("is unchanged where it was right", async () => {
    const page = await openThePage("en");
    const text = visibleText(page);
    expect(text).toContain("Sell at APMC Pimpalgaon Baswant"); // the summary says the engine's own words in English
    expect(text).toContain("Engine runs on UNCALIBRATED illustrative defaults"); // the full note, in English only
    expect(text).toContain("THE BEST AND WORST CASES ON THIS CARD ARE NOT AN ESTIMATE OF RISK"); // the engine's own warnings
    expect(text).not.toContain("PRICE IS NOT NASHIK'S"); // said in one short line instead
    expect(text).toContain("This price is from APMC Kopargaon (Ahilyanagar district), the median mandi for this crop statewide");
    expect(text).toContain("Agmarknet — Current Daily Price of Various Commodities from Various Markets (Mandi)");
    expect(text).toContain("For this district it covers only: Rice, Wheat, Maize");
    expect(text).toContain("DES 2024-25 field-crop set");
    expect(text).toContain("Market paying the most: APMC Pimpalgaon Baswant");
    expect(document.title).toBe("AIAIC District Intelligence Dashboard"); // as index.html has it
  });
});

describe("the storage card's sample calculation (Indore, soybean: a scenario AIAIC runs under stated assumptions)", () => {
  const storageIn = (lang) => ({ storage: viewIn(indore, lang).storage });

  test.each(["mr", "hi"])("in %s says the sample and its note in her language", (lang) => {
    const { container } = inLanguage(lang, <SimulationPanel data={storageIn(lang)} districtName="इंदौर" />);
    const text = visibleText(container);
    const block = indore.summary[lang].storage[0].illustrative_scenario;
    expect(text).toContain(block.text);
    expect(text).toContain(block.note.slice(0, 30));
    expect(englishWords(text, indore)).toEqual([]);
  });

  test("in English keeps the sample's own code and note", () => {
    const { container } = inLanguage("en", <SimulationPanel data={storageIn("en")} districtName="Indore" />);
    const text = visibleText(container);
    expect(text).toContain("In this sample calculation: sell now");
    expect(text).toContain("ILLUSTRATIVE ONLY");
  });
});

describe("a line AIAIC has only in English", () => {
  test("is counted behind one tap on a Marathi page, never shown in her language's place", () => {
    const view = viewIn(nashik, "mr");
    const storage = structuredClone(view.storage[0]);
    const caveats = storage.summary.sections.find((s) => s.id === "caveats").items;
    const shout = caveats.find((c) => c.priority && !storage.summary.confidence.cap_reasons.includes(c.text));
    // the same answer, one warning as AIAIC would send it untranslated (one the card does not leave out on purpose)
    const english = storage.read_these_first.find((w) => !isNotAskedWarning(w) && !isPriceNotDistrictWarning(w));
    Object.assign(shout, { text: english, lang: "en" });
    const { container } = inLanguage("mr", <SimulationPanel data={{ storage: [storage] }} districtName="नाशिक" />);
    expect(visibleText(container)).not.toContain(english.slice(0, 20));
    expect(screen.getByText("आणखी माहिती, फक्त इंग्रजीत (1)")).toBeTruthy();
    expect(container.querySelector("details").textContent).toContain(english.slice(0, 20));
  });
});

describe("the harvest card finds the chosen crop by AIAIC's crop keys", () => {
  test("tur is found although the crop list calls it 'Tur (arhar)' and DES calls it 'Tur'", () => {
    const { container } = inLanguage("mr", (
      <DataDisplayPanel data={viewIn(nashik, "mr")} crop="तूर" cropEn="Tur (arhar)" cropKey="tur" districtName="नाशिक"
        card="harvest" />
    ));
    expect(visibleText(container)).toContain("0.63"); // DES 2024-25: 630 kg per hectare for Nashik
    expect(visibleText(container)).not.toContain("नोंद सापडली नाही");
  });
});

describe("the water card's taluka line", () => {
  // The same Nashik answer with CGWB's list as AIAIC sends it for a district whose talukas are all safe (Bhandara: 7 of
  // 7), and with no list at all.
  const water = (change) => {
    const view = viewIn(nashik, "mr");
    const item = structuredClone(view.water[0]);
    change(item.supporting_evidence);
    return { ...view, water: [item] };
  };
  const allSafe = (se) => {
    se.cgwb_units_2025.stressed_units = [];
  };
  const noList = (se) => {
    delete se.cgwb_units_2025;
  };

  test("in Marathi, all talukas safe: the plain line, never the backend's English", () => {
    const { container } = inLanguage("mr", <DataDisplayPanel data={water(allSafe)} districtName="नाशिक" card="water" />);
    const text = visibleText(container);
    expect(text).toContain("या जिल्ह्यातील कोणताही तालुका जिल्ह्याच्या सरासरीपेक्षा वाईट श्रेणीत नाही.");
    expect(englishWords(text, nashik)).toEqual([]);
  });

  test("in Marathi, no list: the backend's line is counted apart", () => {
    const { container } = inLanguage("mr", <DataDisplayPanel data={water(noList)} districtName="नाशिक" card="water" />);
    expect(englishWords(visibleText(container), nashik)).toEqual([]);
    expect(screen.getByText("आणखी माहिती, फक्त इंग्रजीत (1)")).toBeTruthy();
  });

  test("in English, as before: the backend's own taluka line", () => {
    const { container } = inLanguage("en", <DataDisplayPanel data={water(allSafe)} districtName="Nashik" card="water" />);
    expect(visibleText(container)).toContain("BUT THE DISTRICT FIGURE HIDES YOUR TALUKA");
  });
});

describe("the background card names its source in her language", () => {
  test.each([
    ["mr", "nashik_mr", "नाशिक", "NWIC (राष्ट्रीय जल माहिती विज्ञान केंद्र)"],
    ["hi", "indore_hi", "इंदौर", "NWIC (राष्ट्रीय जल सूचना विज्ञान केंद्र)"],
  ])("%s", (lang, answer, district, label) => {
    const { container } = inLanguage(lang, <BackgroundInfoPanel enam={null} soil={soil[answer]} districtName={district} />);
    const text = visibleText(container);
    expect(text).toContain(label);
    expect(englishWords(text, nashik)).toEqual([]);
    // the publisher's own words stay, as the tooltip
    expect(container.querySelector(`[title*="National Water Informatics Centre"]`)).toBeTruthy();
  });

  test("en: the publisher's own words, as before", () => {
    const { container } = inLanguage("en", <BackgroundInfoPanel enam={null} soil={soil.nashik_en} districtName="Nashik" />);
    expect(visibleText(container)).toContain("National Water Informatics Centre (Ministry of Jal Shakti)");
  });
});
