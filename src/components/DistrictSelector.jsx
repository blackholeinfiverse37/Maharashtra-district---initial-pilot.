// DistrictSelector.jsx: the state's districts, as AIAIC lists them (current names). Each name is shown in the chosen
// language; the value is always the English name (name_en), which is what the backend is sent.
import { useT } from "../i18n/LanguageContext";

export default function DistrictSelector({ options = [], value, onChange }) {
  const t = useT();
  return (
    <div>
      <label className="field-label">{t("field.district")}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-select"
      >
        <option value="">{t("field.selectDistrict")}</option>
        {options.map((d) => (
          <option key={d.key} value={d.name_en}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}
