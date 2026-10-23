import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatDate, formatNumber, formatWeekday } from "../i18n/format";
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from "../config/mapTiles";
import { norm } from "../config/geo";
import { warehouseCountsByDistrict } from "../data/warehousesNear";

// The district map, with a switch between two views:
//   - Weather: one small pin per district at its centre, its shape and fill saying the week's weather (dry / maybe rain
//     / rain) and the week's highest temperature beside it, from the backend's /weather/outlook;
//   - Warehouses: one pin per district with the number of active registered warehouses beside it (WDRA's list, as in
//     the warehouse card); a district with none has a hollow pin. Shown only for a state the list covers.
// Positions and district names (shown, and English for matching) come from /places/map. The selected district's pin is
// bigger, with a label. Clicking a pin changes nothing. With no data, or if the map cannot be drawn, the card is hidden.

// Pin sizes (px): the pin is a square turned 45°, so its tip sits 0.71 × size below its centre
const PIN = 16;
const PIN_SELECTED = 24;
const KINDS = ["dry", "maybe", "rain"];
// Each pin's word: the same words as the 7-day forecast card ("Dry", "Some chance of rain", "Rain likely")
const KIND_WORD = { dry: "weather.kind.dry", maybe: "weather.kind.some_chance", rain: "weather.kind.rain_likely" };

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// The week's word for one district, from its counts: rain likely on some day > some chance of rain > all dry
const kindOf = (w) =>
  w.rain_likely_days > 0 ? "rain" : w.some_chance_days > 0 ? "maybe" : w.dry_days > 0 ? "dry" : null;

