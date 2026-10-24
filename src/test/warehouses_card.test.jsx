// The warehouse card ("Warehouses in and near your district") and the cleaning of WDRA's list behind it.
// Made-up places and people only: the card must work for any state and district in the file.
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import WarehousesPanel from "../components/WarehousesPanel";
import { cleanAddress, cleanName, toWarehouse } from "../data/wdraClean";
import { LanguageContext } from "../i18n/LanguageContext";
import { languageByCode } from "../i18n/languages";
import en from "../i18n/strings/en";
import mr from "../i18n/strings/mr";

afterEach(cleanup);

const inLanguage = (code, element) => {
  const l = languageByCode(code);
  return (
    <LanguageContext.Provider
      value={{ lang: code, apiLang: code, locale: l.locale, dir: l.dir, showsEnglishNote: false, selectable: [l], setLanguage() {} }}
    >
      {element}
    </LanguageContext.Provider>
  );
};

// District centres as AIAIC's /places/map gives them: Home, Near (about 56 km away) and Far (about 330 km away)
const mapData = {
  points: [
    { key: "home", name_en: "Home", lat: 20.0, lon: 76.0 },
    { key: "near", name_en: "Near", lat: 20.5, lon: 76.0 },
    { key: "far", name_en: "Far", lat: 23.0, lon: 76.0 },
  ],
};
const TODAY = "2026-10-24";
const row = (id, extra) => ({
  warehouse_id: id,
  warehouse_name: "Testgaon Agro Producer Company Ltd",
  address: "Gat No 12, Testgaon",
  district: "Home",
  state: "Teststate",
  capacity_mt: "1,500",
  registration_valid_upto: "01-Nov-2029",
  status: "Active",
  ...extra,
});
const data = (rows) => ({ source_last_updated: "2026-10-21", warehouses: rows.map(toWarehouse) });

test("only Active warehouses still valid today show, own district first, nearby next, far ones never", () => {
  const list = data([
    row("1", { warehouse_name: "Valid Home Warehousing Pvt Ltd" }),
    row("2", { warehouse_name: "Expired Home Warehousing Pvt Ltd", registration_valid_upto: "01-Jan-2026" }),
    row("3", { warehouse_name: "Inactive Home Warehousing Pvt Ltd", status: "Inactive" }),
    row("4", { warehouse_name: "Suspended Home Warehousing Pvt Ltd", status: "Suspended" }),
    row("5", { warehouse_name: "Near Agro Industries Ltd", district: "Near" }),
    row("6", { warehouse_name: "Far Agro Industries Ltd", district: "Far" }),
    row("7", { warehouse_name: "Other State Agro Industries Ltd", state: "Otherstate" }),
    row("8", { warehouse_name: "Valid Today Warehousing Pvt Ltd", registration_valid_upto: "24-Oct-2026" }),
  ]);
  const { container } = render(
    inLanguage("en", <WarehousesPanel stateName="teststate" districtEn="Home" mapData={mapData} data={list} today={TODAY} />)
  );
  const names = [...container.querySelectorAll(".mandi-name")].map((n) => n.textContent);
  expect(names.slice(0, 2).sort()).toEqual(["Valid Home Warehousing Pvt Ltd", "Valid Today Warehousing Pvt Ltd"]);
  expect(names[2]).toBe("Near Agro Industries Ltd");
  expect(names).toHaveLength(3);
  expect(container.textContent).not.toContain("in your district");
  expect(container.textContent).toContain("about 56 km (straight line)");
  expect(container.textContent).toContain("Capacity: 1,500 tonnes");
  expect(container.textContent).toContain("Registration valid until: 1 Nov 2029");
  expect(container.textContent).toContain("Registered warehouses as on 21 Oct 2026. Check with the warehouse before you store.");
  expect(container.textContent).toContain("WDRA (Warehousing Development and Regulatory Authority)");
});

