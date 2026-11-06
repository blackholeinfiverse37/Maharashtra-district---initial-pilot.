// The weather card: the district's 7-day forecast when it has days; otherwise the backend's own reason for having no
// weather answer, or nothing. Made-up forecasts only, seen on a fixed day (1 Nov 2026).
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import WeatherNotePanel from "../components/WeatherNotePanel";
import { LanguageContext } from "../i18n/LanguageContext";
import { languageByCode } from "../i18n/languages";

afterEach(cleanup);

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

const forecast = (extra = {}) => ({
  summary: { action: { text: "Dry this week; rain likely on Friday." } },
  days: [
    { date: "2026-11-02", kind: "dry", t_max: 31.4, rain_chance: 5 },
    { date: "2026-11-06", kind: "rain_likely", t_max: 28, rain_chance: 72.6 },
    { date: "2026-11-07", kind: "thunder", kind_text: "Thunder", t_max: null },
    { label: "Later", kind_text: "Cloudy" },
  ],
  source: { name: "Testcast", read_at: "2026-11-01T06:00:00+00:00" },
  ...extra,
});
const rows = (container) => [...container.querySelectorAll(".forecast-day")].map((li) => li.textContent);

test("a forecast with days: the summary, each day's name, kind, highest temperature and rain chance, and the source", () => {
  const { container } = inLanguage("en", <WeatherNotePanel today="2026-11-01" forecast={forecast()} />);
  expect(screen.getByText("What will the weather be this week?")).toBeTruthy();
  expect(screen.getByText("Dry this week; rain likely on Friday.")).toBeTruthy();
  const r = rows(container);
  expect(r).toHaveLength(4);
  expect(r[0]).toContain("Dry");
  expect(r[0]).toContain("Highest 31.4°C");
  expect(r[0]).toContain("Rain chance 5%");
  expect(r[1]).toContain("Rain likely");
  expect(r[1]).toContain("Rain chance 73%"); // whole percent
  expect(r[2]).toContain("Thunder"); // a code the strings do not know: the backend's own words
  expect(r[2]).not.toContain("Highest"); // no temperature, no line
  expect(r[3]).toContain("Later"); // no date: the backend's label
  expect(r[3]).toContain("Cloudy"); // no code: the backend's own words
  expect(screen.getByText("Where this comes from: Testcast · Forecast read on 1 Nov 2026")).toBeTruthy();
});

test("the kinds and labels are in the chosen language", () => {
  const { container } = inLanguage("mr", <WeatherNotePanel today="2026-11-01" forecast={forecast()} />);
  expect(rows(container)[0]).not.toContain("Dry");
  expect(rows(container)[0]).toContain("31.4");
  expect(container.textContent).not.toContain("What will the weather");
});

test("the source line shows only what the forecast gives", () => {
  inLanguage("en", <WeatherNotePanel today="2026-11-01" forecast={forecast({ source: { name: "Testcast" } })} />);
  expect(screen.getByText("Where this comes from: Testcast")).toBeTruthy();
  cleanup();
  inLanguage("en", <WeatherNotePanel today="2026-11-01" forecast={forecast({ source: { read_at: "2026-11-01T06:00:00+00:00" } })} />);
  expect(screen.getByText("Forecast read on 1 Nov 2026")).toBeTruthy();
  cleanup();
  const { container } = inLanguage("en", <WeatherNotePanel today="2026-11-01" forecast={forecast({ source: null, summary: null })} />);
  expect(container.querySelector(".card-small")).toBeNull();
  expect(container.querySelector(".card-sentence")).toBeNull();
});

test("no forecast days and no weather answer: the backend's own reason", () => {
  const data = { weather: [], na_reasons: { weather: { text: "Weather advice covers only the kharif sowing window." } } };
  inLanguage("en", <WeatherNotePanel data={data} forecast={{ days: [] }} />);
  expect(screen.getByText("What about the weather?")).toBeTruthy();
  expect(screen.getByText("Weather advice covers only the kharif sowing window.")).toBeTruthy();
});

test("no forecast days: nothing when there is no reason, or when the weather service did answer", () => {
  expect(inLanguage("en", <WeatherNotePanel data={{ na_reasons: {} }} forecast={null} />).container.innerHTML).toBe("");
  cleanup();
  const answered = { weather: [{ recommendation: "SOW" }], na_reasons: { weather: { text: "A reason" } } };
  expect(inLanguage("en", <WeatherNotePanel data={answered} />).container.innerHTML).toBe("");
  cleanup();
  expect(inLanguage("en", <WeatherNotePanel today="2026-11-01" forecast={{ days: "not a list" }} />).container.innerHTML).toBe("");
});
