// Cleaning rules for WDRA's public list of registered warehouses (used by scripts/build_wdra.js and the tests).
// Nothing personal leaves this file: a name is kept only when it clearly names an organisation, and an address loses
// "C/o …", "S/o …", "Prop. …" and "Shri/Smt/Mr/Mrs …" parts and is blanked if it still holds a phone-like number.

// A name is kept only if it holds one of these organisation words...
const ORGANISATION = new RegExp(
  "\\b(" +
    [
      "limited", "ltd", "pvt", "private", "corporation", "company", "society", "cooperative", "co-operative",
      "producer", "federation", "apmc", "market committee", "warehousing", "godown", "cold storage", "agro",
      "industries", "logistics", "trust", "samiti", "sangh", "mandal", "parishad", "state",
    ]
      .map((w) => w.replace(/[-\s]/g, "[-\\s]?"))
      .join("|") +
    ")\\b",
  "i"
);
// ...and does not start with a personal title
const PERSONAL_TITLE = /^\s*(shri|shree|sri|smt|mr|mrs|dr)\b\.?/i;
// ...and does not name a proprietor
const PROPRIETOR = /\bprop(rietor)?\b/i;

export function cleanName(name) {
  // a "C/o …" part (care of: often a person) is dropped first, to the end of the name
  const n = typeof name === "string"
    ? name.replace(/\s+/g, " ").replace(/\bc\s*\/\s*o\b.*$/i, "").replace(/[\s,.(-]+$/, "").trim()
    : "";
  return n && ORGANISATION.test(n) && !PERSONAL_TITLE.test(n) && !PROPRIETOR.test(n) ? n : "";
}

// "C/o, S/o, W/o, D/o, H/o …", "Prop. …" and "Shri/Shree/Sri/Sh./Smt/Mr/Mrs …" parts, each up to the next comma. "Sh"
// only before a word: "SH 22" is a state highway.
const PERSON_PARTS = [
  /\b[cswdh]\s*\/\s*o\b\.?[^,]*/gi,
  /\bprop(rietor)?\b\.?[^,]*/gi,
  /\b(shri|shree|sri|smt|mrs|mr)\b\.?\s+[^,]*/gi,
  /\bsh\b\.?\s+(?=[a-z])[^,]*/gi,
];

// 5 or more digits in a row, except a pincode (exactly 6 digits, not starting with 0)
const hasPhoneLikeNumber = (s) => (s.match(/\d{5,}/g) || []).some((run) => !/^[1-9]\d{5}$/.test(run));

export function cleanAddress(address) {
  let a = typeof address === "string" ? address.replace(/\s+/g, " ").trim() : "";
  for (const re of PERSON_PARTS) a = a.replace(re, "");
  a = a
    .replace(/\s*,\s*(,\s*)+/g, ", ")
    .replace(/^[\s,.-]+|[\s,]+$/g, "")
    .trim();
  return a && !hasPhoneLikeNumber(a) ? a : "";
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

// "01-Nov-2029" -> "2029-11-01"; anything else -> ""
export function isoDate(text) {
  const m = typeof text === "string" && text.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m || !MONTHS[m[2].toLowerCase()]) return "";
  return `${m[3]}-${String(MONTHS[m[2].toLowerCase()]).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

// WDRA's own column headings -> the names used below. Only the columns the dashboard needs are named here, so the
// manager's name, the contact number and the remarks are never picked up.
const WDRA_COLUMNS = {
  warehouse_id: "WH ID",
  warehouse_name: "WH Name",
  address: "Address",
  district: "District",
  state: "State",
  capacity_mt: "Capacity(in MT)",
  registration_valid_upto: "Registration Valid Upto",
  status: "Status",
};
const field = (row, name) => row[name] ?? row[WDRA_COLUMNS[name]];

// One CSV row (either heading style) -> one warehouse for the dashboard (only these fields)
export function toWarehouse(row) {
  const capacity = Number(String(field(row, "capacity_mt") || "").replace(/,/g, ""));
  return {
    id: String(field(row, "warehouse_id") || "").trim(),
    name: cleanName(field(row, "warehouse_name")),
    address: cleanAddress(field(row, "address")),
    district: String(field(row, "district") || "").trim(),
    state: String(field(row, "state") || "").trim(),
    capacity_mt: Number.isFinite(capacity) ? capacity : null,
    valid_upto: isoDate(field(row, "registration_valid_upto")),
    status: String(field(row, "status") || "").trim(),
  };
}
