// Temporary. Remove when the backend stops sending this wording.
//
// The backend tells the farmer "we did not ask" whether they can store. The dashboard removes only that wording, in
// two places, and leaves every other word the backend sends as it is:
//   1. answer sentences (the At a glance storage row, the storage card's answer line): the bracket or clause that
//      says "we did not ask" is removed, and an empty bracket or dangling comma / "and" left behind is tidied;
//   2. the storage warnings: the one whose heading says the farmer was not asked whether they can store is not shown,
//      and the warning "IF YOU CAN STORE, THIS IS NOT YOUR ANSWER" loses its last reason, "because you were not asked".
// It also hides one long storage warning, "PRICE IS NOT <DISTRICT>'S", which the card replaces with a short line.
// Each phrase is listed as the backend sends it in English, Hindi and Marathi (checked live, 22 Oct 2026).

// A whole bracket that only says "we did not ask": "Sell now, unless you can store (we did not ask)"
const WHOLE_BRACKETS = [
  /\s*\(\s*we did not ask\s*\)/gi,
  /\s*\(\s*यह हमने नहीं पूछा\s*\)/g,
  /\s*\(\s*हे आम्ही विचारले नाही\s*\)/g,
];

// A clause inside a longer bracket: "(storing is not offered for this crop, and we did not ask about your storage)"
const CLAUSES = [
  /,?\s*and we did not ask about your storage/gi,
  /,?\s*और आपके भंडारण के बारे में हमने नहीं पूछा/g,
  /,?\s*आणि तुमच्या साठवणुकीबद्दल आम्ही विचारले नाही/g,
  // …or first in a bracket, before a ";": "Sell now (we did not ask about your storage; holding did not pay here in a
  // typical year)" -> "Sell now (holding did not pay here in a typical year)" (checked live, Latur gram, 24 Oct 2026)
  /we did not ask about your storage\s*;\s*/gi,
  /आपके भंडारण के बारे में हमने नहीं पूछा\s*;\s*/g,
  /तुमच्या साठवणुकीबद्दल आम्ही विचारले नाही\s*;\s*/g,
];

// The heading of the warning that is not shown: "YOU WERE NOT ASKED WHETHER YOU CAN STORE. …"
const NOT_ASKED_WARNING_HEADINGS = [
  /^\s*YOU WERE NOT ASKED WHETHER YOU CAN STORE\b/i,
  /^\s*आपसे पूछा नहीं गया कि आप भंडारण कर सकते हैं या नहीं/,
  /^\s*तुम्ही साठवू शकता का, हे तुम्हाला विचारलेले नाही/,
];

// The warning "IF YOU CAN STORE, THIS IS NOT YOUR ANSWER. …" stays, but its reason "because you were not asked" goes.
// Only a warning with one of these headings is changed.
const IF_YOU_CAN_STORE_HEADINGS = [
  /^\s*IF YOU CAN STORE, THIS IS NOT YOUR ANSWER\b/i,
  /^\s*अगर आप भंडारण कर सकते हैं, तो यह आपका उत्तर नहीं/,
  /^\s*तुम्ही साठवू शकत असाल, तर हे तुमचे उत्तर नाही/,
];
// "…assumes you have no storage because you were not asked." -> "…assumes you have no storage."
const NOT_ASKED_REASONS = [
  /,?\s*because you were not asked(?=\s*\.?\s*$)/i,
  /,?\s*you were not asked(?=\s*\.?\s*$)/i,
  /,?\s*क्योंकि आपसे पूछा नहीं गया(?=\s*[।.]?\s*$)/,
  /तुम्हाला विचारलेले नसल्यामुळे\s+/, // Marathi puts the reason first: "…; तुम्हाला विचारलेले नसल्यामुळे वरील शिफारस…"
];

// What a removal can leave behind, in the three languages
const LEFTOVER_AND = /,?\s*(?:and|और|आणि)\s*\)/gi;

// The sentence without its "we did not ask" bracket or clause; anything else stays exactly as sent
export function removeWeDidNotAsk(text) {
  if (typeof text !== "string") return text;
  let out = text;
  for (const re of [...WHOLE_BRACKETS, ...CLAUSES]) out = out.replace(re, "");
  if (out === text) return text; // nothing removed: the sentence is untouched
  return out
    .replace(LEFTOVER_AND, ")") // "(…, and)" -> "(…)"
    .replace(/,\s*\)/g, ")") // "(…,)" -> "(…)"
    .replace(/\(\s*,\s*/g, "(") // "(, …)" -> "(…)"
    .replace(/\s*\(\s*\)/g, "") // an empty bracket
    .replace(/\s{2,}/g, " ")
    .trim();
}

// The "IF YOU CAN STORE, THIS IS NOT YOUR ANSWER" warning without its "because you were not asked" reason; any other
// warning is returned exactly as sent
export function removeNotAskedReason(text) {
  if (typeof text !== "string" || !IF_YOU_CAN_STORE_HEADINGS.some((re) => re.test(text))) return text;
  let out = text;
  for (const re of NOT_ASKED_REASONS) out = out.replace(re, "");
  return out === text ? text : out.replace(/\s{2,}/g, " ").trim();
}

// True for the storage warning that says the farmer was not asked whether they can store
export function isNotAskedWarning(text) {
  return typeof text === "string" && NOT_ASKED_WARNING_HEADINGS.some((re) => re.test(text));
}

// The long storage warning "PRICE IS NOT <DISTRICT>'S: the rupee figures on this card are <mandi> (<district>) — the
// median mandi for <crop> statewide — …" is not shown; the storage card says the same in one short line of its own
// (storage.priceFromMedian). Checked live in English, Hindi and Marathi, 24 Oct 2026.
const PRICE_NOT_DISTRICT_HEADINGS = [
  /^\s*PRICE IS NOT\b[^:]*:/i,
  /^\s*भाव\s[^:]*\sका नहीं है\s*:/,
  /^\s*हा भाव\s[^:]*\sनाही\s*:/,
];

// True for the storage warning that says the card's prices are not the district's own
export function isPriceNotDistrictWarning(text) {
  return typeof text === "string" && PRICE_NOT_DISTRICT_HEADINGS.some((re) => re.test(text));
}
