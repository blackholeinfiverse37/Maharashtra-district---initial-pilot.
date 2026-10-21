import { fixedBandOf } from "../data_adapter/aiaicApi";

const BAND_TEXT = { plus_minus_2_pct: "±2%", plus_minus_1_5_pct: "±1.5%" };

export default function SimulationPanel({ data }) {
  const storage = data?.storage?.[0];

  // Nothing came back for this crop: say so, instead of hiding the panel
  if (!storage) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-600">Sell now, or store and wait?</h3>
        <p className="text-sm text-gray-500 mt-2">
          Our system has no sell-or-store answer for this crop yet.
        </p>
      </div>
    );
  }

  const sim = storage?.supporting_evidence?.illustrative_storage_scenario;
  // Use the example when there is one. Otherwise use the storage service's own answer.
  const scenario = sim || storage;

  const referenceMandi =
    storage?.supporting_evidence?.representative_mandi ||
    storage?.subject?.reference_mandi ||
    "a reference market";
  const requestedRegion = storage?.subject?.region || "your district";

  const money = (v) =>
    typeof v === "number" ? `₹${Math.round(v).toLocaleString("en-IN")}` : "N/A";

  const headline = sim
    ? (sim.recommendation || "").replace(/_/g, " ").toLowerCase()
    : (storage.recommendation_detail || "").toLowerCase();

  // The backend's own most important warnings, shown as written
  const warnings = storage.read_these_first || [];

  // When AIAIC has no measured spread, its engine fills best/average/worst with a FIXED band around one price.
  // That is not "a better day / a weaker day", so only the price itself is shown (review 2026-10-02).
  const band = sim ? null : fixedBandOf(storage.summary);

  return (
    <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-600">Sell now, or store and wait?</h3>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
          {sim ? "EXAMPLE ONLY" : "NOT FARMER-READY"}
        </span>
      </div>

      {storage.abstained ? (
        <p className="text-sm text-orange-600">
          ⚠️ Our system chose not to answer this, because the data is not reliable enough.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-700 mb-3">
            {sim ? "In this example, the answer is: " : "Our system's answer: "}
            <strong>{headline}</strong>
          </p>

          {band ? (
            <>
              <p className="text-xs text-gray-500 mb-2">Latest price per quintal (100 kg):</p>
              <p className="font-bold text-gray-800">{money(scenario.average_case?.value)}</p>
              <p className="text-xs text-gray-500 mt-2">
                No better-day or weaker-day range is shown: there is no measured spread here, only a fixed{" "}
                {BAND_TEXT[band] || "band"} around this one price.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2">Expected price per quintal (100 kg):</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-400">On a better day</p>
                  <p className="font-bold text-gray-800">{money(scenario.best_case?.value)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">On a typical day</p>
                  <p className="font-bold text-gray-800">{money(scenario.average_case?.value)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">On a weaker day</p>
                  <p className="font-bold text-gray-800">{money(scenario.worst_case?.value)}</p>
                </div>
              </div>
            </>
          )}

          <p className="text-xs text-gray-400 mt-3">
            The price used here comes from {referenceMandi}, not from {requestedRegion}.
          </p>
        </>
      )}

      {sim?.note && <p className="text-xs text-purple-700 mt-3">{sim.note}</p>}

      {warnings.map((w, i) => (
        <p key={i} className="text-xs text-orange-600 mt-2">
          ⚠️ {w}
        </p>
      ))}
    </div>
  );
}