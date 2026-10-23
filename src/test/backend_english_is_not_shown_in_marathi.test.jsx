// Two texts AIAIC sends only in English, in every language: the market item's `recommendation_detail` (the engine's
// label, "Sell at …") and its `uncalibrated_warning` (a note to developers). In Marathi or Hindi the page must show
// AIAIC's own text in that language instead (summary.action.text) and only the dashboard's translated lead of the
// warning; in English the page must stay exactly as it was.
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AtAGlancePanel from "../components/AtAGlancePanel";
import DataDisplayPanel from "../components/DataDisplayPanel";
import SimulationPanel from "../components/SimulationPanel";
import App from "../App";
import LanguageProvider from "../i18n/LanguageProvider";
import { LanguageContext } from "../i18n/LanguageContext";
import { languageByCode } from "../i18n/languages";
import en from "../i18n/strings/en";
import mr from "../i18n/strings/mr";

const ENGINE_LABEL = "Sell at APMC Test";
const MARATHI_ACTION = "APMC Test येथे विका";
const DEV_NOTE = "Engine runs on UNCALIBRATED illustrative defaults — NOT farmer-ready advice.";

const view = {
  market: [
    {
      recommendation: "SELL_AT_MANDI",
      recommendation_detail: ENGINE_LABEL,
      uncalibrated_warning: DEV_NOTE,
      average_case: { value: 1000 },
      subject: { region: "Test district" },
      summary: { action: { code: "SELL_AT_MANDI", text: MARATHI_ACTION } },
    },
  ],
  na_reasons: {},
};

const inLanguage = (code, element) => {
  const l = languageByCode(code);
  return (
    <LanguageContext.Provider
      value={{ lang: code, apiLang: code, locale: l.locale, dir: l.dir, showsEnglishNote: false, selectable: [l], setLanguage() {} }}
    >
      {element}
    </LanguageContext.Provider>
  );
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

test("where to sell: Marathi shows AIAIC's Marathi text, never the English label; English is unchanged", () => {
  render(inLanguage("mr", <AtAGlancePanel data={view} />));
  expect(screen.getByText(MARATHI_ACTION)).toBeTruthy();
  // The price card names the chosen mandi under the dashboard's Marathi label (Hemanth's version)
  render(inLanguage("mr", <DataDisplayPanel data={view} crop="पीक" districtName="जिल्हा" card="price" />));
  expect(screen.getByText(mr["price.payingMost"].replace("{mandi}", "APMC Test"))).toBeTruthy();
  expect(document.body.textContent).not.toContain("Sell at");
  cleanup();

  // English: AIAIC's English summary says the same as the engine's label
  const viewEn = { ...view, market: [{ ...view.market[0], summary: { action: { code: "SELL_AT_MANDI", text: ENGINE_LABEL } } }] };
  render(inLanguage("en", <AtAGlancePanel data={viewEn} />));
  expect(screen.getByText(ENGINE_LABEL)).toBeTruthy();
  render(inLanguage("en", <DataDisplayPanel data={viewEn} crop="Crop" districtName="District" card="price" />));
  expect(screen.getByText("Market paying the most: APMC Test")).toBeTruthy();
  expect(document.body.textContent).not.toContain(MARATHI_ACTION);
});

// The whole page, with the backend answered by a stub: the warning box is in App
const stubBackend = () =>
  vi.stubGlobal("fetch", async (url) => {
    const path = new URL(String(url)).pathname;
    const json = (body) => ({ ok: true, status: 200, json: async () => body });
    if (path.endsWith("/catalog")) return json({ states: { served: ["maharashtra"] } });
    if (path.endsWith("/openapi.json")) return json({ paths: {} });
    if (path.endsWith("/places/districts")) return json({ districts: [{ key: "d1", name: "जिल्हा", name_en: "District" }] });
    if (path.endsWith("/places/crops")) return json({ crops: [{ crop: "c1", name: "पीक", name_en: "Crop" }], first_page: ["c1"] });
    if (path.endsWith("/view/unified")) return json({ services: { market: [{ intelligence: view.market[0], summary: view.market[0].summary }] } });
    return { ok: false, status: 404, json: async () => ({}) };
  });

const openDistrictPage = async (container) => {
  const selects = () => container.querySelectorAll("select"); // language, state, district, crop
  await waitFor(() => expect(selects()[2].options.length).toBeGreaterThan(1));
  fireEvent.change(selects()[2], { target: { value: "District" } });
  await waitFor(() => expect(selects()[3].options.length).toBeGreaterThan(1));
  fireEvent.change(selects()[3], { target: { value: "c1" } });
  await waitFor(() => expect(container.querySelector(".warning")).toBeTruthy());
  return container.querySelector(".warning").textContent;
};

test("warning box: Marathi shows only the translated lead; English keeps the full note", async () => {
  stubBackend();
  window.localStorage.setItem("aiaic.lang", "mr");
  const marathi = render(<LanguageProvider><App /></LanguageProvider>);
  const marathiWarning = await openDistrictPage(marathi.container);
  expect(marathiWarning).toBe(mr["app.uncalibratedLead"]);
  expect(marathiWarning).not.toContain("UNCALIBRATED");
  cleanup();

  window.localStorage.setItem("aiaic.lang", "en");
  const english = render(<LanguageProvider><App /></LanguageProvider>);
  const englishWarning = await openDistrictPage(english.container);
  expect(englishWarning).toBe(`${en["app.uncalibratedLead"]} ${DEV_NOTE}`);
});

test("storage headline: Marathi shows AIAIC's Marathi answer, never the English label; English is unchanged", () => {
  const ACTION = {
    mr: "आता विका, साठवण करता येत नसेल तर (हे आम्ही विचारले नाही)",
    en: "Sell now, unless you can store (we did not ask)",
  };
  const storage = (extra = {}, lang = "mr") => ({
    storage: [
      {
        recommendation_detail: "Sell now (no storage available)",
        summary: { action: { code: "SELL_NOW", text: ACTION[lang] } },
        average_case: { value: 1000 },
        ...extra,
      },
    ],
  });

  // Marathi: AIAIC's Marathi answer, without the "we did not ask" bracket
  render(inLanguage("mr", <SimulationPanel data={storage()} districtName="जिल्हा" />));
  expect(screen.getByText("आता विका, साठवण करता येत नसेल तर")).toBeTruthy();
  expect(document.body.textContent).not.toMatch(/sell now/i);
  cleanup();

  // Marathi with a sample calculation: the sample's own words come from AIAIC's summary (`illustrative_scenario`);
  // whatever it shows, never the engine's English label
  for (const recommendation of ["SELL_NOW", "STORE"]) {
    render(inLanguage("mr", <SimulationPanel data={storage({ supporting_evidence: { illustrative_storage_scenario: { recommendation } } })} />));
    expect(document.querySelector(".card-sentence")?.textContent || "").not.toMatch(/sell now|store/i);
    cleanup();
  }

  // English: the summary's English action, without the "we did not ask" bracket (Hemanth's version reads the summary
  // in English too; before, this line showed the engine's label "sell now (no storage available)")
  render(inLanguage("en", <SimulationPanel data={storage({}, "en")} districtName="District" />));
  expect(screen.getByText("sell now, unless you can store")).toBeTruthy();
  expect(document.body.textContent).not.toContain("आता विका");
});
