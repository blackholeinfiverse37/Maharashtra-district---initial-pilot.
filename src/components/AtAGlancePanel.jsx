// "At a glance": the three answers in large text for a phone. Every answer is the backend's own words; a row with
// no answer from the backend is hidden.
import { freshnessKey } from "./freshness";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatDate as fmtDate, formatNumber as fmtNumber } from "../i18n/format";
import { removeWeDidNotAsk } from "../config/backendTextCleanup";
import { talukasWorseThanDistrict } from "../config/waterCategories";
import { actionText } from "../i18n/backendText";

export default function AtAGlancePanel({ data }) {
  const { lang, locale } = useLanguage();
  const t = useT();
  // "2026-10-21T00:00:00" -> "21 Oct 2026", in the chosen language
  const formatDate = (value) => fmtDate(value, locale);

  const dateLine = (source) => {
    const date = formatDate(source?.observed_at);
    if (!date) return null;
    const key = freshnessKey(source);
    return `${t("common.dataFrom", { date })}${key ? ` (${t(key)})` : ""}`;
  };

  // A service that abstained gives no answer here: its row is hidden
  const answer = (service) => {
    const item = data?.[service]?.[0];
    return item && !item.abstained ? item : null;
  };
  const market = answer("market");
  const storage = answer("storage");
  const water = answer("water");

  const price = fmtNumber(market?.average_case?.value, locale, { maximumFractionDigits: 0 });

  const rows = [
    {
      id: "sell",
      label: t("glance.whereToSell"),
      // the summary's action, in the chosen language ("Sell at APMC Lasalgaon" / "APMC Lasalgaon येथे विका"), as the
      // storage and water rows below; the engine's English label never on a Marathi or Hindi page
      text: actionText(market, lang),
      price: price ? t("common.pricePerQuintal", { price }) : null,
      date: dateLine(market?.sources_used?.[0]),
    },
    {
      id: "store",
      label: t("glance.sellOrStore"),
      // without the backend's "we did not ask" wording (temporary, see src/config/backendTextCleanup.js)
      text: removeWeDidNotAsk(storage?.summary?.action?.text),
      date: dateLine(storage?.sources_used?.[0]),
    },
    {
      id: "water",
      label: t("glance.water"),
      text: water?.summary?.action?.text,
      // only when some taluka is in a more severe category than the district (or saline): src/config/waterCategories.js
      extra: talukasWorseThanDistrict(
        water?.supporting_evidence?.cgwb_units_2025?.stressed_units,
        water?.supporting_evidence?.groundwater_status
      ).length
        ? t("glance.talukaHint")
        : null,
      date: dateLine(water?.sources_used?.[0]),
    },
  ].filter((r) => typeof r.text === "string" && r.text.trim());

  if (rows.length === 0) return null;

  return (
    <div className="card">
      <h2 className="card-title">{t("glance.title")}</h2>
      <div className="flex flex-col divide-y divide-[var(--color-border)]">
        {rows.map((r) => (
          <div key={r.id} className="glance-row">
            <p className="glance-label">{r.label}</p>
            <p className="card-sentence">{r.text}</p>
            {r.price && <p className="glance-price">{r.price}</p>}
            {r.extra && <p className="card-small">{r.extra}</p>}
            {r.date && <p className="card-small">{r.date}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
