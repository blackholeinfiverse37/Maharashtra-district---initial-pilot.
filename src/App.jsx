import { useState, useEffect } from "react";
import DistrictSelector from "./components/DistrictSelector";
import CropSelector from "./components/CropSelector";
import DataDisplayPanel from "./components/DataDisplayPanel";
import SimulationPanel from "./components/SimulationPanel";
import WeatherNotePanel from "./components/WeatherNotePanel";
import BackgroundInfoPanel from "./components/BackgroundInfoPanel";
import WeatherMapPanel from "./components/WeatherMapPanel";
import TopMandisPanel from "./components/TopMandisPanel";
import WarehousesPanel from "./components/WarehousesPanel";
import WDRA from "./data/wdra_warehouses.json";
import AtAGlancePanel from "./components/AtAGlancePanel";
import Warning from "./components/Warning";
import SystemStateBar from "./components/SystemStateBar";
import CropAreaPieChart from "./components/CropAreaPieChart";
import LanguageSelector from "./components/LanguageSelector";
import { useLanguage, useT } from "./i18n/LanguageContext";
import { isEnglish } from "./i18n/backendText";
import { DEFAULT_STATE, STATES, statesFromServed } from "./config/states";
import {
  fetchCrops,
  fetchDistrictView,
  fetchDistricts,
  fetchEnamMandis,
  fetchPlacesMap,
  fetchServedStates,
  fetchSoilMoisture,
  fetchWeatherForecast,
  fetchWeatherOutlook,
} from "./data_adapter/aiaicApi";

