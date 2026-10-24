// The Transport cost card: mandis in other districts that pay more than the backend's comparison mandi, how much more,
// and the most moving one quintal may cost per km for the trip to pay off. These figures stay out of the Top 5 card.
// Made-up mandis only.
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import TransportCostPanel from "../components/TransportCostPanel";
import TopMandisPanel from "../components/TopMandisPanel";
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

const market = (evidence) => ({
  market: [
    {
      supporting_evidence: {
        options: [
          { mandi: "APMC Far", district: "Farland", gross_price: 9700, price_day: "2026-10-23", km: 58.3, is_local: false },
          { mandi: "APMC Near", district: "Nearland", gross_price: 9000, price_day: "2026-10-23", km: 58.3, is_local: false },
        ],
        ...evidence,
      },
      summary: { price_compare: { rows: [{ mandi: "APMC Far", role: "chosen" }] } },
    },
  ],
});
const trip = { mandi: "APMC Far", price_advantage_per_q: 700, km: 58.3, break_even_rs_per_q_per_km: 12.003, text: "English only" };

test("no mandi in the district: compared with the nearest mandi, in the chosen language", () => {
  const data = market({ breakeven: [trip], breakeven_baseline: { code: "nearest", mandi: "APMC Near", km: 58.3 } });
  render(inLanguage("en", <TransportCostPanel data={data} districtNames={{ Farland: "Farland (shown)" }} />));
  expect(screen.getByText("Transport for mandis that pay more than your mandi")).toBeTruthy();
  expect(screen.getByText(/pay more than the nearest one, APMC Near \(about 58 km away\)/)).toBeTruthy();
  expect(screen.getByText("Pays ₹700 more per quintal")).toBeTruthy();
  expect(screen.getByText("Worth going only if moving 1 quintal costs you less than ₹12 for every km.")).toBeTruthy();
  expect(screen.getByText("Farland (shown) district · about 58 km away")).toBeTruthy();
  expect(screen.getByText(/Distances are straight lines/)).toBeTruthy();
  expect(document.body.textContent).not.toContain("extra money is lost");
  expect(document.body.textContent).not.toContain("English only"); // the backend's English sentence is not used
  cleanup();

  render(inLanguage("mr", <TransportCostPanel data={data} />));
  expect(document.body.textContent).toContain("सर्वात जवळच्या APMC Near (सुमारे 58 किमी दूर) पेक्षा जास्त भाव देतात.");
  expect(document.body.textContent).toContain("प्रति क्विंटल ₹700 जास्त भाव");
  expect(document.body.textContent).toContain("प्रत्येक किमीला ₹12 पेक्षा कमी");
});

test("compared with the district's best mandi; small rates keep their decimals", () => {
  const data = market({
    breakeven: [{ ...trip, price_advantage_per_q: 35, break_even_rs_per_q_per_km: 0.33 }],
    breakeven_baseline: { code: "own_district", mandi: "APMC Home", km: 0 },
  });
  render(inLanguage("en", <TransportCostPanel data={data} />));
  expect(document.body.textContent).toContain("pay more than APMC Home, the best-paying mandi in your district.");
  expect(document.body.textContent).toContain("less than ₹0.33 for every km");
});

test("no mandi pays more: the card is hidden", () => {
  const { container } = render(
    inLanguage("en", <TransportCostPanel data={market({ breakeven: [], breakeven_baseline: { code: "own_district", mandi: "APMC Home", km: 0 } })} />)
  );
  expect(container.innerHTML).toBe("");
});

test("the Top 5 card shows no transport figures", () => {
  const data = market({ breakeven: [trip], breakeven_baseline: { code: "nearest", mandi: "APMC Near", km: 58.3 } });
  render(inLanguage("en", <TopMandisPanel data={data} />));
  expect(screen.getByText("Which mandis pay the most?")).toBeTruthy();
  expect(screen.queryByText(/more per quintal|for every km|straight lines/)).toBeNull();
});
