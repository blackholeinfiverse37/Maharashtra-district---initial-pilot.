import { useT } from "../i18n/LanguageContext";

// `district` and `crop` are the names to SHOW (in the chosen language).
export default function SystemStateBar({ status, district, crop }) {
  const t = useT();
  const styles = {
    idle:    "bg-gray-100 text-gray-500",
    loading: "bg-yellow-100 text-yellow-700",
    success: "bg-green-100 text-green-700",
    error:   "bg-[var(--color-warning-bg)] text-[var(--color-text)] border-l-[3px] border-[var(--color-warning-edge)]",
  };

  const messages = {
    idle:    t("status.idle"),
    loading: t("status.loading"),
    success: t("status.success", { district, crop }),
    error:   t("status.error"),
  };

  return (
    <div className={`rounded-lg px-4 py-2 font-medium ${styles[status]}`}>
      {status === "loading" && (
        <span className="inline-block animate-spin mr-2">⏳</span>
      )}
      {messages[status]}
    </div>
  );
}
