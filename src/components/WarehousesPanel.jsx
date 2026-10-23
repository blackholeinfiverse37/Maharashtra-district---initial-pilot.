import { useState } from "react";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { formatDate, formatNumber } from "../i18n/format";
import { warehousesNear } from "../data/warehousesNear";
import WDRA from "../data/wdra_warehouses.json";

// "Warehouses in and near your district": WDRA's public list of registered warehouses (built into the page by
// scripts/build_wdra.js), only Active ones still valid today, in the farmer's own district first and then in districts
// within 150 km (straight line between AIAIC's district centres, as for the mandis). Names and addresses are shown as
// listed, never translated; a name that is not clearly an organisation was emptied by the build and shows as
// "Warehouse at <address>".

const FIRST = 5; // shown at once
const MOST = 10; // the nearest 10 only; the rest are not listed

// `districtNames` maps an English district name to the name to show (the same names as the dropdown).
export default function WarehousesPanel({ stateName, districtEn, mapData, districtNames, data = WDRA, today }) {
  const { locale } = useLanguage();
  const t = useT();
  const [open, setOpen] = useState(false);
  if (!districtEn || !stateName) return null;

  const found = warehousesNear({ list: data?.warehouses, stateName, districtEn, mapData, today }).slice(0, MOST);
  const shown = open ? found : found.slice(0, FIRST);
  const asOn = formatDate(data?.source_last_updated, locale);

  return (
    <div className="card">
      <h3 className="card-title">{t("wh.title")}</h3>
      {found.length === 0 ? (
        <p className="card-text">{t("wh.none")}</p>
      ) : (
        <>
          <ol className="mandi-list">
            {shown.map((w) => {
              const capacity = formatNumber(w.capacity_mt, locale, { maximumFractionDigits: 0 });
              const valid = formatDate(w.valid_upto, locale);
              const km = formatNumber(w.km, locale, { maximumFractionDigits: 0 });
              // own district: its name only; other districts: the distance too
              const distance = !w.local && km ? t("wh.aboutKm", { km }) : null;
              const title = w.name || (w.address ? t("wh.at", { address: w.address }) : t("wh.noName"));
              return (
                <li key={w.id} className="mandi-row wh-row">
                  <p className="mandi-name">{title}</p>
                  {w.name && w.address && <p className="card-text">{w.address}</p>}
                  {capacity && <p className="card-text">{t("wh.capacity", { capacity })}</p>}
                  {valid && <p className="card-text">{t("wh.validUpto", { date: valid })}</p>}
                  <p className="card-small">
                    {[w.district ? t("top5.place", { district: districtNames?.[w.district] || w.district }) : null, distance]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              );
            })}
          </ol>
          {found.length > FIRST && (
            <button type="button" className="link-button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? t("wh.showLess") : t("wh.showMore", { n: found.length - FIRST })}
            </button>
          )}
        </>
      )}
      {asOn && <p className="card-small">{t("wh.note", { date: asOn })}</p>}
      <p className="card-small">{t("common.whereFrom", { source: t("wh.source") })}</p>
    </div>
  );
}
