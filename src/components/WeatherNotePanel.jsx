// The weather card. With a forecast that has days: the district's 7-day forecast, the backend's summary as sent, each
// day's name and date built here from its `date`, and its kind ("dry", "some_chance", "rain_likely") translated from
// the backend's code (the backend's own words are shown for a code the string files do not know). Otherwise, when the
// weather service gave no answer, the backend's own reason (e.g. "kharif only").
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatDate as fmtDate, formatNumber, formatWeekday } from "../i18n/format";

export default function WeatherNotePanel({ data, forecast }) {
  const { locale } = useLanguage();
  const t = useT();
  const text = (v) => (typeof v === "string" ? v : ""); // a field that is not text is read as none
  // only days that can be named (a date or a label); anything else in the list is left out
  const days = Array.isArray(forecast?.days) ? forecast.days.filter((d) => text(d?.date) || text(d?.label)) : [];

  if (days.length > 0) {
    // "2026-10-21T21:22:35+00:00" -> "22 Oct 2026" (in the viewer's own time zone and language)
    const formatDate = (value) => fmtDate(value, locale);
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

  const reason = text(data?.na_reasons?.weather?.text);
  if ((Array.isArray(data?.weather) && data.weather.length > 0) || !reason) return null;

  return (
    <div className="card">
      <h3 className="card-title">{t("weather.noAnswerTitle")}</h3>
      <p className="card-text">{reason}</p>
    </div>
  );
}