export default function WeatherMapPanel({ outlook, mapData, selectedDistrictEn, warehouses, stateName }) {
  const { locale } = useLanguage();
  const t = useT();
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const fittedFor = useRef(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState("weather");
  // A map that cannot be drawn hides the card. Reported after the effect, not inside it.
  const fail = () => queueMicrotask(() => setFailed(true));

  // Every district with a usable centre
  const points = useMemo(
    () =>
      (mapData?.points || [])
        .map((p) => ({ nameEn: p?.name_en, name: p?.district || p?.name_en, lat: Number(p?.lat), lon: Number(p?.lon) }))
        .filter((p) => p.nameEn && Number.isFinite(p.lat) && Number.isFinite(p.lon)),
    [mapData]
  );

  // Weather view: the districts that have a weather line
  const weatherDistricts = useMemo(() => {
    const byName = new Map((outlook?.districts || []).map((w) => [w?.name, w]));
    return points
      .filter((p) => byName.has(p.nameEn))
      .map((p) => ({ ...p, weather: byName.get(p.nameEn), kind: kindOf(byName.get(p.nameEn)) }));
  }, [outlook, points]);

  // Warehouses view: every district, with its count (0 when none), only for a state the list covers
  const warehouseDistricts = useMemo(() => {
    const { covered, counts } = warehouseCountsByDistrict({ list: warehouses?.warehouses, stateName });
    if (!covered) return [];
    return points.map((p) => ({ ...p, wh: counts.get(norm(p.nameEn)) || { count: 0, capacity: 0 } }));
  }, [warehouses, stateName, points]);

  const canWeather = weatherDistricts.length > 0;
  const canWarehouses = warehouseDistricts.length > 0;
  const view = mode === "warehouses" ? (canWarehouses ? "warehouses" : "weather") : canWeather ? "weather" : "warehouses";
  const districts = view === "weather" ? weatherDistricts : warehouseDistricts;

  // The map itself, made once; removed when the card goes away
  const hasDistricts = districts.length > 0;
  useEffect(() => {
    if (!hasDistricts || !boxRef.current || mapRef.current) return undefined;
    try {
      const map = L.map(boxRef.current, {
        scrollWheelZoom: false, // the page keeps scrolling over the map
        dragging: !L.Browser.mobile, // on a phone one finger scrolls the page; two fingers zoom the map
        attributionControl: true,
      });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: TILE_MAX_ZOOM }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    } catch {
      fail();
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      fittedFor.current = null;
    };
  }, [hasDistricts]);

  // The pins, redrawn when the view, the data, the selection or the language changes
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    try {
      layer.clearLayers();
      for (const d of districts) {
        const selected = d.nameEn === selectedDistrictEn;
        const size = selected ? PIN_SELECTED : PIN;
        let pinClass;
        let beside;
        let label;
        if (view === "weather") {
          const temp = formatNumber(d.weather.max_temp, locale, { maximumFractionDigits: 0 });
          const word = d.kind ? t(KIND_WORD[d.kind]) : "";
          pinClass = d.kind ? `wmap-${d.kind}` : "";
          beside = temp ? `${temp}°` : "";
          label = t("wmap.bubbleTitle", { district: d.name, temp: temp || "", word });
        } else {
          const count = formatNumber(d.wh.count, locale);
          const capacity = formatNumber(d.wh.capacity, locale, { maximumFractionDigits: 0 });
          pinClass = d.wh.count > 0 ? "wmap-wh" : "wmap-wh-none";
          beside = count || "";
          label = t("wmap.whPinTitle", { district: d.name, count: count || "0", capacity: capacity || "0" });
        }
        // The pin, and beside it its number (the selected district has its full label instead)
        const html =
          `<div class="wmap-pin ${pinClass} ${selected ? "wmap-selected" : ""}"></div>` +
          (beside && !selected ? `<span class="wmap-temp">${escapeHtml(beside)}</span>` : "");
        const marker = L.marker([d.lat, d.lon], {
          icon: L.divIcon({
            className: "wmap-icon",
            html,
            iconSize: [size, Math.round(size * 1.25)],
            iconAnchor: [size / 2, Math.round(size / 2 + size * 0.71)], // the pin's tip on the district's centre
          }),
          title: label, // shown on hover; clicking a pin does nothing
          alt: d.name,
          keyboard: false,
          zIndexOffset: selected ? 1000 : 0,
        });
        // The chosen district keeps its label on the map
        if (selected) {
          marker.bindTooltip(escapeHtml(label), {
            permanent: true,
            direction: "top",
            offset: [0, -Math.round(size * 1.2)],
            className: "wmap-label",
          });
        }
        marker.addTo(layer);
      }
      // Fit the view to all the districts once per set of districts (not on every selection or switch)
      const setKey = districts.map((d) => d.nameEn).join("|");
      if (fittedFor.current !== setKey) {
        map.fitBounds(L.latLngBounds(districts.map((d) => [d.lat, d.lon])), { padding: [24, 24] });
        fittedFor.current = setKey;
      }
    } catch {
      fail();
    }
  }, [districts, view, selectedDistrictEn, locale, t]);

  if (!hasDistricts || failed) return null;

  const chosen = districts.find((d) => d.nameEn === selectedDistrictEn);
  const title = view === "weather" ? t("wmap.title") : t("wmap.whTitle");

  // Weather view: the selected district's week, in words, and the forecast's source
  const days = Array.isArray(chosen?.weather?.dates) ? chosen.weather.dates.length : outlook?.days;
  const chosenTemp = chosen?.weather ? formatNumber(chosen.weather.max_temp, locale, { maximumFractionDigits: 0 }) : null;
  const nextRain = chosen?.weather ? formatWeekday(chosen.weather.next_rain_likely, locale) : null;
  const sourceName = outlook?.source?.name;
  const readOn = formatDate(outlook?.source?.read_at, locale);
  // Warehouses view: the list's date
  const whAsOn = formatDate(warehouses?.source_last_updated, locale);

  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      {canWeather && canWarehouses && (
        <div className="map-switch" role="group" aria-label={t("wmap.switchLabel")}>
          {[
            ["weather", t("wmap.switchWeather")],
            ["warehouses", t("wmap.switchWarehouses")],
          ].map(([key, text]) => (
            <button key={key} type="button" aria-pressed={view === key} onClick={() => setMode(key)}>
              {text}
            </button>
          ))}
        </div>
      )}
      <div ref={boxRef} className="weather-map" role="region" aria-label={title} />

      {view === "weather" ? (
        <>
          <ul className="wmap-legend">
            {KINDS.map((k) => (
              <li key={k}>
                <span className={`wmap-pin wmap-${k} wmap-legend-pin`} aria-hidden="true" />
                {t(KIND_WORD[k])}
              </li>
            ))}
          </ul>
          <p className="card-small">{t("wmap.tempNote")}</p>
          {chosen && chosenTemp && Number.isFinite(chosen.weather.dry_days) && days && (
            <p className="card-text">
              {t("wmap.detail", { district: chosen.name, temp: chosenTemp, dry: chosen.weather.dry_days, days })}{" "}
              {nextRain ? t("wmap.nextRain", { date: nextRain }) : t("wmap.noRain", { days })}
            </p>
          )}
          {(sourceName || readOn) && (
            <p className="card-small">
              {sourceName ? t("common.whereFrom", { source: sourceName }) : ""}
              {sourceName && readOn ? " · " : ""}
              {readOn ? t("weather.readOn", { date: readOn }) : ""}
            </p>
          )}
        </>
      ) : (
        <>
          <ul className="wmap-legend">
            <li>
              <span className="wmap-pin wmap-wh wmap-legend-pin" aria-hidden="true" />
              {t("wmap.whSome")}
            </li>
            <li>
              <span className="wmap-pin wmap-wh-none wmap-legend-pin" aria-hidden="true" />
              {t("wmap.whNone")}
            </li>
          </ul>
          <p className="card-small">{t("wmap.whNote")}</p>
          {chosen && (
            <p className="card-text">
              {t("wmap.whDetail", {
                district: chosen.name,
                count: formatNumber(chosen.wh.count, locale) || "0",
                capacity: formatNumber(chosen.wh.capacity, locale, { maximumFractionDigits: 0 }) || "0",
              })}
            </p>
          )}
          {whAsOn && <p className="card-small">{t("wh.note", { date: whAsOn })}</p>}
          <p className="card-small">{t("common.whereFrom", { source: t("wh.source") })}</p>
        </>
      )}
    </div>
  );
}
