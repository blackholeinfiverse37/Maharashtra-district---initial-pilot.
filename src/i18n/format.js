// Dates and numbers in the chosen language's own format, via Intl: month and day names in that language, but always
// Latin digits (0-9), the same digits the backend's own sentences use. Anything that is not a valid date or number
// gives null, so a card never prints "undefined", "null" or "NaN".

// "mr-IN" -> "mr-IN-u-nu-latn": the language's words, Latin digits
const latn = (locale) => `${locale || "en-IN"}-u-nu-latn`;

// "2021-03-31" is read as that local day (read as UTC it would show the day before west of Greenwich);
// "2025-03-31T00:00:00" and other full timestamps are read as they are.
const toDate = (value) => {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" || !value) return null;
  const day = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

// "21 Oct 2026" (or "21 October 2026" with month: "long")
export function formatDate(value, locale, { month = "short" } = {}) {
  const d = toDate(value);
  if (!d) return null;
  try {
    return new Intl.DateTimeFormat(latn(locale), { day: "numeric", month, year: "numeric" }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month, year: "numeric" }).format(d);
  }
}

// 4300 -> "4,300"; options as for Intl.NumberFormat (e.g. { minimumFractionDigits: 2 })
export function formatNumber(n, locale, options) {
  if (typeof n !== "number" || !isFinite(n)) return null;
  try {
    return new Intl.NumberFormat(latn(locale), options).format(n);
  } catch {
    return new Intl.NumberFormat("en-IN", options).format(n);
  }
}

// "2026-10-22" -> "Thu 22 Oct" (weekday, day, month in the chosen language, separated by spaces only)
export function formatWeekday(value, locale) {
  const d = toDate(value);
  if (!d) return null;
  try {
    return new Intl.DateTimeFormat(latn(locale), { weekday: "short", day: "numeric", month: "short" })
      .formatToParts(d)
      .filter((p) => p.type !== "literal")
      .map((p) => p.value)
      .join(" ");
  } catch {
    return null;
  }
}
