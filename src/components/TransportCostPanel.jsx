import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatNumber } from "../i18n/format";

// "Transport cost": the mandis in other districts that pay more than the backend's comparison mandi
// (`supporting_evidence.breakeven_baseline`: the best mandi in the district, or the nearest one when the district has
// none), each with how much more it pays per quintal and the most moving one quintal may cost per km for the trip to
// pay off (`supporting_evidence.breakeven`, in the backend's order). The backend sends no transport cost itself, and its
// English `text` is not shown: the sentences are the dashboard's own, only the numbers and names come from the backend.
// `districtNames` maps an English district name to the name to show (the same names as the dropdown).
// With no such mandi the card is hidden.

export default function TransportCostPanel({ data, districtNames }) {
  const { locale } = useLanguage();
  const t = useT();
  const evidence = data?.market?.[0]?.supporting_evidence || {};
  const baseline = evidence.breakeven_baseline;
  const options = Array.isArray(evidence.options) ? evidence.options : [];

  const trips = (Array.isArray(evidence.breakeven) ? evidence.breakeven : [])
    .map((b) => ({
      mandi: b?.mandi,
      adv: formatNumber(b?.price_advantage_per_q, locale, { maximumFractionDigits: 0 }),
      rate: formatNumber(b?.break_even_rs_per_q_per_km, locale, { maximumFractionDigits: 2 }),
      km: formatNumber(b?.km, locale, { maximumFractionDigits: 0 }),
      district: options.find((o) => o?.mandi === b?.mandi)?.district,
    }))
    .filter((b) => b.mandi && b.adv && b.rate);

  if (!baseline?.mandi || trips.length === 0) return null;

  const baseKm = formatNumber(baseline.km, locale, { maximumFractionDigits: 0 });
  const intro =
    baseline.code === "nearest"
      ? t("trip.introNearest", { base: baseline.mandi, km: baseKm || "" })
      : t("trip.introOwn", { base: baseline.mandi });

  return (
    <div className="card">
      <h3 className="card-title">{t("trip.title")}</h3>
      <p className="card-text">{intro}</p>
      <ol className="mandi-list">
        {trips.map((b, i) => (
          <li key={`${b.mandi}-${i}`} className="mandi-row">
            <p className="mandi-name">{b.mandi}</p>
            <p className="card-text">{t("trip.paysMore", { adv: b.adv })}</p>
            <p className="card-text">{t("trip.worthIf", { rate: b.rate })}</p>
            <p className="card-small">
              {[
                b.district ? t("trip.district", { district: districtNames?.[b.district] || b.district }) : null,
                b.km ? t("trip.aboutKm", { km: b.km }) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </li>
        ))}
      </ol>
      <p className="card-small">{t("trip.note")}</p>
    </div>
  );
}
