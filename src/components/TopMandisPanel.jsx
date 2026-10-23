import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatDate, formatNumber } from "../i18n/format";

// "Which mandis pay the most?": the market answer's mandis, highest price first, at most 5, each with its place,
// price, the date that price was seen and its distance. All rows come from the backend's market item:
//   - summary.price_compare.rows (already in the chosen language), when they hold every mandi the answer compared;
//   - otherwise supporting_evidence.options, sorted by gross_price.
// Distances are the backend's straight lines between district centres (0 within the district), shown as "about X km".
// `districtNames` maps an English district name to the name to show (the same names as the dropdown).

const TOP = 5;

const fromRows = (rows) =>
  rows.map((r) => ({
    mandi: r.mandi,
    place: r.place,
    price: r.price,
    day: r.day,
    km: r.km,
    local: r.own_district === true,
    chosen: r.role === "chosen",
  }));

const fromOptions = (options, chosenName, districtNames) =>
  options.map((o) => ({
    mandi: o.mandi,
    place: (o.district && districtNames?.[o.district]) || o.district,
    price: o.gross_price,
    day: o.price_day,
    km: o.km,
    local: o.is_local === true,
    chosen: !!chosenName && o.mandi === chosenName,
  }));

export default function TopMandisPanel({ data, districtNames }) {
  const { locale } = useLanguage();
  const t = useT();
  const market = data?.market?.[0];

  const rows = market?.summary?.price_compare?.rows;
  const options = market?.supporting_evidence?.options;
  const safeRows = Array.isArray(rows) ? rows.filter((r) => r?.mandi) : [];
  const safeOptions = Array.isArray(options) ? options.filter((o) => o?.mandi) : [];
  const chosenName = safeRows.find((r) => r.role === "chosen")?.mandi;

  // The rows are used only when they hold every mandi the answer compared
  const rowsHoldAll = safeRows.length > 0 && safeOptions.every((o) => safeRows.some((r) => r.mandi === o.mandi));
  const list = (rowsHoldAll ? fromRows(safeRows) : fromOptions(safeOptions, chosenName, districtNames))
    .filter((m) => typeof m.price === "number" && isFinite(m.price))
    .sort((a, b) => b.price - a.price)
    .slice(0, TOP);

  // No mandi at all: the backend's own reason (never invented rows)
  const naReason = market?.summary?.na_reason;
  const reason =
    data?.na_reasons?.market?.text || (typeof naReason === "string" ? naReason : naReason?.text) || t("price.noData");

  return (
    <div className="card">
      <h3 className="card-title">{t("top5.title")}</h3>
      {list.length === 0 ? (
        <p className="card-text">{reason}</p>
      ) : (
        <>
          <ol className="mandi-list">
            {list.map((m, i) => {
              const price = formatNumber(m.price, locale, { maximumFractionDigits: 0 });
              const date = formatDate(m.day, locale);
              const km = formatNumber(m.km, locale, { maximumFractionDigits: 0 });
              const distance = m.local ? t("top5.inYourDistrict") : km ? t("top5.aboutKm", { km }) : null;
              return (
                <li key={`${m.mandi}-${i}`} className={`mandi-row ${m.chosen ? "mandi-chosen" : ""}`}>
                  <p className="mandi-name">
                    {m.mandi}
                    {m.chosen && <span className="mandi-tag">{t("top5.recommended")}</span>}
                  </p>
                  {price && <p className="card-text">{t("common.pricePerQuintal", { price })}</p>}
                  <p className="card-small">
                    {[m.place ? t("top5.place", { district: m.place }) : null, date ? t("top5.priceOn", { date }) : null, distance]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
