// The one place the dashboard talks to the backend (src/data_adapter/aiaicApi.js): what it sends, how it reads the
// answers, and what happens when a call fails or an answer is not what it expects. `fetch` is a stand-in here.
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const BASE = "https://backend.test/api";
const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status) => ({ ok: false, status, json: async () => ({}) });

let api;
let fetchMock;
beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("VITE_AIAIC_API", BASE + "/"); // a trailing slash is dropped
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  api = await import("../data_adapter/aiaicApi");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const calledUrl = (i = 0) => new URL(fetchMock.mock.calls[i][0]);

test("no backend address set: every call fails with a clear message, and nothing is fetched", async () => {
  vi.resetModules();
  vi.stubEnv("VITE_AIAIC_API", "");
  const bare = await import("../data_adapter/aiaicApi");
  await expect(bare.fetchDistricts("teststate")).rejects.toThrow("VITE_AIAIC_API is not set");
  expect(fetchMock).not.toHaveBeenCalled();
});

test("a failed call: the path and the status, for every route", async () => {
  fetchMock.mockResolvedValue(fail(503));
  await expect(api.fetchDistricts("teststate")).rejects.toThrow("/places/districts 503");
  await expect(api.fetchCrops("teststate", "Home")).rejects.toThrow("/places/crops 503");
  await expect(api.fetchDistrictView({ state: "teststate", district: "Home", crop: "grain" })).rejects.toThrow("/view/unified 503");
  await expect(api.fetchWeatherForecast({ state: "teststate", district: "Home" })).rejects.toThrow("/weather/forecast 503");
  await expect(api.fetchWeatherOutlook({ state: "teststate" })).rejects.toThrow("/weather/outlook 503");
  await expect(api.fetchPlacesMap({ state: "teststate" })).rejects.toThrow("/places/map 503");
  await expect(api.fetchEnamMandis({ state: "teststate", district: "Home" })).rejects.toThrow("/places/enam-mandis 503");
  await expect(api.fetchSoilMoisture({ state: "teststate", district: "Home" })).rejects.toThrow("/places/soil-moisture 503");
  await expect(api.fetchServedStates()).rejects.toThrow("/catalog 503");
  await expect(api.fetchBackendLanguages()).rejects.toThrow("/openapi.json 503");
});

test("no network: the error is passed on, not hidden", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(api.fetchDistricts("teststate")).rejects.toThrow("Failed to fetch");
});

test("an answer that is not JSON: the error is passed on", async () => {
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError("Unexpected token <"); } });
  await expect(api.fetchServedStates()).rejects.toThrow("Unexpected token");
});

test("what is sent: one base address, the skip-warning header, and no empty parameters", async () => {
  fetchMock.mockResolvedValue(ok({}));
  await api.fetchWeatherForecast({ state: "teststate", district: "Home", lang: "mr" });
  const url = calledUrl();
  expect(url.origin + url.pathname).toBe(BASE + "/weather/forecast");
  expect(Object.fromEntries(url.searchParams)).toEqual({ district: "Home", state: "teststate", lang: "mr" });
  expect(fetchMock.mock.calls[0][1]).toEqual({ headers: { "ngrok-skip-browser-warning": "true" } });

  await api.fetchPlacesMap({ state: "teststate", crop: "" }); // empty crop is not sent
  expect(Object.fromEntries(calledUrl(1).searchParams)).toEqual({ state: "teststate", lang: "en" });
  await api.fetchWeatherOutlook({ state: "teststate" }); // the outlook is always read in English
  expect(calledUrl(2).searchParams.get("lang")).toBe("en");
  await api.fetchDistrictView({ state: "teststate", district: "Home", crop: "grain" });
  expect(Object.fromEntries(calledUrl(3).searchParams)).toEqual({ crop: "grain", region: "Home", state: "teststate", lang: "en" });
  await api.fetchEnamMandis({ state: "teststate", district: "Home" });
  await api.fetchSoilMoisture({ state: "teststate", district: "Home" });
  expect([calledUrl(4).pathname, calledUrl(5).pathname]).toEqual(["/api/places/enam-mandis", "/api/places/soil-moisture"]);
});

test("districts: a missing name falls back to the English name or the key; no list gives an empty list", async () => {
  fetchMock.mockResolvedValueOnce(ok({ districts: [{ key: "a", name: "अ", name_en: "A" }, { key: "b", name_en: "B" }, { key: "c" }] }));
  expect(await api.fetchDistricts("teststate", "mr")).toEqual([
    { key: "a", name: "अ", name_en: "A" },
    { key: "b", name: "B", name_en: "B" },
    { key: "c", name: "c", name_en: "c" },
  ]);
  fetchMock.mockResolvedValueOnce(ok({}));
  expect(await api.fetchDistricts("teststate")).toEqual([]);
});

