// One failing card shows a short message in the chosen language; the cards around it keep working, and a new answer
// gives the card another try. Also the case found by feeding the cards bad backend fields, now fixed: it no longer
// needs the safety net.
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CardBoundary from "../components/CardBoundary";
import AtAGlancePanel from "../components/AtAGlancePanel";
import { LanguageContext } from "../i18n/LanguageContext";
import { languageByCode } from "../i18n/languages";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const provider = (code, element) => {
  const l = languageByCode(code);
  return (
    <LanguageContext.Provider
      value={{ lang: code, apiLang: code, locale: l.locale, dir: l.dir, showsEnglishNote: false, selectable: [l], setLanguage() {} }}
    >
      {element}
    </LanguageContext.Provider>
  );
};
function Broken({ fail }) {
  if (fail) throw new Error("test failure");
  return <p>Working again</p>;
}
const page = (code, fail, resetKey = 1) =>
  provider(
    code,
    <>
      <CardBoundary resetKey={resetKey}>
        <p>Card before</p>
      </CardBoundary>
      <CardBoundary resetKey={resetKey}>
        <Broken fail={fail} />
      </CardBoundary>
      <CardBoundary resetKey={resetKey}>
        <p>Card after</p>
      </CardBoundary>
    </>
  );

test("one failing card: a short message in its place; the other cards still show", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(page("en", true));
  expect(screen.getByText("This part could not be shown. The rest of the page still works.")).toBeTruthy();
  expect(screen.getByText("Card before")).toBeTruthy();
  expect(screen.getByText("Card after")).toBeTruthy();
});

test("the message is in Hindi and Marathi too", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(page("hi", true));
  expect(screen.getByRole("status").textContent).toBe("यह हिस्सा नहीं दिखाया जा सका। पेज का बाकी हिस्सा ठीक से काम कर रहा है।");
  cleanup();
  render(page("mr", true));
  expect(screen.getByRole("status").textContent).toBe("हा भाग दाखवता आला नाही. पानाचा उरलेला भाग नीट काम करत आहे.");
});

test("a new answer gives the failed card another try", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const { rerender } = render(page("en", true, 1));
  expect(screen.queryByText("Working again")).toBeNull();
  rerender(page("en", false, 1)); // same answer: the message stays
  expect(screen.queryByText("Working again")).toBeNull();
  rerender(page("en", false, 2)); // a new answer: the card is drawn again
  expect(screen.getByText("Working again")).toBeTruthy();
});

test("the case found earlier (freshness that is not text) now draws normally: no message", () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const data = {
    market: [
      {
        recommendation: "SELL_AT_MANDI",
        sources_used: [{ observed_at: "2026-11-01", real_world_freshness: true }],
        summary: { action: { text: "Sell at APMC Test" } },
      },
    ],
    na_reasons: {},
  };
  render(
    provider(
      "en",
      <>
        <CardBoundary resetKey={data}>
          <AtAGlancePanel data={data} />
        </CardBoundary>
        <CardBoundary resetKey={data}>
          <p>Card after</p>
        </CardBoundary>
      </>
    )
  );
  expect(screen.getByText("Sell at APMC Test")).toBeTruthy();
  expect(screen.getByText("Card after")).toBeTruthy();
  expect(screen.queryByText("This part could not be shown. The rest of the page still works.")).toBeNull();
  expect(errors).not.toHaveBeenCalled();
});
