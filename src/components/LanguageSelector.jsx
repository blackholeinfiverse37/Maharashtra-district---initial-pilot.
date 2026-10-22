import { useLanguage, useT } from "../i18n/LanguageContext";
import { DEFAULT_LANGUAGE } from "../i18n/languages";

// The language picker. It lists only the languages whose dashboard words are translated (languages.js decides),
// each in its own name and script. Any language other than English says its translation is still being reviewed.
export default function LanguageSelector() {
  const { lang, selectable, setLanguage } = useLanguage();
  const t = useT();

  return (
    <div>
      <label className="field-label" htmlFor="language-select">
        {t("field.language")}
      </label>
      <select
        id="language-select"
        className="field-select language-select"
        value={lang}
        onChange={(e) => setLanguage(e.target.value)}
      >
        {selectable.map((l) => (
          <option key={l.code} value={l.code} lang={l.code} dir={l.dir}>
            {l.name}
          </option>
        ))}
      </select>
      {lang !== DEFAULT_LANGUAGE && <p className="card-small">{t("app.reviewNote")}</p>}
    </div>
  );
}