test("crops: in the first page's order; a crop with no details keeps its key; no list gives an empty list", async () => {
  fetchMock.mockResolvedValueOnce(
    ok({ first_page: ["grain", "pulse"], crops: [{ crop: "grain", name: "धान्य", name_en: "Grain", basis: "grown_in_district" }, { crop: "other" }] })
  );
  expect(await api.fetchCrops("teststate", "Home", "mr")).toEqual([
    { key: "grain", name: "धान्य", name_en: "Grain", basis: "grown_in_district" },
    { key: "pulse", name: "pulse", name_en: "pulse", basis: null },
  ]);
  fetchMock.mockResolvedValueOnce(ok({}));
  expect(await api.fetchCrops("teststate", "Home")).toEqual([]);
});

test("the district view: each service's items with their summary; a missing answer gives an empty view", async () => {
  fetchMock.mockResolvedValueOnce(
    ok({ services: { market: [{ intelligence: { recommendation: "SELL" }, summary: { action: { text: "Sell" } } }, {}], water: null }, na_reasons: { weather: { text: "No" } } })
  );
  expect(await api.fetchDistrictView({ state: "teststate", district: "Home", crop: "grain" })).toEqual({
    market: [{ recommendation: "SELL", summary: { action: { text: "Sell" } } }, { summary: null }],
    water: [],
    na_reasons: { weather: { text: "No" } },
  });
  expect(api.toDistrictView(null)).toEqual({ na_reasons: {} });
});

test("a service whose answer is not a list, or an item that is not an object: that service has no answer, the others stay", async () => {
  fetchMock.mockResolvedValueOnce(
    ok({ services: { market: "not a list", water: [null, 7, { intelligence: { recommendation: "OK" } }], crop: {} } })
  );
  expect(await api.fetchDistrictView({ state: "teststate", district: "Home", crop: "grain" })).toEqual({
    market: [],
    water: [{ recommendation: "OK", summary: null }],
    crop: [],
    na_reasons: {},
  });
  expect(api.toDistrictView({ services: "not a map" })).toEqual({ na_reasons: {} });
});

test("served states: only non-empty names; anything else gives an empty list", async () => {
  fetchMock.mockResolvedValueOnce(ok({ states: { served: ["teststate", "", 7, null, "other state"] } }));
  expect(await api.fetchServedStates()).toEqual(["teststate", "other state"]);
  fetchMock.mockResolvedValueOnce(ok({ states: { served: "teststate" } }));
  expect(await api.fetchServedStates()).toEqual([]);
  fetchMock.mockResolvedValueOnce(ok(null));
  expect(await api.fetchServedStates()).toEqual([]);
});

test("backend languages: from the parameter's list, else from its description; none found gives an empty list", async () => {
  const spec = (parameters) => ({ paths: { "/a": { get: { parameters } }, "/b": { post: {} } } });
  fetchMock.mockResolvedValueOnce(ok(spec([{ name: "lang", schema: { anyOf: [{ enum: ["en", "hi", 3] }, { type: "null" }] } }, { name: "crop" }])));
  expect(await api.fetchBackendLanguages()).toEqual(["en", "hi"]);

  fetchMock.mockResolvedValueOnce(ok(spec([{ name: "lang", description: "Summary language: en (default) | hi | mr." }])));
  expect(await api.fetchBackendLanguages()).toEqual(["en", "hi", "mr"]);

  fetchMock.mockResolvedValueOnce(ok(spec([{ name: "lang", schema: { description: "en | gu" } }])));
  expect(await api.fetchBackendLanguages()).toEqual(["en", "gu"]);

  fetchMock.mockResolvedValueOnce(ok(spec([{ name: "lang", description: "Any language" }])));
  expect(await api.fetchBackendLanguages()).toEqual([]);
  fetchMock.mockResolvedValueOnce(ok({}));
  expect(await api.fetchBackendLanguages()).toEqual([]);
});

test("a fixed band: found on any case item, otherwise none", () => {
  expect(api.fixedBandOf({ sections: [{ items: [null, { data: {} }] }, { items: [{ data: { fixed_band: "plus_minus_2_pct" } }] }] })).toBe(
    "plus_minus_2_pct"
  );
  expect(api.fixedBandOf({ sections: [{}] })).toBeNull();
  expect(api.fixedBandOf(null)).toBeNull();
});
