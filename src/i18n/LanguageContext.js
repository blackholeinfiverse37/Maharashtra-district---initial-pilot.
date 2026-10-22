import { createContext, useCallback, useContext } from "react";
import { DEFAULT_LANGUAGE, languageByCode } from "./languages";
import { translate } from "./translate";

const fallback = languageByCode(DEFAULT_LANGUAGE);

// The chosen language, shared by the whole app. Without a provider (e.g. in a test) it is English.
export const LanguageContext = createContext({
  lang: fallback.code, // the language the person chose
  apiLang: fallback.code, // the language sent to the backend (the chosen one, or English if the backend lacks it)
  locale: fallback.locale, // for dates and numbers
  dir: fallback.dir,
  showsEnglishNote: false, // true when the backend does not support the chosen language
  selectable: [fallback],
  setLanguage: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

// t(key, variables, fallback): the dashboard's own words in the chosen language (see translate.js)
// (the same function until the language changes, so it can be an effect's dependency)
export const useT = () => {
  const { lang } = useContext(LanguageContext);
  return useCallback((key, variables, fallback) => translate(lang, key, variables, fallback), [lang]);
};
