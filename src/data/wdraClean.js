// Cleaning rules for WDRA's public list of registered warehouses (used by scripts/build_wdra.js and the tests).
// Nothing personal leaves this file: a name is kept only when it clearly names an organisation, and an address loses
// "C/o …" and "Shri/Smt/Mr/Mrs …" parts and is blanked if it still holds a phone-like number.

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
const PERSONAL_TITLE = /^\s*(shri|smt|mr|mrs|dr)\b\.?/i;

export function cleanName(name) {
  const n = typeof name === "string" ? name.replace(/\s+/g, " ").trim() : "";
  return n && ORGANISATION.test(n) && !PERSONAL_TITLE.test(n) ? n : "";
}

// "C/o …" and "Shri/Smt/Mr/Mrs …" parts, each up to the next comma
const PERSON_PARTS = [/\bc\s*\/\s*o\b\.?[^,]*/gi, /\b(shri|smt|mrs|mr)\b\.?\s+[^,]*/gi];

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

// One CSV row -> one warehouse for the dashboard (only these fields)
export function toWarehouse(row) {
  const capacity = Number(String(row.capacity_mt || "").replace(/,/g, ""));
  return {
    id: String(row.warehouse_id || "").trim(),
    name: cleanName(row.warehouse_name),
    address: cleanAddress(row.address),
    district: String(row.district || "").trim(),
    state: String(row.state || "").trim(),
    capacity_mt: Number.isFinite(capacity) ? capacity : null,
    valid_upto: isoDate(row.registration_valid_upto),
    status: String(row.status || "").trim(),
  };
}
