// The storage card: when the backend warns that its prices are a statewide median mandi's, not the district's, the long
// warning is not shown; one short line says the same. Made-up mandis and districts only.
import { afterEach, expect, test } from "vitest";
import { cleanup, render } from "@testing-library/react";
import SimulationPanel from "../components/SimulationPanel";
import { LanguageContext } from "../i18n/LanguageContext";
import { languageByCode } from "../i18n/languages";

afterEach(cleanup);

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

const LONG_EN = "PRICE IS NOT HOMELAND'S: the rupee figures on this card are APMC Middle (Midland district) — the median mandi for grain statewide — because that is the representative price. They are NOT Homeland prices.";
const LONG_MR = "हा भाव Homeland चा नाही: या कार्डवरील रुपयांचे आकडे APMC Middle (Midland जिल्हा) चे आहेत — राज्यभरात मधला भाव देणारी बाजार समिती.";
const OTHER_EN = "THE BEST AND WORST CASES ON THIS CARD ARE NOT AN ESTIMATE OF RISK. Test.";

const storage = (warned) => ({
  storage: [
    {
      recommendation: "SELL_NOW",
      read_these_first: warned ? [LONG_EN, OTHER_EN] : [OTHER_EN],
      subject: { region: "Homeland", reference_mandi: "APMC Middle" },
      supporting_evidence: { representative_mandi: "APMC Middle", representative_mandi_district: "Midland" },
      average_case: { value: 2500 },
      best_case: { value: 2550 },
      worst_case: { value: 2450 },
      summary: {
        action: { text: "विका" },
        sections: [
          {
            id: "caveats",
            items: [
              ...(warned ? [{ priority: true, lang: "mr", text: LONG_MR }] : []),
              { priority: true, lang: "mr", text: "दुसरी सूचना." },
            ],
          },
        ],
      },
    },
  ],
});

test("English: the long warning is replaced by one short line; other warnings stay", () => {
  const { container } = render(inLanguage("en", <SimulationPanel data={storage(true)} districtName="Homeland" />));
  const text = container.textContent;
  expect(text).not.toContain("PRICE IS NOT");
  expect(text).toContain(
    "This price is from APMC Middle (Midland district), the median mandi for this crop statewide, not exactly from your district."
  );
  expect(text).not.toContain("The price used here comes from"); // not said twice
  expect(text).toContain("THE BEST AND WORST CASES");
});

test("Marathi: the same, with the district name as the dropdown shows it", () => {
  const { container } = render(
    inLanguage("mr", <SimulationPanel data={storage(true)} districtName="Homeland" districtNames={{ Midland: "मिडलँड" }} />)
  );
  const text = container.textContent;
  expect(text).not.toContain("हा भाव Homeland चा नाही");
  expect(text).toContain("हा भाव APMC Middle (मिडलँड जिल्हा) चा आहे");
  expect(text).toContain("दुसरी सूचना.");
});

test("no such warning from the backend: the usual small line, no short warning", () => {
  const { container } = render(inLanguage("en", <SimulationPanel data={storage(false)} districtName="Homeland" />));
  expect(container.textContent).toContain("The price used here comes from APMC Middle, not from Homeland.");
  expect(container.textContent).not.toContain("median mandi");
});