test("no phone number, manager name or person's name gets through", () => {
  // the build's rules
  expect(cleanName("Shri Ramesh Testkar")).toBe("");
  expect(cleanName("Dr. Testkar Agro Pvt Ltd")).toBe("");
  expect(cleanName("Ramesh Testkar")).toBe("");
  expect(cleanName("APMC Testgaon")).toBe("APMC Testgaon");
  expect(cleanAddress("C/o Ramesh Testkar, Gat No 12, Testgaon")).toBe("Gat No 12, Testgaon");
  expect(cleanAddress("Gat No 12, Shri Ramesh Testkar, Testgaon 431001")).toBe("Gat No 12, Testgaon 431001");
  expect(cleanAddress("Gat No 12, Testgaon, Mob 9876543210")).toBe("");
  expect(cleanAddress("Gat No 12, Testgaon, Ph 02345")).toBe("");

  // and the card, from a raw row that carries all of them
  const list = data([
    row("9", {
      warehouse_name: "Shri Ramesh Testkar",
      address: "C/o Ramesh Testkar, Mr Suresh Testkar, Gat No 12, Testgaon, 9876543210",
      manager_name: "Suresh Testkar",
      contact_no: "9876543210",
    }),
  ]);
  expect(Object.keys(list.warehouses[0])).toEqual(["id", "name", "address", "district", "state", "capacity_mt", "valid_upto", "status"]);
  const { container } = render(
    inLanguage("en", <WarehousesPanel stateName="Teststate" districtEn="Home" mapData={mapData} data={list} today={TODAY} />)
  );
  expect(container.textContent).not.toMatch(/Ramesh|Suresh|Testkar|9876543210|\d{7,}/);
  expect(container.textContent).toContain(en["wh.noName"]);
});

test("a name that is not clearly an organisation shows as 'Warehouse at <address>', in the chosen language", () => {
  const list = data([row("10", { warehouse_name: "Testkar Krupa", address: "Survey No 5, Testgaon" })]);
  render(inLanguage("en", <WarehousesPanel stateName="Teststate" districtEn="Home" mapData={mapData} data={list} today={TODAY} />));
  expect(screen.getByText("Warehouse at Survey No 5, Testgaon")).toBeTruthy();
  expect(document.body.textContent).not.toContain("Testkar Krupa");
  cleanup();
  render(inLanguage("mr", <WarehousesPanel stateName="Teststate" districtEn="Home" mapData={mapData} data={list} today={TODAY} />));
  expect(screen.getByText(mr["wh.at"].replace("{address}", "Survey No 5, Testgaon"))).toBeTruthy();
});

test("five first, the rest behind 'show more'", () => {
  const list = data(Array.from({ length: 7 }, (_, i) => row(String(100 + i), { warehouse_name: `Unit ${i} Agro Ltd` })));
  const { container } = render(
    inLanguage("en", <WarehousesPanel stateName="Teststate" districtEn="Home" mapData={mapData} data={list} today={TODAY} />)
  );
  expect(container.querySelectorAll(".mandi-row")).toHaveLength(5);
  fireEvent.click(screen.getByText("Show more"));
  expect(container.querySelectorAll(".mandi-row")).toHaveLength(7);
});

test("only the nearest 10: own district first, then the closest nearby ones", () => {
  const list = data([
    ...Array.from({ length: 8 }, (_, i) => row(String(200 + i), { warehouse_name: `Home ${i} Agro Ltd`, capacity_mt: String(1000 + i) })),
    ...Array.from({ length: 6 }, (_, i) => row(String(300 + i), { warehouse_name: `Near ${i} Agro Ltd`, district: "Near" })),
  ]);
  const { container } = render(
    inLanguage("en", <WarehousesPanel stateName="Teststate" districtEn="Home" mapData={mapData} data={list} today={TODAY} />)
  );
  fireEvent.click(screen.getByText("Show more"));
  const names = [...container.querySelectorAll(".mandi-name")].map((n) => n.textContent);
  expect(names).toHaveLength(10);
  expect(names.filter((n) => n.startsWith("Home"))).toHaveLength(8);
  expect(names.slice(8).every((n) => n.startsWith("Near"))).toBe(true);
});

test("none in or near the district: one plain line", () => {
  const list = data([
    row("11", { status: "Inactive" }),
    row("12", { district: "Far" }),
    row("13", { registration_valid_upto: "01-Jan-2020" }),
  ]);
  const { container } = render(
    inLanguage("en", <WarehousesPanel stateName="Teststate" districtEn="Home" mapData={mapData} data={list} today={TODAY} />)
  );
  expect(container.querySelectorAll(".mandi-row")).toHaveLength(0);
  expect(screen.getByText("No active registered warehouse is listed in or near this district.")).toBeTruthy();
});
