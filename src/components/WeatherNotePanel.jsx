// The weather card. With a forecast that has days: the district's 7-day forecast, the backend's summary as sent, each
// day's name and date built here from its `date`, and its kind ("dry", "some_chance", "rain_likely") translated from
// the backend's code (the backend's own words are shown for a code the string files do not know). Days before today
// are left out; when none is left, the card says the forecast is out of date, with the day it was read. The crop's own
// weather answer (`data.weather`) is shown as the backend sends it, never translated here, with or without a forecast.
// With neither, the backend's own reason for having no weather answer (e.g. "kharif only").
import EnglishOnly from "./EnglishOnly";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatDate as fmtDate, formatNumber, formatWeekday } from "../i18n/format";
import { todayIso } from "../data/warehousesNear";
import { actionText, isEnglish } from "../i18n/backendText";

// `today` ("YYYY-MM-DD") is the viewer's own date; the tests pass a fixed one
export default function WeatherNotePanel({ data, forecast, today = todayIso() }) {
  const { lang, locale } = useLanguage();
  const t = useT();
  const text = (v) => (typeof v === "string" ? v : ""); // a field that is not text is read as none

  // The crop's weather answer: the summary's text in the chosen language as sent; on the English page the engine's
  // own line when the summary has none. A line the backend has only in English goes behind one tap elsewhere.
  const answerItem = Array.isArray(data?.weather) ? data.weather.find((w) => w && typeof w === "object") : null;
  const answer = answerItem ? text(actionText(answerItem, lang)) : "";
  const answerEnglishOnly =
    answerItem && !answer && !isEnglish(lang) && text(answerItem.recommendation_detail) ? [answerItem.recommendation_detail] : null;
  const answerBlock = (answer || answerEnglishOnly) && (
    <>
      <p className="card-small">{t("weather.forCrop")}</p>
      {answer && <p className="card-text">{answer}</p>}
      <EnglishOnly lines={answerEnglishOnly} />
    </>
  );
  // only days that can be named (a date or a label); anything else in the list is left out
  const named = Array.isArray(forecast?.days) ? forecast.days.filter((d) => text(d?.date) || text(d?.label)) : [];
  // a day with a date before today is past; a day with only a label cannot be dated and stays
  const days = named.filter((d) => !text(d.date) || d.date.slice(0, 10) >= today);
  // "2026-10-21T21:22:35+00:00" -> "22 Oct 2026" (in the viewer's own time zone and language)
  const formatDate = (value) => fmtDate(value, locale);

  if (named.length > 0 && days.length === 0) {
    const readOn = formatDate(forecast.source?.read_at);
    return (
      <div className="card">
        <h3 className="card-title">{t("weather.title")}</h3>
        <p className="warning">{readOn ? t("weather.outOfDate", { date: readOn }) : t("weather.outOfDateNoDate")}</p>
        {answerBlock}
      </div>
    );
  }

  if (days.length > 0) {
    const num = (v, options) => formatNumber(v, locale, options);
    // "dry" -> "Dry" / "सूखा" / "कोरडे"; an unknown code -> the backend's own text
    const kindWord = (day) => (text(day.kind) ? t(`weather.kind.${day.kind}`, {}, text(day.kind_text)) : text(day.kind_text));

    const headline = text(forecast.summary?.action?.text);
    const sourceName = text(forecast.source?.name);
    const readOn = formatDate(forecast.source?.read_at);

    return (
      <div className="card">
        <h3 className="card-title">{t("weather.title")}</h3>
        {headline && <p className="card-sentence">{headline}</p>}
        {answerBlock}
        <ul className="forecast-list">
          {days.map((day, i) => (
            <li key={day.date || i} className="forecast-day">
              <span className="forecast-date">{formatWeekday(day.date, locale) || text(day.label)}</span>
              {kindWord(day) && <span className="forecast-kind">{kindWord(day)}</span>}
              {num(day.t_max) && <span>{t("weather.highest", { temp: num(day.t_max) })}</span>}
              {num(day.rain_chance) && (
                <span>{t("weather.rainChance", { pct: num(day.rain_chance, { maximumFractionDigits: 0 }) })}</span>
              )}
            </li>
          ))}
        </ul>
        {(sourceName || readOn) && (
          <p className="card-small">
            {sourceName ? t("common.whereFrom", { source: sourceName }) : ""}
            {sourceName && readOn ? " · " : ""}
            {readOn ? t("weather.readOn", { date: readOn }) : ""}
          </p>
        )}
      </div>
    );
  }

  // No forecast (the call failed, or it had no days): the crop's weather answer if there is one, else the reason
  const reason = text(data?.na_reasons?.weather?.text);
  if (!answerBlock && (answerItem || !reason)) return null;

  return (
    <div className="card">
      <h3 className="card-title">{t("weather.noAnswerTitle")}</h3>
      {answerBlock || <p className="card-text">{reason}</p>}
    </div>
  );
}
