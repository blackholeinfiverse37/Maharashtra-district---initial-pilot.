// AIAIC's own words, in the chosen language (23 Oct 2026).
//
// Each AIAIC answer has two parts: the engine's RECORD (the decision, its labels, its warnings and its evidence), which
// is in English in every language by design, and its SUMMARY in the language asked (`summary`). In Marathi and Hindi
// this page shows the summary's words, never the record's English. Every function here reads AIAIC's own fields; none
// translates anything. A line AIAIC still has only in English is kept apart (counted, behind a tap: EnglishOnly.jsx),
// never mixed into a Marathi or Hindi sentence and never dropped.

export const isEnglish = (lang) => !lang || lang === "en";

// The answer's one-line action ("Sell at APMC Lasalgaon", "APMC Lasalgaon येथे विका"), from the summary. In English the
// engine's own label stands in when a server sends no summary; in Marathi and Hindi nothing English stands in.
export function actionText(item, lang) {
  const text = item?.summary?.action?.text;
  if (typeof text === "string" && text.trim()) return text;
  return isEnglish(lang) ? item?.recommendation_detail || null : null;
}

// The mandi a market answer chose, by name (a proper name, shown as AIAIC writes it): the "chosen" row of the summary's
// own price comparison, else the engine's fixed label "Sell at <mandi>" of a SELL_AT_MANDI answer (the rule AIAIC's
// summary itself uses). Any other answer names no mandi, and no English sentence takes its place.
export function chosenMandi(market) {
  const row = (market?.summary?.price_compare?.rows || []).find((r) => r?.role === "chosen");
  if (row?.mandi) return row.mandi;
  const label = market?.recommendation_detail;
  if (market?.recommendation === "SELL_AT_MANDI" && typeof label === "string" && label.startsWith("Sell at ")) {
    return label.slice("Sell at ".length).trim() || null;
  }
  return null;
}

// The name to show for a source, as { text, title }. English: the publisher's own title, as sent. Marathi and Hindi:
// the page's short name for that source (by its id, `source.<id>` in the strings files), with the publisher's title
// kept as the tooltip; a source the strings files do not name keeps its title.
export function sourceName(source, lang, t) {
  const title = source?.source_name || "";
  if (isEnglish(lang) || !source?.source_id) return { text: title, title: null };
  const label = t(`source.${source.source_id}`, {}, "");
  return label ? { text: label, title: title || null } : { text: title, title: null };
}

// The warnings AIAIC marks as changing what a person does, as { shown, englishOnly }. English: the engine's own list
// (`read_these_first`), as before. Marathi and Hindi: the same warnings as the summary says them (its caveats marked
// `priority`, without the confidence-cap lines the English card never showed); one the summary has only in English is
// counted apart. With no summary at all, every warning is counted apart, never dropped.
export function mustRead(item, lang, apiLang) {
  const engine = Array.isArray(item?.read_these_first) ? item.read_these_first : [];
  if (isEnglish(lang)) return { shown: [...engine], englishOnly: [] };
  if (!item?.summary) return { shown: [], englishOnly: [...engine] };
  const caveats = ((item.summary.sections || []).find((s) => s?.id === "caveats") || {}).items || [];
  const caps = new Set(item.summary.confidence?.cap_reasons || []);
  const priority = caveats.filter((c) => c?.priority && typeof c.text === "string" && !caps.has(c.text));
  const said = apiLang || lang;
  return {
    shown: priority.filter((c) => c.lang === said).map((c) => c.text),
    englishOnly: priority.filter((c) => c.lang !== said).map((c) => c.text),
  };
}

// The crop answer's DES crop table in the page language, from its summary (`district_crops`):
//   name(desName)  the crop's name to show (DES's own name when the summary gives none)
//   isChosen(row)  true for a DES row of the chosen crop, by AIAIC's crop keys (else by English name, as before)
//   note, noteEnglishOnly  DES's coverage note in the page language, or the English one to count apart
export function desCrops(cropItem, { lang, apiLang, cropKey, cropEn, crop }) {
  const block = cropItem?.summary?.district_crops;
  const byName = new Map((block?.names || []).map((n) => [n.crop, n]));
  const english = isEnglish(lang);
  const apy = cropItem?.supporting_evidence?.district_crop_apy;
  const wanted = [cropKey, cropItem?.subject?.crop].filter(Boolean);
  const lookFor = (cropEn || crop || "").toLowerCase();
  const isChosen = (row) => {
    const keys = byName.get(row?.crop)?.keys;
    if (Array.isArray(keys) && keys.length && wanted.length) return wanted.some((k) => keys.includes(k));
    return !!row?.crop && row.crop.toLowerCase() === lookFor;
  };
  const name = (desName) => (english ? desName : byName.get(desName)?.name || desName);
  let note = english ? apy?.coverage_note || null : null;
  let noteEnglishOnly = null;
  if (!english && block?.coverage_note) {
    if (block.coverage_note_lang === (apiLang || lang)) note = block.coverage_note;
    else noteEnglishOnly = block.coverage_note;
  } else if (!english && apy?.coverage_note) {
    noteEnglishOnly = apy.coverage_note;
  }
  return { name, isChosen, note, noteEnglishOnly };
}

// The illustrative storage scenario's words, as { headline, note, englishOnly }. English: its code and its note, as
// before. Marathi and Hindi: from the summary (`illustrative_scenario`); what the summary has only in English (or, from
// a server without it, the code and the note) is counted apart.
export function scenarioWords(storage, sim, lang, apiLang) {
  const codeWords = (sim?.recommendation || "").replace(/_/g, " ").toLowerCase();
  if (isEnglish(lang)) return { headline: codeWords, note: sim?.note || null, englishOnly: [] };
  const block = storage?.summary?.illustrative_scenario;
  if (!block) return { headline: null, note: null, englishOnly: [codeWords, sim?.note].filter(Boolean) };
  const own = block.note_lang === (apiLang || lang);
  return {
    headline: block.text || null,
    note: own ? block.note || null : null,
    englishOnly: own || !block.note ? [] : [block.note],
  };
}
