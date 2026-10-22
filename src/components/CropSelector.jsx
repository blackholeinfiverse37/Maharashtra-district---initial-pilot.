// CropSelector.jsx: the crops AIAIC offers for the chosen district, in its order (grown or traded there). Each crop is
// shown by its name in the chosen language; the value is always its key.
import { useT } from "../i18n/LanguageContext";

export default function CropSelector({ options = [], value, onChange, disabled = false }) {
  const t = useT();
  return (
    <div>
      <label className="field-label">{t("field.crop")}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="field-select"
      >
        <option value="">{disabled ? t("field.chooseDistrictFirst") : t("field.selectCrop")}</option>
        {options.map((c) => (
          <option key={c.key} value={c.key}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
