// The district map: a switch between the weather view and the warehouses view; clicking a pin changes nothing.
// Made-up districts and warehouses only.
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import WeatherMapPanel from "../components/WeatherMapPanel";

afterEach(cleanup);

const mapData = {
  points: [
    { key: "home", name_en: "Home", district: "Home", lat: 20.0, lon: 76.0 },
    { key: "near", name_en: "Near", district: "Near", lat: 20.5, lon: 76.5 },
  ],
};
const outlook = {
  days: 7,
  districts: [
    { name: "Home", max_temp: 31.4, dry_days: 7, rain_likely_days: 0, some_chance_days: 0, dates: Array(7).fill("2026-10-24") },
    { name: "Near", max_temp: 33.2, dry_days: 5, rain_likely_days: 2, some_chance_days: 0, dates: Array(7).fill("2026-10-24") },
  ],
  source: { name: "Testcast", read_at: "2026-10-24T06:00:00+00:00" },
};
const wh = (id, district, extra = {}) => ({
  id, name: "", address: "Gat 1", district, state: "Teststate", capacity_mt: 1000, valid_upto: "2099-01-01", status: "Active", ...extra,
});
const warehouses = {
  source_last_updated: "2026-10-21",
  warehouses: [wh("1", "Home"), wh("2", "Home"), wh("3", "Home", { status: "Inactive" }), wh("4", "Home", { valid_upto: "2020-01-01" })],
};

const pinTexts = (container) =>
  [...container.querySelectorAll(".leaflet-marker-icon")].map((m) => m.getAttribute("title"));

test("weather first; the switch shows the warehouses view, counting only active, valid warehouses", () => {
  const { container } = render(
    <WeatherMapPanel outlook={outlook} mapData={mapData} selectedDistrictEn="Near" warehouses={warehouses} stateName="teststate" />
  );
  expect(screen.getByText("What is the weather in each district?")).toBeTruthy();
  expect(pinTexts(container)).toContain("Home: highest 31°C, Dry");

  fireEvent.click(screen.getByText("Warehouses"));
  expect(screen.getByText("Where are the registered warehouses?")).toBeTruthy();
  expect(pinTexts(container)).toEqual(["Home: 2 registered warehouses, 2,000 tonnes", "Near: 0 registered warehouses, 0 tonnes"]);
  expect(container.querySelector(".wmap-wh")).toBeTruthy(); // Home: solid pin
  expect(container.querySelector(".wmap-wh-none")).toBeTruthy(); // Near: hollow pin
  expect(screen.getByText("Near: 0 active registered warehouses, 0 tonnes in all.")).toBeTruthy();

  fireEvent.click(screen.getByText("Weather"));
  expect(screen.getByText("What is the weather in each district?")).toBeTruthy();
});

test("clicking a pin changes nothing", () => {
  const { container } = render(
    <WeatherMapPanel outlook={outlook} mapData={mapData} selectedDistrictEn="Near" warehouses={warehouses} stateName="Teststate" />
  );
  const before = container.innerHTML;
  for (const pin of container.querySelectorAll(".leaflet-marker-icon")) fireEvent.click(pin);
  expect(container.innerHTML).toBe(before);
  expect(screen.queryByText(/Tap a pin/)).toBeNull();
});

test("a state the warehouse list does not cover: no switch, no zeros", () => {
  render(<WeatherMapPanel outlook={outlook} mapData={mapData} selectedDistrictEn="Near" warehouses={warehouses} stateName="Otherstate" />);
  expect(screen.queryByText("Warehouses")).toBeNull();
  expect(screen.getByText("What is the weather in each district?")).toBeTruthy();
});
