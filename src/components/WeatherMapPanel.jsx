import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatDate, formatNumber, formatWeekday } from "../i18n/format";
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL } from "../config/mapTiles";

// "What is the weather in each district?": one small pin per district at its centre, its shape and fill saying the
// week's weather (dry / maybe rain / rain), built from the backend's /weather/outlook; its details show on hover, and
// the selected district's pin is bigger, with a label. Positions and the
// district names (shown, and English for the backend) come from /places/map; the two are matched by English name.
// The selected district is highlighted; clicking a bubble chooses that district. With no data, or if the map cannot
// be drawn, the card is hidden.

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

export default function WeatherMapPanel({ outlook, mapData, selectedDistrictEn, onSelectDistrict }) {
  const { locale } = useLanguage();
  const t = useT();
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const fittedFor = useRef(null);
  const [failed, setFailed] = useState(false);
  // A map that cannot be drawn hides the card. Reported after the effect, not inside it.
  const fail = () => queueMicrotask(() => setFailed(true));

  // One entry per district that has both a position and a weather line
  const districts = useMemo(() => {
    const weatherByName = new Map((outlook?.districts || []).map((w) => [w?.name, w]));
    return (mapData?.points || [])
      .map((p) => {
        const w = weatherByName.get(p?.name_en);
        const lat = Number(p?.lat);
        const lon = Number(p?.lon);
        if (!w || !p?.name_en || !isFinite(lat) || !isFinite(lon)) return null;
        return { nameEn: p.name_en, name: p.district || p.name_en, lat, lon, weather: w, kind: kindOf(w) };
      })
      .filter(Boolean);
  }, [outlook, mapData]);

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

  // The bubbles, redrawn when the data, the selection or the language changes
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    try {
      layer.clearLayers();
      for (const d of districts) {
        const selected = d.nameEn === selectedDistrictEn;
        const size = selected ? PIN_SELECTED : PIN;
        const temp = formatNumber(d.weather.max_temp, locale, { maximumFractionDigits: 0 });
        const word = d.kind ? t(KIND_WORD[d.kind]) : "";
        // The pin, and beside it the week's highest temperature (the selected district has its full label instead)
        const html =
          `<div class="wmap-pin ${d.kind ? `wmap-${d.kind}` : ""} ${selected ? "wmap-selected" : ""}"></div>` +
          (temp && !selected ? `<span class="wmap-temp">${escapeHtml(temp)}°</span>` : "");
        const label = t("wmap.bubbleTitle", { district: d.name, temp: temp || "", word });
        const marker = L.marker([d.lat, d.lon], {
          icon: L.divIcon({
            className: "wmap-icon",
            html,
            iconSize: [size, Math.round(size * 1.25)],
            iconAnchor: [size / 2, Math.round(size / 2 + size * 0.71)], // the pin's tip on the district's centre
          }),
          title: label,
          alt: d.name,
          keyboard: true,
          zIndexOffset: selected ? 1000 : 0,
        });
        marker.on("click", () => onSelectDistrict?.(d.nameEn));
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
      // Fit the view to all the districts once per set of districts (not on every selection)
      const setKey = districts.map((d) => d.nameEn).join("|");
      if (fittedFor.current !== setKey) {
        map.fitBounds(L.latLngBounds(districts.map((d) => [d.lat, d.lon])), { padding: [24, 24] });
        fittedFor.current = setKey;
      }
    } catch {
      fail();
    }
  }, [districts, selectedDistrictEn, locale, t, onSelectDistrict]);

  if (!hasDistricts || failed) return null;

  // The selected district's week, in words, under the map (bubbles are small on a phone)
  const chosen = districts.find((d) => d.nameEn === selectedDistrictEn);
  const days = Array.isArray(chosen?.weather?.dates) ? chosen.weather.dates.length : outlook?.days;
  const chosenTemp = chosen ? formatNumber(chosen.weather.max_temp, locale, { maximumFractionDigits: 0 }) : null;
  const nextRain = chosen ? formatWeekday(chosen.weather.next_rain_likely, locale) : null;

  const sourceName = outlook?.source?.name;
  const readOn = formatDate(outlook?.source?.read_at, locale);

  return (
    <div className="card">
      <h3 className="card-title">{t("wmap.title")}</h3>
      <div ref={boxRef} className="weather-map" role="region" aria-label={t("wmap.title")} />
      <ul className="wmap-legend">
        {KINDS.map((k) => (
          <li key={k}>
            <span className={`wmap-pin wmap-${k} wmap-legend-pin`} aria-hidden="true" />
            {t(KIND_WORD[k])}
          </li>
        ))}
      </ul>
      <p className="card-small">{t("wmap.tempNote")}</p>
      <p className="card-small">{t("wmap.hint")}</p>
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
    </div>
  );
}
