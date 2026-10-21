export default function DataDisplayPanel({ data, crop }) {
  if (!data) return null;

  // "2026-09-25T00:00:00" -> "25 Sep 2026"
  const formatDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // 1600 -> "1,600"
  const formatNumber = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : null);

  // Turn technical freshness words into plain English
  const freshnessWords = { FRESH: "Up to date", AGING: "Getting old", STALE: "Out of date" };
  const freshnessLabel = (source) => {
    if (!source) return "";
    const status = (source.real_world_freshness || source.freshness || "").toUpperCase();
    return freshnessWords[status] || status;
  };
  const isStale = (source) =>
    (source?.real_world_freshness || source?.freshness || "").toLowerCase() === "stale";

  // ---- Yield ----
  const cropService = data.crop?.[0];
  const apy = cropService?.supporting_evidence?.district_crop_apy;
  const allCrops = apy?.crops || [];
  const matchingCropRow = allCrops.find(
    (c) => c.crop && c.crop.toLowerCase() === (crop || "").toLowerCase()
  );
  const yieldKgHa = matchingCropRow?.yield_kg_ha;
  const yieldTHa = yieldKgHa ? (yieldKgHa / 1000).toFixed(2) : null;
  const yieldPeriod = apy?.year || null;

  // ---- Market ----
  const marketService = data.market?.[0];
  const mandiPrice = formatNumber(marketService?.average_case?.value);
  const marketPlace = marketService?.subject?.region || "the state";
  const marketAdvice = marketService?.recommendation_detail;
  const marketSource = marketService?.sources_used?.[0];

  // ---- Water ----
  const waterService = data.water?.[0];
  const waterStressPct = waterService?.supporting_evidence?.stage_of_extraction_pct;
  const waterSource = waterService?.sources_used?.[0];
  const waterCategory = waterService?.supporting_evidence?.groundwater_status;

  const region = waterService?.subject?.region || cropService?.subject?.region || "this district";

  // Talukas hiding inside the district average, built from CGWB's own taluka list (the same assessment as the
  // district figure). The backend's taluka line is only a fallback: it cites a different survey (GSDA 2023).
  const cgwbUnits = waterService?.supporting_evidence?.cgwb_units_2025;
  const stressedUnits = cgwbUnits?.stressed_units || [];
  const categoryLabels = {
    over_exploited: "Over-exploited",
    critical: "Critical",
    semi_critical: "Semi-critical",
    saline: "Saline",
  };
  const unitGroups = Object.entries(categoryLabels)
    .map(([category, label]) => {
      const names = stressedUnits
        .filter((u) => u.category === category)
        .map((u) => u.shown || u.unit);
      return names.length ? `${label}: ${names.join(", ")}.` : null;
    })
    .filter(Boolean);
  const cgwbDate = cgwbUnits?.observed_at
    ? new Date(cgwbUnits.observed_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const backendTalukaLine = (waterService?.explainability || []).find((line) =>
    line.toLowerCase().includes("taluka")
  );
  const talukaWarning = unitGroups.length
    ? `The district figure can hide your taluka. ${region} is '${waterCategory}' as a whole, but that is an average. ` +
      `In the CGWB assessment${cgwbDate ? ` as on ${cgwbDate}` : ""}, these talukas are worse. ` +
      `${unitGroups.join(" ")} ` +
      "If you farm in one of them, the district answer does not describe your water."
    : backendTalukaLine;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Yield Card */}
      <div className="bg-white p-5 rounded-xl border border-green-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-600">
          Average harvest of {crop} in {region}:
        </h3>
        {yieldTHa ? (
          <>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {yieldTHa}{" "}
              <span className="text-sm font-normal text-gray-500">tonnes per hectare</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">(1 hectare is about 2.5 acres)</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-800 mt-2">No record found</p>
            <p className="text-xs text-orange-600 mt-2">
              ⚠️ The government crop data has no harvest figure for {crop} in {region}. It mainly
              covers cereals, millets and pulses. A missing record does not mean the crop is not
              grown here.
            </p>
          </>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Where this comes from: DES / MoSPI (government crop statistics)
        </p>
        {yieldTHa && yieldPeriod && (
          <p className="text-xs text-gray-500 mt-1">
            Data covers: {yieldPeriod} (updated once a year)
          </p>
        )}
      </div>

      {/* Mandi Price Card */}
      <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-600">
          Best price for {crop} across {marketPlace} markets:
        </h3>
        {mandiPrice ? (
          <>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              ₹{mandiPrice}{" "}
              <span className="text-sm font-normal text-gray-500">per quintal</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">(1 quintal = 100 kg)</p>
          </>
        ) : (
          <p className="text-2xl font-bold text-gray-800 mt-2">No recent price found</p>
        )}
        {marketAdvice && (
          <p className="text-sm text-blue-600 mt-2 font-medium">
            Market paying the most: {marketAdvice.replace(/^Sell at /, "")}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          This price is before transport costs, which are not included.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Where this comes from: {marketSource?.source_name || "Unknown"} (
          {freshnessLabel(marketSource)})
        </p>
        {formatDate(marketSource?.observed_at) && (
          <p className="text-xs text-gray-500 mt-1">
            Price is from: {formatDate(marketSource.observed_at)}
          </p>
        )}
        {formatDate(marketService?.last_refresh) && (
          <p className="text-xs text-gray-400">
            Last checked by our system: {formatDate(marketService.last_refresh)}
          </p>
        )}
      </div>

      {/* Water Stress Card */}
      <div className="bg-white p-5 rounded-xl border border-orange-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-600">
          Average water stress in {region}:
        </h3>
        {typeof waterStressPct === "number" ? (
          <>
            <p className="text-2xl font-bold text-gray-800 mt-2">{waterStressPct}%</p>
            <p className="text-xs text-gray-500 mt-1">
              Each year, nature refills the groundwater. About {waterStressPct}% of that refill
              is being taken out.
            </p>
            {waterCategory && (
              <p className="text-xs text-gray-500 mt-1">
                Category for the district (worked out by AIAIC from the extraction stage): {waterCategory}
              </p>
            )}
          </>
        ) : (
          <p className="text-2xl font-bold text-gray-800 mt-2">Not available</p>
        )}
        {waterService?.abstained && (
          <p className="text-xs text-orange-600 mt-2">
            ⚠️ Our system chose not to give a water recommendation, because the data is too old
            to trust.
          </p>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Where this comes from: {waterSource?.source_name || "Unknown"} (
          {freshnessLabel(waterSource)})
        </p>
        {formatDate(waterSource?.observed_at) && (
          <p className="text-xs text-gray-500 mt-1">
            Data is from: {formatDate(waterSource.observed_at)}
          </p>
        )}
        {formatDate(waterService?.last_refresh) && (
          <p className="text-xs text-gray-400">
            Last checked by our system: {formatDate(waterService.last_refresh)}
          </p>
        )}
        {isStale(waterSource) && (
          <p className="text-xs text-orange-600 mt-2">
            ⚠️ This is the newest official survey available, but it is old. Please check local
            conditions before acting on it.
          </p>
        )}
        {talukaWarning && <p className="text-xs text-orange-600 mt-2">⚠️ {talukaWarning}</p>}
      </div>
    </div>
  );
}