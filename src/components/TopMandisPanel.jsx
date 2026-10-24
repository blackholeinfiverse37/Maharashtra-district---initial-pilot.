import { useState } from "react";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatDate, formatNumber } from "../i18n/format";

// "Which mandis pay the most?": the market answer's mandis, highest price first: the top 5, with up to 5 more behind
// "Show more" (first the other compared mandis, then the mandis the backend holds a price for from another day but did
// not compare: rows with role "other_day" and `also_in_window`, under a line that says so; these never enter the top 5,
// since the answer chose among the compared ones). Each with its place, price, the date that price was seen and its
// distance. All rows come from the backend's market item:
//   - summary.price_compare.rows (already in the chosen language), when they hold every mandi the answer compared;
//   - otherwise supporting_evidence.options, sorted by gross_price.
// Distances are the backend's straight lines between district centres (0 within the district), shown as "about X km".
// `districtNames` maps an English district name to the name to show (the same names as the dropdown).

const TOP = 5; // in the list before "Show more"
const MORE = 5; // how many more the list can show

const fromRows = (rows) =>
  rows.map((r) => ({
    mandi: r.mandi,
    place: r.place,
    price: r.price,
    day: r.day,
    km: r.km,
    local: r.own_district === true,
    chosen: r.role === "chosen",
    other: r.role === "other_day",
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
  const [open, setOpen] = useState(false);
  const market = data?.market?.[0];

  const rows = market?.summary?.price_compare?.rows;
  const options = market?.supporting_evidence?.options;
  const safeRows = Array.isArray(rows) ? rows.filter((r) => r?.mandi) : [];
  const safeOptions = Array.isArray(options) ? options.filter((o) => o?.mandi) : [];
  const chosenName = safeRows.find((r) => r.role === "chosen")?.mandi;

  // The rows are used only when they hold every mandi the answer compared
  const rowsHoldAll = safeRows.length > 0 && safeOptions.every((o) => safeRows.some((r) => r.mandi === o.mandi));
  const hasPrice = (m) => typeof m.price === "number" && isFinite(m.price);
  const byPrice = (a, b) => b.price - a.price;
  const all = (rowsHoldAll ? fromRows(safeRows) : fromOptions(safeOptions, chosenName, districtNames)).filter(hasPrice);
  const list = all.filter((m) => !m.other).sort(byPrice); // the compared mandis
  const alsoInWindow = market?.supporting_evidence?.also_in_window;
  const otherDay = [
    ...all.filter((m) => m.other),
    ...fromOptions(Array.isArray(alsoInWindow) ? alsoInWindow.filter((o) => o?.mandi) : [], null, districtNames)
      .filter((o) => !all.some((m) => m.mandi === o.mandi))
      .map((o) => ({ ...o, other: true })),
  ]
    .filter(hasPrice)
    .sort(byPrice);
  const more = [...list.slice(TOP), ...otherDay].slice(0, MORE);
  const moreCompared = more.filter((m) => !m.other);
  const moreOther = more.filter((m) => m.other);

  const row = (m, i) => {
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
  };

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
            {list.slice(0, TOP).map((m, i) => row(m, i))}
          </ol>
          {open && moreCompared.length > 0 && (
            <ol className="mandi-list">{moreCompared.map((m, i) => row(m, i))}</ol>
          )}
          {open && moreOther.length > 0 && (
            <>
              <p className="card-small mandi-other-note">{t("top5.otherDayNote")}</p>
              <ol className="mandi-list">{moreOther.map((m, i) => row(m, i))}</ol>
            </>
          )}
          {more.length > 0 && (
            <button type="button" className="link-button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              {open ? t("top5.showLess") : t("top5.showMore")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
