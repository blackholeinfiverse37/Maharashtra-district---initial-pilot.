// When the weather service returns no answer, show the backend's own reason, as written. With weather data, nothing
// is shown here for now.
export default function WeatherNotePanel({ data }) {
  const reason = data?.na_reasons?.weather?.text;
  if ((data?.weather || []).length > 0 || !reason) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-600">Weather</h3>
      <p className="text-sm text-gray-500 mt-2">{reason}</p>
    </div>
  );
}
