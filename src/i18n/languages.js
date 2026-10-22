// Every language the dashboard knows about, in one place. Components never list languages themselves.
//
// To add a new language:
//   1. Add (or enable) its entry below: its code, its own name in its own script, its text direction and its locale.
//   2. Add its strings file with the dashboard's own words in that language (src/i18n/strings/<code>.js, the same keys
//      as en.js; any key it leaves out falls back to English) and register it in src/i18n/strings/index.js.
//   3. Get a native speaker to review that file (docs/translations_for_review.csv lists every sentence).
//   4. Set `dashboardStrings: true`. Only then does it appear in the language selector.
//   5. Set `backend: true` once the AIAIC backend supports it. The app also reads the backend's list from
//      /openapi.json when it starts, and that list wins when it can be read.
//
// code             the language code sent to the backend as `lang` (ISO 639-1)
// name             the language's own name, in its own script, as shown in the selector
// dir              "ltr" or "rtl"
// locale           the tag used for dates (month names) and numbers
// dashboardStrings true when the dashboard's own words are translated and reviewed
// backend          true when the backend can answer in this language

export const DEFAULT_LANGUAGE = "en";

export const LANGUAGES = [
  { code: "en", name: "English", dir: "ltr", locale: "en-IN", dashboardStrings: true, backend: true },
  { code: "hi", name: "हिन्दी", dir: "ltr", locale: "hi-IN", dashboardStrings: true, backend: true },
  { code: "mr", name: "मराठी", dir: "ltr", locale: "mr-IN", dashboardStrings: true, backend: true },

  // Placeholders: not offered yet (no reviewed strings, no backend support)
  { code: "gu", name: "ગુજરાતી", dir: "ltr", locale: "gu-IN", dashboardStrings: false, backend: false },
  { code: "kn", name: "ಕನ್ನಡ", dir: "ltr", locale: "kn-IN", dashboardStrings: false, backend: false },
  { code: "te", name: "తెలుగు", dir: "ltr", locale: "te-IN", dashboardStrings: false, backend: false },
  { code: "ta", name: "தமிழ்", dir: "ltr", locale: "ta-IN", dashboardStrings: false, backend: false },
  { code: "ml", name: "മലയാളം", dir: "ltr", locale: "ml-IN", dashboardStrings: false, backend: false },
  { code: "bn", name: "বাংলা", dir: "ltr", locale: "bn-IN", dashboardStrings: false, backend: false },
  { code: "or", name: "ଓଡ଼ିଆ", dir: "ltr", locale: "or-IN", dashboardStrings: false, backend: false },
  { code: "pa", name: "ਪੰਜਾਬੀ", dir: "ltr", locale: "pa-IN", dashboardStrings: false, backend: false },
  { code: "as", name: "অসমীয়া", dir: "ltr", locale: "as-IN", dashboardStrings: false, backend: false },
  { code: "ur", name: "اردو", dir: "rtl", locale: "ur-IN", dashboardStrings: false, backend: false },
];

export const languageByCode = (code) =>
  LANGUAGES.find((l) => l.code === code) || LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE);

// The languages a person can pick: only those whose dashboard words are translated
export const selectableLanguages = () => LANGUAGES.filter((l) => l.dashboardStrings);

// The backend languages as the config file states them (used when /openapi.json cannot be read)
export const configBackendCodes = () => LANGUAGES.filter((l) => l.backend).map((l) => l.code);
