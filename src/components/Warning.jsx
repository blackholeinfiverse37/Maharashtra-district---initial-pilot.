// One warning, in the shared amber style. The text is shown in full, exactly as given: only its first part (up to the
// first ":" or the end of the first sentence, "." or the Hindi "।") is set in bold. A "." inside a number such as
// "57.59" is not a split.
export default function Warning({ text }) {
  if (typeof text !== "string" || !text.trim()) return null;

  const match = text.match(/^(.*?(?::|।|\.(?=\s|$)))(\s[\s\S]*)?$/);
  const lead = match ? match[1] : "";
  const rest = match ? match[2] || "" : text;

  return (
    <p className="warning">
      {lead && <span className="warning-lead">{lead}</span>}
      {rest}
    </p>
  );
}