export default function App() {
  // The language the backend answers in (the chosen one when it supports it, otherwise English)
  const { lang, apiLang, showsEnglishNote } = useLanguage();
  const t = useT();
  // The browser tab's title in the chosen language too (index.html holds the English one)
  useEffect(() => {
    document.title = t("app.title");
  }, [t]);
  const [states, setStates] = useState(STATES); // the states offered: src/config/states.js, narrowed by /catalog
  const [estate, setEstate] = useState(DEFAULT_STATE); // the state code sent to the backend
  const [districts, setDistricts] = useState([]);
  const [district, setDistrict] = useState(""); // the district's ENGLISH name (name_en): what is sent to the backend
  const [crops, setCrops] = useState([]);
  const [crop, setCrop] = useState(""); // a crop KEY, as AIAIC lists it (e.g. "onion")
  const [listError, setListError] = useState(null);
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState(null); // the district's 7-day forecast, or null when it failed
  const [background, setBackground] = useState({ enam: null, soil: null }); // older district facts; null = failed
  const [outlook, setOutlook] = useState(null); // every district's week of weather (the map card); null = failed
  const [mapData, setMapData] = useState(null); // every district's centre and names (the map card); null = failed

  // A change of choice clears everything that depended on the old one, here and not inside an effect.
  const chooseEstate = (next) => {
    setEstate(next);
    setDistricts([]);
    setDistrict("");
    setCrops([]);
    setCrop("");
    setListError(null);
    setData(null);
    setForecast(null);
    setBackground({ enam: null, soil: null });
    setOutlook(null);
    setMapData(null);
    setStatus("idle");
  };
  const chooseDistrict = (next) => {
    setDistrict(next);
    setCrops([]);
    setCrop("");
    setData(null);
    setForecast(null);
    setBackground({ enam: null, soil: null });
    setStatus("idle");
  };
  const chooseCrop = (next) => {
    setCrop(next);
    setData(null);
    setStatus(district && next ? "loading" : "idle");
  };

  // The states the backend serves (its /catalog). If it cannot be read, the config file's list stays.
  useEffect(() => {
    let cancelled = false;
    fetchServedStates()
      .then((served) => !cancelled && setStates(statesFromServed(served)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // The state's districts (never a hardcoded fallback list), named in the chosen language. A language change reloads
  // the lists and the answers below; the chosen district and crop stay, since they are kept by English name and key.
  useEffect(() => {
    let cancelled = false;
    fetchDistricts(estate, apiLang)
      .then((list) => !cancelled && setDistricts(list))
      .catch((e) => !cancelled && setListError(e.message));
    return () => {
      cancelled = true;
    };
  }, [estate, apiLang]);

  // The crops for THIS district, in AIAIC's order: what is grown or traded here, not every crop in the state.
  useEffect(() => {
    if (!district) return undefined;
    let cancelled = false;
    fetchCrops(estate, district, apiLang)
      .then((list) => !cancelled && setCrops(list))
      .catch((e) => !cancelled && setListError(e.message));
    return () => {
      cancelled = true;
    };
  }, [estate, district, apiLang]);

  // The district's weather forecast: the same for every crop, so it is fetched once per district. A failure leaves it
  // empty, and the weather card falls back to the backend's note.
  useEffect(() => {
    if (!district) return undefined;
    let cancelled = false;
    fetchWeatherForecast({ state: estate, district, lang: apiLang })
      .then((f) => !cancelled && setForecast(f))
      .catch(() => !cancelled && setForecast(null));
    return () => {
      cancelled = true;
    };
  }, [estate, district, apiLang]);

  // The weather map: every district's week of weather (read in English, see fetchWeatherOutlook) and every district's
  // centre and names in the chosen language. Either one failing leaves it empty, and the map card is hidden.
  useEffect(() => {
    let cancelled = false;
    fetchWeatherOutlook({ state: estate })
      .then((o) => !cancelled && setOutlook(o))
      .catch(() => !cancelled && setOutlook(null));
    return () => {
      cancelled = true;
    };
  }, [estate]);
  useEffect(() => {
    let cancelled = false;
    fetchPlacesMap({ state: estate, crop: crop || undefined, lang: apiLang })
      .then((m) => !cancelled && setMapData(m))
      .catch(() => !cancelled && setMapData(null));
    return () => {
      cancelled = true;
    };
  }, [estate, crop, apiLang]);

  // Older background facts for the district (e-NAM mandis, soil moisture). Each one that fails stays empty, and the
  // card hides that part.
  useEffect(() => {
    if (!district) return undefined;
    let cancelled = false;
    Promise.allSettled([
      fetchEnamMandis({ state: estate, district, lang: apiLang }),
      fetchSoilMoisture({ state: estate, district, lang: apiLang }),
    ]).then(([enam, soil]) => {
      if (cancelled) return;
      setBackground({
        enam: enam.status === "fulfilled" ? enam.value : null,
        soil: soil.status === "fulfilled" ? soil.value : null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [estate, district, apiLang]);

  useEffect(() => {
    if (!district || !crop) return undefined;
    let cancelled = false; // ignore answers that arrive after the selection changed
    fetchDistrictView({ state: estate, district, crop, lang: apiLang })
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
  }, [district, crop, estate, apiLang]);

  // Names to SHOW, in the chosen language. The English names stay for matching the backend's English-only data.
  const districtName = (districts.find((d) => d.name_en === district) || {}).name || district;
  const cropRow = crops.find((c) => c.key === crop) || {};
  const cropName = cropRow.name || crop;
  const cropNameEn = cropRow.name_en || crop;
  // English district name -> the name to show, for district names inside backend data (e.g. a mandi's district)
  const districtNamesShown = Object.fromEntries(districts.map((d) => [d.name_en, d.name]));
  const stateName = (s) => (s ? t(s.nameKey, {}, s.fallbackName || s.code) : "");
  const currentState = states.find((s) => s.code === estate) || STATES.find((s) => s.code === estate);
  const uncalibrated = data?.market?.[0]?.uncalibrated_warning;

  return (
    <div className="page min-h-screen p-4 sm:p-6">
      {/* Header */}
      <div className="page-column mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-700">{t("app.title")}</h1>
          <p className="text-sm text-gray-400 mt-1">{t("app.subtitle", { state: stateName(currentState) })}</p>
          {showsEnglishNote && <p className="card-small">{t("app.englishNote")}</p>}
        </div>
        <LanguageSelector />
      </div>

      {/* List error: said, never replaced by a hardcoded list. The technical detail (English) in English only. */}
      {listError && (
        <div className="page-column mb-4">
          <Warning text={isEnglish(lang) ? t("app.listError", { error: listError }) : t("app.listErrorPlain")} />
        </div>
      )}

      {/* Backend's own "not farmer-ready" warning. Its note is AIAIC's note to developers, always in English: in
          Marathi and Hindi only the lead, which says the same in the chosen language. */}
      {status === "success" && uncalibrated && (
        <div className="page-column mb-4">
          <Warning text={isEnglish(lang) ? `${t("app.uncalibratedLead")} ${uncalibrated}` : t("app.uncalibratedLead")} />
        </div>
      )}

      {/* Selectors */}
      <div className="page-column card mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="field-label">{t("field.state")}</label>
            <select
              value={estate}
              onChange={(e) => chooseEstate(e.target.value)}
              className="field-select"
            >
              {states.map((s) => (
                <option key={s.code} value={s.code}>
                  {stateName(s)}
                </option>
              ))}
            </select>
          </div>
          <DistrictSelector value={district} onChange={chooseDistrict} options={districts} />
          <CropSelector value={crop} onChange={chooseCrop} options={crops} disabled={!district} />
        </div>
      </div>

      <div className="page-column mb-4">
        <SystemStateBar status={status} district={districtName} crop={cropName} />
      </div>

      {status === "loading" && (
        <div className="page-column flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
        </div>
      )}

      {status === "success" && (
        <div className="page-column card-stack">
          <AtAGlancePanel data={data} />
          <DataDisplayPanel data={data} crop={cropName} cropEn={cropNameEn} districtName={districtName} card="price" />
          <TopMandisPanel data={data} districtNames={districtNamesShown} />
          <WarehousesPanel
            stateName={currentState?.served}
            districtEn={district}
            mapData={mapData}
            districtNames={districtNamesShown}
          />
          <SimulationPanel data={data} districtName={districtName} />
          <DataDisplayPanel data={data} crop={cropName} cropEn={cropNameEn} districtName={districtName} card="water" />
          <DataDisplayPanel
            data={data}
            crop={cropName}
            cropEn={cropNameEn}
            cropKey={crop}
            districtName={districtName}
            card="harvest"
          />
          <WeatherNotePanel data={data} forecast={forecast} />
          <WeatherMapPanel
            outlook={outlook}
            mapData={mapData}
            selectedDistrictEn={district}
            warehouses={WDRA}
            stateName={currentState?.served}
          />
          <BackgroundInfoPanel enam={background.enam} soil={background.soil} districtName={districtName} wdraAsOn={WDRA.source_last_updated} />
          <CropAreaPieChart data={data} crop={cropName} cropEn={cropNameEn} cropKey={crop} districtName={districtName} />
        </div>
      )}

      {status === "idle" && (
        <div className="page-column text-center py-16">
          <p className="card-title" style={{ color: "var(--color-muted)" }}>
            {t("app.idle")}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="page-column text-center py-16">
          <Warning text={t("app.loadError")} />
        </div>
      )}
    </div>
  );
}
