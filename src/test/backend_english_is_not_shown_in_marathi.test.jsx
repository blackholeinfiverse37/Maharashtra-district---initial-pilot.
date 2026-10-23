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
  render(inLanguage("mr", <DataDisplayPanel data={view} crop="पीक" districtName="जिल्हा" card="price" />));
  expect(screen.getAllByText(MARATHI_ACTION).length).toBe(2);
  expect(document.body.textContent).not.toContain("Sell at");
  cleanup();

  render(inLanguage("en", <AtAGlancePanel data={view} />));
  expect(screen.getByText(ENGINE_LABEL)).toBeTruthy();
  render(inLanguage("en", <DataDisplayPanel data={view} crop="Crop" districtName="District" card="price" />));
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
  const storage = (extra = {}) => ({
    storage: [
      {
        recommendation_detail: "Sell now (no storage available)",
        summary: { action: { code: "SELL_NOW", text: "आता विका, साठवण करता येत नसेल तर (हे आम्ही विचारले नाही)" } },
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

  // Marathi with a sample calculation of the same answer: the same Marathi text; of a different answer: no headline
  render(inLanguage("mr", <SimulationPanel data={storage({ supporting_evidence: { illustrative_storage_scenario: { recommendation: "SELL_NOW" } } })} />));
  expect(screen.getByText("आता विका, साठवण करता येत नसेल तर")).toBeTruthy();
  cleanup();
  const other = render(inLanguage("mr", <SimulationPanel data={storage({ supporting_evidence: { illustrative_storage_scenario: { recommendation: "STORE" } } })} />));
  expect(other.container.querySelector(".card-sentence")).toBeNull(); // no headline line at all
  expect(document.body.textContent).not.toMatch(/store|sell now/i);
  cleanup();

  // English: exactly as before
  render(inLanguage("en", <SimulationPanel data={storage()} districtName="District" />));
  expect(screen.getByText("sell now (no storage available)")).toBeTruthy();
  expect(document.body.textContent).not.toContain("आता विका");
});
