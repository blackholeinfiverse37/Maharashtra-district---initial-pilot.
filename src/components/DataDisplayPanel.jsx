import Warning from "./Warning";
import EnglishOnly from "./EnglishOnly";
import { freshnessStatus, freshnessKey } from "./freshness";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatDate as fmtDate, formatNumber as fmtNumber } from "../i18n/format";
import { talukasWorseThanDistrict } from "../config/waterCategories";
import { chosenMandi, desCrops, isEnglish, sourceName } from "../i18n/backendText";

// One of three cards ("harvest", "price" or "water"), chosen by `card`, so the page can give each its own row.
// `crop` and `districtName` are the names to SHOW (in the chosen language, as the dropdowns show them); `cropKey` is the
// crop's key and `cropEn` its English name, used only to find the crop in the backend's English-only government data.
export default function DataDisplayPanel({ data, crop, cropEn, cropKey, districtName, card }) {
  const { lang, apiLang, locale } = useLanguage();
  const t = useT();
  if (!data) return null;
  const english = isEnglish(lang);

  // Dates and numbers in the chosen language's format: "25 Sep 2026", "1,600"
  const formatDate = (value) => fmtDate(value, locale);
  const formatNumber = (n, options) => fmtNumber(n, locale, options);

  // " (Up to date)", " (Getting old)", " (Old)", or nothing when the age is not known
  const freshnessLabel = (source) => (freshnessKey(source) ? ` (${t(freshnessKey(source))})` : "");
  const isStale = (source) => freshnessStatus(source) === "stale";

  // ---- Yield ----
  const cropService = data.crop?.[0];
  const apy = cropService?.supporting_evidence?.district_crop_apy;
  const allCrops = apy?.crops || [];
  // The chosen crop's row found by AIAIC's crop keys (the list's "Tur (arhar)" is DES's "Tur"), and DES's crop names
  // and coverage note in the chosen language, from the crop answer's summary (src/i18n/backendText.js)
  const des = desCrops(cropService, { lang, apiLang, cropKey, cropEn, crop });
  const matchingCropRow = allCrops.find((c) => des.isChosen(c));
  const yieldKgHa = matchingCropRow?.yield_kg_ha;
  const yieldTHa = yieldKgHa
    ? formatNumber(yieldKgHa / 1000, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;
  const yieldPeriod = apy?.year || null;
  // The crops this government data holds for the district, each once, in the backend's order
  const cropsInData = [...new Set(allCrops.map((c) => c.crop).filter(Boolean))].map(des.name);

  // ---- Market ----
  const marketService = data.market?.[0];
  const mandiPrice = formatNumber(marketService?.average_case?.value);
  // The mandi the answer chose, by name only (never the engine's English sentence)
  const marketMandi = chosenMandi(marketService);
  const marketSource = marketService?.sources_used?.[0];
  const marketSourceName = sourceName(marketSource, lang, t);

  // ---- Water ----
  const waterService = data.water?.[0];
  const waterStressPct = waterService?.supporting_evidence?.stage_of_extraction_pct;
  const waterSource = waterService?.sources_used?.[0];
  const waterSourceName = sourceName(waterSource, lang, t);
  const waterCategory = waterService?.supporting_evidence?.groundwater_status;
  // The backend's code ("safe", "semi_critical", …) as a plain word in the chosen language, the same words as the
  // taluka list below; an unknown code as sent
  const waterCategoryWord = waterCategory ? t(`water.cat.${waterCategory}`, {}, waterCategory) : waterCategory;

  // When a service sends no answer, the backend says why in na_reasons.<service>.text; a card then shows that reason
  // and none of its usual lines. Without a reason from the backend, a plain line of our own is shown.
  const noAnswer = (service, key) => data.na_reasons?.[service]?.text || t(key);

  // The district as the dropdown shows it; the backend's English name only if the page did not pass one
  const region =
    districtName ||
    waterService?.subject?.region ||
    cropService?.subject?.region ||
    marketService?.subject?.region ||
    data.storage?.[0]?.subject?.region ||
    t("common.thisDistrict");

  // Talukas hiding inside the district average, built from CGWB's own taluka list (the same assessment as the
  // district figure). The backend's taluka line is only a fallback: it cites a different survey (GSDA 2023).
  // Only talukas in a MORE severe category than the district (and saline ones) are named as "worse"
  // (src/config/waterCategories.js); when none is, a plain line says so instead.
  const cgwbUnits = waterService?.supporting_evidence?.cgwb_units_2025;
  const stressedUnits = cgwbUnits?.stressed_units || [];
  const worseUnits = talukasWorseThanDistrict(stressedUnits, waterCategory);
  const categories = ["over_exploited", "critical", "semi_critical", "saline"];
  const unitGroups = categories
    .map((category) => {
      const names = worseUnits
        .filter((u) => u.category === category)
        .map((u) => u.shown || u.unit);
      return names.length ? t("water.talukaGroup", { label: t(`water.cat.${category}`), names: names.join(", ") }) : null;
    })
    .filter(Boolean);
  const cgwbDate = fmtDate(cgwbUnits?.observed_at, locale, { month: "long" });
  const backendTalukaLine = (waterService?.explainability || []).find((line) =>
    line.toLowerCase().includes("taluka")
  );
  // In Marathi and Hindi the backend's taluka line (its English reasoning) never stands in: with CGWB's list held and
  // no taluka worse (Bhandara: 7 of 7 safe), the plain line says so; without the list, the line is counted apart.
  const heldWithNoneWorse = !english && !!cgwbUnits;
  const talukaWarning = unitGroups.length
    ? [
        t("water.talukaIntro", { district: region, category: waterCategoryWord }),
        cgwbDate ? t("water.talukaAssessmentOn", { date: cgwbDate }) : t("water.talukaAssessment"),
        unitGroups.join(" "),
        t("water.talukaOutro"),
      ].join(" ")
    : stressedUnits.length || heldWithNoneWorse
      ? null // stressed talukas exist, but none is worse than the district: the plain line below is shown instead
      : english
        ? backendTalukaLine
        : null;
  const talukaEnglishOnly = !english && !unitGroups.length && !cgwbUnits ? backendTalukaLine : null;
  const noTalukaWorse = unitGroups.length === 0 && (stressedUnits.length > 0 || heldWithNoneWorse);

  const cards = {
    harvest: (
      <div className="card">
        <h3 className="card-title">{t("harvest.title", { crop, district: region })}</h3>
        {!cropService ? (
          <p className="card-text">{noAnswer("crop", "harvest.noData")}</p>
        ) : yieldTHa ? (
          <>
            <p className="card-number">
              {yieldTHa} <span className="card-unit">{t("harvest.unit")}</span>
            </p>
            <p className="card-small">{t("harvest.hectareNote")}</p>
          </>
        ) : (
          <>
            <p className="card-sentence">{t("harvest.noRecord")}</p>
            <Warning
              text={[
                t("harvest.missing", { crop, district: region }),
                cropsInData.length ? t("harvest.coversOnly", { crops: cropsInData.join(", ") }) : null,
                t("harvest.notAbsent"),
              ]
                .filter(Boolean)
                .join(" ")}
            />
            {des.note && <p className="card-small">{t("harvest.aboutData", { note: des.note })}</p>}
            <EnglishOnly lines={des.noteEnglishOnly} />
          </>
        )}
        {cropService && <p className="card-small">{t("common.whereFrom", { source: t("harvest.source") })}</p>}
        {yieldTHa && yieldPeriod && <p className="card-small">{t("harvest.dataCovers", { period: yieldPeriod })}</p>}
      </div>
    ),
    price: (
      <div className="card">
        <h3 className="card-title">{t("price.title", { crop, district: region })}</h3>
        {!marketService ? (
          <p className="card-text">{noAnswer("market", "price.noData")}</p>
        ) : (
          <>
            {mandiPrice ? (
              <>
                <p className="card-number">
                  ₹{mandiPrice} <span className="card-unit">{t("common.perQuintal")}</span>
                </p>
                <p className="card-small">{t("price.quintalNote")}</p>
              </>
            ) : (
              <p className="card-sentence">{t("price.noRecent")}</p>
            )}
            {marketMandi && (
              <p className="card-text font-semibold">{t("price.payingMost", { mandi: marketMandi })}</p>
            )}
            <p className="card-small">{t("price.beforeTransport")}</p>
            <p className="card-small" title={marketSourceName.title || undefined}>
              {t("common.whereFrom", { source: marketSourceName.text || t("common.unknown") })}
              {freshnessLabel(marketSource)}
            </p>
            {formatDate(marketSource?.observed_at) && (
              <p className="card-small">{t("price.priceFrom", { date: formatDate(marketSource.observed_at) })}</p>
            )}
            {formatDate(marketService?.last_refresh) && (
              <p className="card-small">{t("common.lastChecked", { date: formatDate(marketService.last_refresh) })}</p>
            )}
          </>
        )}
      </div>
    ),
    water: (
      <div className="card">
        <h3 className="card-title">{t("water.title", { district: region })}</h3>
        {!waterService ? (
          <p className="card-text">{noAnswer("water", "water.noData")}</p>
        ) : (
          <>
            {formatNumber(waterStressPct) ? (
              <>
                <p className="card-number">{formatNumber(waterStressPct)}%</p>
                <p className="card-small">{t("water.refill", { pct: formatNumber(waterStressPct) })}</p>
                {waterCategory && <p className="card-small">{t("water.category", { category: waterCategoryWord })}</p>}
              </>
            ) : (
              <p className="card-sentence">{t("water.notAvailable")}</p>
            )}
            {waterService.abstained && <Warning text={t("water.abstained")} />}
            <p className="card-small" title={waterSourceName.title || undefined}>
              {t("common.whereFrom", { source: waterSourceName.text || t("common.unknown") })}
              {freshnessLabel(waterSource)}
            </p>
            {formatDate(waterSource?.observed_at) && (
              <p className="card-small">{t("water.dataIsFrom", { date: formatDate(waterSource.observed_at) })}</p>
            )}
            {formatDate(waterService.last_refresh) && (
              <p className="card-small">{t("common.lastChecked", { date: formatDate(waterService.last_refresh) })}</p>
            )}
            {isStale(waterSource) && <Warning text={t("water.stale")} />}
            {talukaWarning && <Warning text={talukaWarning} />}
            {noTalukaWorse && <p className="card-small">{t("water.talukaNoneWorse")}</p>}
            <EnglishOnly lines={talukaEnglishOnly} />
          </>
        )}
      </div>
    ),
  };

  return cards[card] || null;
}
