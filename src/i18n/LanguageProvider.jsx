import { useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./LanguageContext";
import { DEFAULT_LANGUAGE, configBackendCodes, languageByCode, selectableLanguages } from "./languages";
import { fetchBackendLanguages } from "../data_adapter/aiaicApi";

const STORAGE_KEY = "aiaic.lang";

// The remembered language, if it can still be chosen; otherwise the default. Storage may be blocked: never crash.
const initialLanguage = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && selectableLanguages().some((l) => l.code === saved)) return saved;
  } catch {
    // storage not available: use the default
  }
  return DEFAULT_LANGUAGE;
};

export default function LanguageProvider({ children }) {
  const [lang, setLang] = useState(initialLanguage);
  const [backendCodes, setBackendCodes] = useState(configBackendCodes);

  // The backend's own list of languages, read once at start; on failure the config file's flags stay in use
  useEffect(() => {
    let cancelled = false;
    fetchBackendLanguages()
      .then((codes) => !cancelled && codes.length > 0 && setBackendCodes(codes))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const language = languageByCode(lang);

  // The page's own language and direction, for screen readers, fonts and right-to-left scripts
  useEffect(() => {
    document.documentElement.lang = language.code;
    document.documentElement.dir = language.dir;
  }, [language.code, language.dir]);

  const value = useMemo(() => {
    const apiLang = backendCodes.includes(language.code) ? language.code : DEFAULT_LANGUAGE;
    return {
      lang: language.code,
      apiLang,
      locale: language.locale,
      dir: language.dir,
      showsEnglishNote: apiLang !== language.code,
      selectable: selectableLanguages(),
      setLanguage: (code) => {
        if (!selectableLanguages().some((l) => l.code === code)) return;
        setLang(code);
        try {
          window.localStorage.setItem(STORAGE_KEY, code);
        } catch {
          // storage not available: the choice lasts for this visit only
        }
      },
    };
  }, [language, backendCodes]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
