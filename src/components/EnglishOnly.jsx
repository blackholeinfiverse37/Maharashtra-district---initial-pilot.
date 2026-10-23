// Lines AIAIC has only in English, on a Marathi or Hindi page (23 Oct 2026): never mixed into her language, never
// hidden either. One small counted line; the English opens on a tap. Nothing is shown when there is none.
import { useT } from "../i18n/LanguageContext";

export default function EnglishOnly({ lines }) {
  const t = useT();
  const list = (Array.isArray(lines) ? lines : [lines]).filter((l) => typeof l === "string" && l.trim());
  if (list.length === 0) return null;
  return (
    <details className="english-only">
      <summary className="card-small">{t("common.englishOnly", { n: list.length })}</summary>
      {list.map((line, i) => (
        <p key={i} className="card-small" lang="en">
          {line}
        </p>
      ))}
    </details>
  );
}
