import { fixedBandOf } from "../data_adapter/aiaicApi";
import Warning from "./Warning";
import EnglishOnly from "./EnglishOnly";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatNumber } from "../i18n/format";
import { actionText, isEnglish, mustRead, scenarioWords } from "../i18n/backendText";
import {
  isNotAskedWarning,
  isPriceNotDistrictWarning,
  removeNotAskedReason,
  removeWeDidNotAsk,
} from "../config/backendTextCleanup";

const BAND_TEXT = { plus_minus_2_pct: "±2%", plus_minus_1_5_pct: "±1.5%" };

// `districtName` is the district as the dropdown shows it (in the chosen language).
// `districtNames` maps an English district name to the name to show (the same names as the dropdown).
export default function SimulationPanel({ data, districtName, districtNames }) {
  const { lang, apiLang, locale } = useLanguage();
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

  // The answer in the chosen language: the summary's action, the same line as "At a glance", without the backend's
  // "we did not ask" wording (temporary, see src/config/backendTextCleanup.js). For the sample, the sample's own words
  // (in Marathi and Hindi from the summary's `illustrative_scenario`). See src/i18n/backendText.js.
  const sample = sim ? scenarioWords(storage, sim, lang, apiLang) : null;
  const headline = sim ? sample.headline : (removeWeDidNotAsk(actionText(storage, lang)) || "").toLowerCase();

  // The backend's own most important warnings, in the chosen language, except the one that says the farmer was not
  // asked whether they can store, and the "because you were not asked" reason (temporary, see
  // src/config/backendTextCleanup.js). A warning AIAIC has only in English is counted apart, never dropped.
  const must = mustRead(storage, lang, apiLang);
  const tidy = (list) =>
    list.filter((w) => !isNotAskedWarning(w) && !isPriceNotDistrictWarning(w)).map(removeNotAskedReason);
  const warnings = tidy(must.shown);
  const warningsInEnglish = tidy(must.englishOnly);

  // When the backend warns that the prices are a statewide median mandi's, not the district's, one short line says so
  // instead of its long warning (temporary, see src/config/backendTextCleanup.js)
  const priceNotDistrict = [...(storage.read_these_first || []), ...must.shown, ...must.englishOnly].some(
    isPriceNotDistrictWarning
  );
  // The mandi's district as the dropdown shows it; on a Marathi or Hindi page an English name is left out, not shown
  const mandiDistrictEn = storage?.supporting_evidence?.representative_mandi_district;
  const mandiDistrict =
    (mandiDistrictEn && districtNames?.[mandiDistrictEn]) || (isEnglish(lang) ? mandiDistrictEn : null);
  const medianLine =
    priceNotDistrict && storage?.supporting_evidence?.representative_mandi
      ? mandiDistrict
        ? t("storage.priceFromMedian", { mandi: referenceMandi, district: mandiDistrict })
        : t("storage.priceFromMedianNoPlace", { mandi: referenceMandi })
      : null;

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
          {headline && (
            <p className="card-sentence">
              {sim ? t("storage.inSample") : t("storage.whatToDo")}
              <strong>{headline}</strong>
            </p>
          )}

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

          {medianLine ? (
            <p className="warning">{medianLine}</p>
          ) : (
            <p className="card-small">{t("storage.priceFrom", { mandi: referenceMandi, district: requestedRegion })}</p>
          )}
        </>
      )}

      {sample?.note && <p className="card-text">{sample.note}</p>}
      <EnglishOnly lines={sample?.englishOnly} />

      {warnings.map((w, i) => (
        <Warning key={i} text={w} />
      ))}
      <EnglishOnly lines={warningsInEnglish} />
    </div>
  );
}
