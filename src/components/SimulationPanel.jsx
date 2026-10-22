import { fixedBandOf } from "../data_adapter/aiaicApi";
import Warning from "./Warning";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatNumber } from "../i18n/format";
import { isNotAskedWarning, removeNotAskedReason, removeWeDidNotAsk } from "../config/backendTextCleanup";

const BAND_TEXT = { plus_minus_2_pct: "±2%", plus_minus_1_5_pct: "±1.5%" };

// `districtName` is the district as the dropdown shows it (in the chosen language).
export default function SimulationPanel({ data, districtName }) {
  const { locale } = useLanguage();
  const t = useT();
  const storage = data?.storage?.[0];

  // Nothing came back for this crop: say so (the backend's reason when it gives one), instead of hiding the panel
  if (!storage) {
    return (
      <div className="card">
        <h3 className="card-title">{t("storage.title")}</h3>
        <p className="card-text">{data?.na_reasons?.storage?.text || t("storage.noData")}</p>
      </div>
    );
  }

  const sim = storage?.supporting_evidence?.illustrative_storage_scenario;
  // Use the example when there is one. Otherwise use the storage service's own answer.
  const scenario = sim || storage;

  const referenceMandi =
    storage?.supporting_evidence?.representative_mandi ||
    storage?.subject?.reference_mandi ||
    t("storage.referenceMarket");
  const requestedRegion = districtName || storage?.subject?.region || t("storage.yourDistrict");

  // 3800 -> "₹3,800"
  const money = (v) => {
    const n = formatNumber(v, locale, { maximumFractionDigits: 0 });
    return n ? `₹${n}` : t("storage.na");
  };

  // The answer, without the backend's "we did not ask" wording (temporary, see src/config/backendTextCleanup.js)
  const headline = sim
    ? (sim.recommendation || "").replace(/_/g, " ").toLowerCase()
    : (removeWeDidNotAsk(storage.recommendation_detail) || "").toLowerCase();

  // The backend's own most important warnings, shown as written, except the one that says the farmer was not asked
  // whether they can store, and the "because you were not asked" reason (temporary, see src/config/backendTextCleanup.js)
  const warnings = (storage.read_these_first || []).filter((w) => !isNotAskedWarning(w)).map(removeNotAskedReason);

  // When AIAIC has no measured spread, its engine fills best/average/worst with a FIXED band around one price.
  // That is not "a better day / a weaker day", so only the price itself is shown (review 2026-10-02).
  const band = sim ? null : fixedBandOf(storage.summary);

  return (
    <div className="card">
      <h3 className="card-title">{t("storage.title")}</h3>
      <p className="card-small">{sim ? t("storage.sample") : t("storage.guideOnly")}</p>

      {storage.abstained ? (
        <Warning text={t("storage.abstained")} />
      ) : (
        <>
          <p className="card-sentence">
            {sim ? t("storage.inSample") : t("storage.whatToDo")}
            <strong>{headline}</strong>
          </p>

          {band ? (
            <>
              <p className="card-small">{t("storage.latestPrice")}</p>
              <p className="card-number">{money(scenario.average_case?.value)}</p>
              <p className="card-small">{t("storage.fixedBand", { band: BAND_TEXT[band] || t("storage.band") })}</p>
            </>
          ) : (
            <>
              <p className="card-small">{t("storage.expected")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <div>
                  <p className="card-small">{t("storage.betterDay")}</p>
                  <p className="card-number">{money(scenario.best_case?.value)}</p>
                </div>
                <div>
                  <p className="card-small">{t("storage.typicalDay")}</p>
                  <p className="card-number">{money(scenario.average_case?.value)}</p>
                </div>
                <div>
                  <p className="card-small">{t("storage.weakerDay")}</p>
                  <p className="card-number">{money(scenario.worst_case?.value)}</p>
                </div>
              </div>
            </>
          )}

          <p className="card-small">{t("storage.priceFrom", { mandi: referenceMandi, district: requestedRegion })}</p>
        </>
      )}

      {sim?.note && <p className="card-text">{sim.note}</p>}

      {warnings.map((w, i) => (
        <Warning key={i} text={w} />
      ))}
    </div>
  );
}
