import { STRINGS } from "./strings";

// t(key, variables): the dashboard's own text in the chosen language, with {name} filled in from `variables`.
// A key missing in that language falls back to English; a key missing everywhere gives `fallback` (or the key itself,
// so a gap is visible). A variable that is missing becomes empty text, never "undefined".
export function translate(lang, key, variables = {}, fallback) {
  const text = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? fallback ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => {
    const v = variables[name];
    return v === undefined || v === null ? "" : String(v);
  });
}
