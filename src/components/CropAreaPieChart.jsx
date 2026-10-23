// CropAreaPieChart.jsx
import { freshnessKey } from "./freshness";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatNumber } from "../i18n/format";
import { desCrops } from "../i18n/backendText";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Twelve distinguishable colours: a district's crop list is usually longer than six, and a repeated colour makes
// two crops look like one (Nashik lists ten).
const COLORS = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc948",
                "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac", "#1f3a93", "#8cd17d"];

// `crop` and `districtName` are the names to SHOW; `cropKey` (the crop's key) and `cropEn` (its English name) are used
// to look for it in the English-only chart data. Each crop is drawn under its name in the chosen language, from the
// crop answer's summary (src/i18n/backendText.js); DES's own name when the summary gives none.
export default function CropAreaPieChart({ data, crop, cropEn, cropKey, districtName }) {
  const { lang, apiLang, locale } = useLanguage();
  const t = useT();
  const num = (v) => formatNumber(v, locale);
  const cropService = data?.crop?.[0];
  const region = districtName || cropService?.subject?.region || t("common.thisDistrict");
  const apy = cropService?.supporting_evidence?.district_crop_apy;
  const crops = apy?.crops || [];
  // Only the DES crop-area source describes this chart. The crop service's first source is CGWB groundwater, so its
  // freshness must never be shown here; with no DES source, no freshness word is shown.
  const source = (cropService?.sources_used || []).find((s) => /^des[_-]/i.test(s?.source_id || ""));

  const byCrop = {};
  crops.forEach((c) => {
    if (c.area_lakh_ha > 0) {
      byCrop[c.crop] = (byCrop[c.crop] || 0) + c.area_lakh_ha;
    }
  });

  const des = desCrops(cropService, { lang, apiLang, cropKey, cropEn, crop });
  const chartData = Object.entries(byCrop).map(([desName, area]) => ({
    name: des.name(desName),
    desName,
    value: Math.round(area * 100) / 100,
  }));

  if (chartData.length === 0) return null;

  // Say so when the selected crop is missing from this government data (e.g. Nashik has no Onion row), so the chart
  // is not read as covering it. No crop passed in: no note.
  const cropMissing = (cropKey || cropEn || crop) && !chartData.some((d) => des.isChosen({ crop: d.desName }));

  const freshness = freshnessKey(source);

  return (
    <div className="card">
      <h3 className="card-title">{t("pie.title", { district: region })}</h3>
      <p className="card-small">
        {t("pie.units")}
        {cropMissing ? ` · ${t("pie.cropMissing", { crop })}` : ""}
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius="80%"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => (num(value) ? t("pie.tooltip", { value: num(value) }) : "")} />
          <Legend
            formatter={(name, entry) => (
              <span style={{ color: "var(--color-text)", fontSize: "var(--text-small)" }}>
                {name}
                {num(entry?.payload?.value) ? `: ${num(entry.payload.value)}` : ""}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="card-small">
        {t("common.whereFrom", { source: t("pie.source") })}
        {apy?.year ? ` · ${t("pie.dataCovers", { year: apy.year })}` : ""}
        {freshness ? ` · ${t(freshness)}` : ""}
      </p>
    </div>
  );
}
