import { useState, useEffect } from "react";
import DistrictSelector from "./components/DistrictSelector";
import CropSelector from "./components/CropSelector";
import DataDisplayPanel from "./components/DataDisplayPanel";
import SimulationPanel from "./components/SimulationPanel";
import SystemStateBar from "./components/SystemStateBar";
import CropAreaPieChart from "./components/CropAreaPieChart";
import { fetchCrops, fetchDistrictView, fetchDistricts } from "./data_adapter/aiaicApi";

const ESTATES = [
  { id: "maharashtra", label: "Maharashtra" },
  { id: "mp", label: "Madhya Pradesh" },
];

export default function App() {
  const [estate, setEstate] = useState("maharashtra"); // "maharashtra" or "mp"
  const [districts, setDistricts] = useState([]);
  const [district, setDistrict] = useState(""); // a district NAME, as AIAIC lists it (e.g. "Nashik")
  const [crops, setCrops] = useState([]);
  const [crop, setCrop] = useState(""); // a crop KEY, as AIAIC lists it (e.g. "onion")
  const [listError, setListError] = useState(null);
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);

  // A change of choice clears everything that depended on the old one, here and not inside an effect.
  const chooseEstate = (next) => {
    setEstate(next);
    setDistricts([]);
    setDistrict("");
    setCrops([]);
    setCrop("");
    setListError(null);
    setData(null);
    setStatus("idle");
  };
  const chooseDistrict = (next) => {
    setDistrict(next);
    setCrops([]);
    setCrop("");
    setData(null);
    setStatus("idle");
  };
  const chooseCrop = (next) => {
    setCrop(next);
    setData(null);
    setStatus(district && next ? "loading" : "idle");
  };

  // The state's districts (never a hardcoded fallback list).
  useEffect(() => {
    let cancelled = false;
    fetchDistricts(estate)
      .then((list) => !cancelled && setDistricts(list))
      .catch((e) => !cancelled && setListError(e.message));
    return () => {
      cancelled = true;
    };
  }, [estate]);

  // The crops for THIS district, in AIAIC's order: what is grown or traded here, not every crop in the state.
  useEffect(() => {
    if (!district) return undefined;
    let cancelled = false;
    fetchCrops(estate, district)
      .then((list) => !cancelled && setCrops(list))
      .catch((e) => !cancelled && setListError(e.message));
    return () => {
      cancelled = true;
    };
  }, [estate, district]);

  useEffect(() => {
    if (!district || !crop) return undefined;
    let cancelled = false; // ignore answers that arrive after the selection changed
    fetchDistrictView({ state: estate, district, crop })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setStatus("success");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Connection Error:", err.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [district, crop, estate]);

  const cropName = (crops.find((c) => c.key === crop) || {}).name || crop;
  const uncalibrated = data?.market?.[0]?.uncalibrated_warning;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <h1 className="text-2xl font-bold text-green-700">AIAIC District Intelligence Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Agricultural Intelligence - {ESTATES.find((e) => e.id === estate)?.label}
        </p>
      </div>

      {/* List error: said, never replaced by a hardcoded list */}
      {listError && (
        <div className="max-w-5xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">Could not load the district or crop list: {listError}</p>
        </div>
      )}

      {/* Backend's own "not farmer-ready" warning */}
      {status === "success" && uncalibrated && (
        <div className="max-w-5xl mx-auto mb-4 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <p className="text-sm font-semibold text-yellow-800">
            ⚠️ Needs to be approved by agronomists before in use.
          </p>
          <p className="text-xs text-yellow-700 mt-1">{uncalibrated}</p>
        </div>
      )}

      {/* Selectors */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">State</label>
            <select
              value={estate}
              onChange={(e) => chooseEstate(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {ESTATES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <DistrictSelector value={district} onChange={chooseDistrict} options={districts} />
          <CropSelector value={crop} onChange={chooseCrop} options={crops} disabled={!district} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto mb-4">
        <SystemStateBar status={status} district={district} crop={cropName} />
      </div>

      {status === "loading" && (
        <div className="max-w-5xl mx-auto flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
        </div>
      )}

      {status === "success" && (
        <div className="max-w-5xl mx-auto flex flex-col gap-5">
          <DataDisplayPanel data={data} crop={cropName} />
          <SimulationPanel data={data} />
          <CropAreaPieChart data={data} crop={cropName} />
        </div>
      )}

      {status === "idle" && (
        <div className="max-w-5xl mx-auto text-center py-16">
          <p className="text-lg font-medium text-gray-400">
            Select district and crop above to load district intelligence
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="max-w-5xl mx-auto text-center py-16">
          <p className="text-lg font-medium text-red-400">
            Could not load data. Please try a different selection.
          </p>
        </div>
      )}
    </div>
  );
}
