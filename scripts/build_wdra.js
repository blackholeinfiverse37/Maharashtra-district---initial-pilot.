// Builds src/data/wdra_warehouses.json from the WDRA registered-warehouse CSVs (kept outside the repository).
//
//   node scripts/build_wdra.js [path/to/one.csv path/to/two.csv ...]
//
// Only these fields are written: id, name, address, district, state, capacity_mt, valid_upto, status, plus each state's
// download_date and source_last_updated once at the top (`lists`; empty when the file does not give them). Names and
// addresses are cleaned by src/data/wdraClean.js (no person's name, contact number or manager name is written).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { toWarehouse } from "../src/data/wdraClean.js";

const here = dirname(fileURLToPath(import.meta.url));
const CSV_FOLDER = resolve(here, "..", "..");
const inputs =
  process.argv.length > 2
    ? process.argv.slice(2)
    : ["wdra_warehouses.csv", "registered-wh-public - WDRA.csv"].map((file) => resolve(CSV_FOLDER, file));
const output = resolve(here, "..", "src", "data", "wdra_warehouses.json");

// A small CSV reader: quoted fields, doubled quotes, commas and line breaks inside quotes
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  const [head, ...body] = rows.filter((r) => r.some((v) => v !== ""));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ""])));
}

const rows = inputs.flatMap((file) => parseCsv(readFileSync(file, "utf8").replace(/^\uFEFF/, "")));
const warehouses = rows.map(toWarehouse).filter((w) => w.id);
const lists = [...new Set(warehouses.map((w) => w.state))].map((state) => {
  const first = rows.find((r) => toWarehouse(r).state === state);
  return { state, download_date: first.download_date || "", source_last_updated: first.source_last_updated || "" };
});
const out = {
  lists,
  source: "WDRA (Warehousing Development and Regulatory Authority), public list of registered warehouses",
  warehouses,
};
writeFileSync(output, JSON.stringify(out, null, 1) + "\n", "utf8");

for (const { state } of lists) {
  const written = warehouses.filter((w) => w.state === state);
  const kept = written.filter((w) => w.name).length;
  console.log(`${state}: warehouses written: ${written.length}`);
  console.log(`  names kept: ${kept}; names blanked: ${written.length - kept}`);
  console.log(`  addresses blanked (phone-like number, or only a person's name): ${written.filter((w) => !w.address).length}`);
}
console.log(`rows read: ${rows.length}; without a warehouse id, dropped: ${rows.length - warehouses.length}`);
console.log(`written: ${output}`);
