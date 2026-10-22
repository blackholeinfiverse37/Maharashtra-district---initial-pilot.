// "Background information (older data)": district facts that are not about this season. Every name, date and sentence
// is taken from the backend's response. A part with no data is hidden; with neither part, the card is hidden.

import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatDate } from "../i18n/format";

function Part({ title, children, dateLine, source }) {
  return (
    <div className="info-part">
      <h4 className="card-subtitle">{title}</h4>
      {children}
      {dateLine && <p className="card-small">{dateLine}</p>}
      {source && <p className="card-small">{source}</p>}
    </div>
  );
}

// `districtName` is the district as the dropdown shows it (in the chosen language).
export default function BackgroundInfoPanel({ enam, soil, districtName }) {
  const { locale } = useLanguage();
  const t = useT();
  // "2021-03-31" -> "31 Mar 2021", in the chosen language (a plain day is read as that local day)
  const formatDay = (value) => formatDate(value, locale);

  // Each source's name (or, when the response lists several files, their shared publisher), once each
  const sourceLine = (sources, field) => {
    const names = [...new Set((Array.isArray(sources) ? sources : []).map((s) => s?.[field]).filter(Boolean))];
    return names.length ? t("common.whereFrom", { source: names.join("; ") }) : null;
  };

  // Part 1: e-NAM mandis
  const mandis = (Array.isArray(enam?.mandis) ? enam.mandis : []).map((m) => m?.mandi).filter(Boolean);
  const enamDay = formatDay(enam?.coverage_as_on);
  const showEnam = enam?.held !== false && mandis.length > 0;

  // Part 2: soil moisture (the backend's own sentence carries the range and its unit)
  const soilSentence = soil?.headline;
  const soilFirst = formatDay(soil?.season?.first_day);
  const soilLast = formatDay(soil?.season?.last_day);
  const showSoil = soil?.held !== false && soil?.covered !== false && typeof soilSentence === "string" && !!soilSentence.trim();

  if (!showEnam && !showSoil) return null;

  return (
    <div className="card">
      <h3 className="card-title">{t("bg.title")}</h3>

      {showEnam && (
        <Part
          title={t("bg.enam", { district: districtName || enam.district || t("common.thisDistrict") })}
          dateLine={enamDay ? t("common.dataFrom", { date: enamDay }) : null}
          source={sourceLine(enam.sources, "name")}
        >
          <p className="card-text">{mandis.join(", ")}</p>
        </Part>
      )}

      {showSoil && (
        <Part
          title={t("bg.soil", { district: districtName || soil.district || t("common.thisDistrict") })}
          dateLine={
            soilFirst && soilLast
              ? t("common.dataFromTo", { from: soilFirst, to: soilLast })
              : soilLast
                ? t("common.dataFrom", { date: soilLast })
                : null
          }
          source={sourceLine(soil.sources, "publisher")}
        >
          <p className="card-text">{soilSentence}</p>
        </Part>
      )}
    </div>
  );
}
