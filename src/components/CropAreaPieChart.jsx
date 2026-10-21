// CropAreaPieChart.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Twelve distinguishable colours: a district's crop list is usually longer than six, and a repeated colour makes
// two crops look like one (Nashik lists ten).
const COLORS = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc948",
                "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac", "#1f3a93", "#8cd17d"];

export default function CropAreaPieChart({ data, crop }) {
  const cropService = data?.crop?.[0];
  const region = cropService?.subject?.region || "Selected District";
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

  const chartData = Object.entries(byCrop).map(([crop, area]) => ({
    name: crop,
    value: Math.round(area * 100) / 100,
  }));

  if (chartData.length === 0) return null;

  // Say so when the selected crop is missing from this government data (e.g. Nashik has no Onion row), so the chart
  // is not read as covering it. No crop passed in: no note.
  const cropMissing =
    crop && !chartData.some((d) => d.name.toLowerCase() === crop.toLowerCase());

  const freshnessLabel = source
    ? (source.real_world_freshness || source.freshness || "").toUpperCase()
    : "";

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        How farmland is used in {region} (in lakh hectares; 1 lakh = 100,000)
        {cropMissing ? ` · ${crop} is not in this government data.` : ""}
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            label={(entry) => `${entry.name}: ${entry.value}`}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} lakh ha`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2">
        Where this comes from: DES / MoSPI
        {apy?.year ? ` · Data covers ${apy.year}` : ""}
        {freshnessLabel ? ` · AIAIC marks this data ${freshnessLabel.toLowerCase()}` : ""}
      </p>
    </div>
  );
}