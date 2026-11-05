// WDRA's list for more than one state: either heading style is read, personal columns are never written, and each
// state has its own list date. Made-up names and places only, except the check of the built file itself.
import { expect, test } from "vitest";
import { cleanAddress, cleanName, toWarehouse } from "../data/wdraClean";
import { listDate, warehouseCountsByDistrict, warehousesNear } from "../data/warehousesNear";
import WDRA from "../data/wdra_warehouses.json";

const wdraRow = {
  "WHM Name": "Test Manager",
  "WH Name": "Testland Agro Pvt Ltd",
  "WH ID": "123",
  Address: "Gat 1, Testville",
  District: "Home",
  State: "Teststate",
  "Capacity(in MT)": "1,000",
  "Registration Date": "01-Jan-2020",
  "Registration Valid Upto": "01-Nov-2029",
  "Contact No.": "9876543210",
  Status: "Active",
  Remarks: "Test remark",
};

test("WDRA's own headings give the same warehouse, and the personal columns are not written", () => {
  const w = toWarehouse(wdraRow);
  expect(w).toEqual({
    id: "123",
    name: "Testland Agro Pvt Ltd",
    address: "Gat 1, Testville",
    district: "Home",
    state: "Teststate",
    capacity_mt: 1000,
    valid_upto: "2029-11-01",
    status: "Active",
  });
  const written = JSON.stringify(w);
  for (const personal of ["Test Manager", "9876543210", "Test remark"]) expect(written).not.toContain(personal);
});

test("a person's name in an address or a name is removed, in every form", () => {
  expect(cleanAddress("S/o Test Person, Gat 1, Testville")).toBe("Gat 1, Testville");
  expect(cleanAddress("W/O Test Person, Testville")).toBe("Testville");
  expect(cleanAddress("Gat 1, Prop. Test Person, Testville")).toBe("Gat 1, Testville");
  expect(cleanAddress("Sh. Test Person, Testville")).toBe("Testville");
  expect(cleanAddress("Shree Test Person, Testville")).toBe("Testville");
  expect(cleanName("Shree Test Agro")).toBe("");
  expect(cleanName("Test Agro Prop. Test Person")).toBe("");
  // "C/o" in a name: everything from it is dropped, then the rest must still name an organisation
  expect(cleanName("Testland Agro Pvt Ltd C/O Test Person")).toBe("Testland Agro Pvt Ltd");
  expect(cleanName("Test Warehouse, c/o. Testland Warehousing Corporation")).toBe("");
  expect(cleanName("C/O Shri Test Person")).toBe("");
});

test("the built file: no 'C/o', 'S/o', 'W/o', 'D/o', 'H/o' or 'Prop' part in any name or address", () => {
  const marker = /\b([cswdh]\s*\/\s*o|prop(rietor)?)\b/i;
  for (const w of WDRA.warehouses) {
    expect(marker.test(w.name)).toBe(false);
    expect(marker.test(w.address)).toBe(false);
  }
});

test("a road or a land-record word in an address stays", () => {
  expect(cleanAddress("SH 22, PH No 5, Testville")).toBe("SH 22, PH No 5, Testville");
});

test("each state has its own list date; a state without one has none", () => {
  const data = { lists: [{ state: "One State", source_last_updated: "2026-10-21" }, { state: "Two State", source_last_updated: "" }] };
  expect(listDate(data, "one state")).toBe("2026-10-21");
  expect(listDate(data, "two state")).toBe("");
  expect(listDate(data, "other")).toBe("");
});

test("the built file: every state listed once, only the allowed fields, states kept apart", () => {
  const states = [...new Set(WDRA.warehouses.map((w) => w.state))];
  expect(WDRA.lists.map((l) => l.state).sort()).toEqual([...states].sort());
  expect(new Set(WDRA.warehouses.map((w) => w.id)).size).toBe(WDRA.warehouses.length);
  const allowed = "address,capacity_mt,district,id,name,state,status,valid_upto";
  for (const w of WDRA.warehouses) expect(Object.keys(w).sort().join(",")).toBe(allowed);
  const today = "2026-10-31";
  for (const state of states) {
    const { covered, counts } = warehouseCountsByDistrict({ list: WDRA.warehouses, stateName: state, today });
    expect(covered).toBe(true);
    expect(counts.size).toBeGreaterThan(0);
    const [district] = WDRA.warehouses.filter((w) => w.state === state && w.status === "Active").map((w) => w.district);
    const near = warehousesNear({ list: WDRA.warehouses, stateName: state, districtEn: district, today });
    expect(near.every((w) => w.state === state)).toBe(true);
  }
});
